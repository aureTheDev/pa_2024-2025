from calendar import monthrange

from fastapi import HTTPException
from .user import User
from queries.collaborator_queries import CollaboratorQuery
from service.logging import logging
from models.local.periode import PeriodeSchema
from datetime import timedelta, datetime, timezone, date, time
from typing import Optional
from models.database.donations_model import Donation
from models.api.donation import DonationRequest
from .pdf_generator import PDFGenerator
import uuid
import os
import stripe
from fpdf import FPDF
from fpdf.errors import FPDFUnicodeEncodingException
from models.database.medical_appointments_model import MedicalAppointmentTable

logger = logging.getLogger(__name__)

class Collaborator(User):
    def __init__(self, collaborator_query: CollaboratorQuery, token: str):

        super().__init__(collaborator_query, token)

        if self.function != "collaborator":
            logger.warning("User %s function  is not the same as in token %s : collaborator", self.user_id, self.function)
            raise HTTPException(status_code=403, detail="Forbidden")

        if self.verified is False:
            raise HTTPException(status_code=403, detail="Please verify your email")

        self.query = collaborator_query

        req = self.query.read_collaborator_by_id(self.user_id)

        if req is None:
            logger.warning("An invalid token has been forged : %s", self.user_id)
            raise HTTPException(status_code=401, detail="Token is invalid")

        self.firstname = req.firstname
        self.lastname = req.lastname
        self.dob = req.dob
        self.phone = req.phone
        self.email = req.email
        self.role = req.role
        self.country = req.country
        self.city = req.city
        self.street = req.street
        self.pc = req.pc
        self.verified = req.verified
        self.password = req.password
        self.inscription_date = req.inscription_date

        self.collaborator_id = req.collaborator_id
        self.company_id = req.company_id

    def find_medical_contractor(self):
        result = self.query.read_medical_contractor()
        if result is False:
            raise HTTPException(status_code=404, detail="No medical contractor found")
        return result

    def find_contractor_planning_by_id(self, contractor_id: str, week_start: str = None):

        test = self.query.read_contractor_by_id(contractor_id)
        if not test:
            raise HTTPException(status_code=404, detail="Contractor not found")

        results1 = self.query.read_contractor_appointment_by_contractor_id(contractor_id)
        results2 = self.query.read_contractor_calendar_by_contractor_id(contractor_id)

        calendar = []
        now = datetime.now(timezone.utc)

        if week_start:
            try:
                week_start_dt = datetime.strptime(week_start, "%Y-%m-%d")
                week_start_dt = week_start_dt.replace(tzinfo=timezone.utc)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid weekStart format, expected YYYY-MM-DD")
            week_end_dt = week_start_dt + timedelta(days=7)

        for result in results1:
            appointment_date = result.medical_appointment_date
            if appointment_date.tzinfo is None:
                appointment_date = appointment_date.replace(tzinfo=timezone.utc)

            appointment_end = appointment_date + timedelta(minutes=30)
            if week_start:
                if appointment_date >= week_end_dt or appointment_end <= week_start_dt:
                    continue
            else:
                if appointment_date < now:
                    continue
            periode = PeriodeSchema(
                beginning=appointment_date,
                end=appointment_end
            )
            calendar.append(periode)

        for result in results2:
            unvailable_begin = result.unvailable_begin_date
            unvailable_end = result.unvailable_end_date

            if unvailable_begin.tzinfo is None:
                unvailable_begin = unvailable_begin.replace(tzinfo=timezone.utc)
            if unvailable_end.tzinfo is None:
                unvailable_end = unvailable_end.replace(tzinfo=timezone.utc)
            if week_start:

                if unvailable_end <= week_start_dt or unvailable_begin >= week_end_dt:
                    continue
            else:
                if unvailable_begin < now:
                    continue
            periode = PeriodeSchema(
                beginning=unvailable_begin,
                end=unvailable_end
            )
            calendar.append(periode)

        return calendar


    def checkout_medical_appointment(self, appointment_dt: datetime, contractor_id: str, appointment_type: str):
        contractor = self.query.read_contractor_by_id(contractor_id)
        if not contractor:
            raise HTTPException(status_code=404, detail="Contractor not found")

        if contractor.intervention == "incall" and appointment_type == "outcall" or \
                contractor.intervention == "outcall" and appointment_type == "incall":
            raise HTTPException(status_code=400, detail="Intervention is invalide")


        appointment_end = appointment_dt + timedelta(minutes=30)


        week_start_dt = appointment_dt - timedelta(days=appointment_dt.weekday())
        week_start_str = week_start_dt.strftime("%Y-%m-%d")

        planning = self.find_contractor_planning_by_id(contractor_id, week_start=week_start_str)

        for periode in planning:
            if periode.beginning <= appointment_dt < periode.end or \
                    periode.beginning < appointment_end <= periode.end:
                raise HTTPException(status_code=400, detail="The requested appointment time overlaps with an unavailable period")

        number = self.get_available_free_medical_appointment()

        if number > 0:
            try:
                contractor = self.query.read_contractor_by_id(contractor_id)
                address = f"{contractor.street} - {contractor.city} - {contractor.country}"
                file = self.create_medical_appointment_bill(
                    contractor.firstname,
                    contractor.lastname,
                    address,
                    datetime.now(timezone.utc),
                    contractor.registration_number,
                    contractor.service_price
                )
                appointment_id = str(uuid.uuid4())
                appointment = MedicalAppointmentTable(
                    medical_appointment_id=appointment_id,
                    contractor_id=contractor_id,
                    collaborator_id=self.user_id,
                    medical_appointment_date=appointment_dt,
                    appointment_type=appointment_type,
                    creation_date=datetime.now(timezone.utc),
                    status='PAYED',
                    price=contractor.service_price,
                    bill_file=file,
                    place=appointment_type
                )
                res = self.query.create_medical_appointment(appointment)
                if not res:
                    raise HTTPException(status_code=500, detail="Failed to create medical appointment")
                print(f"Successfully created medical appointment: {appointment_id}")

                return {"message": "appointment successfully booked"}

            except Exception as e:
                logging.error(f"Error creating medical appointment: {e}")


        stripe.api_key = os.environ.get("STRIPE_SECRET_KEY")
        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="payment",
                line_items=[{
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": f'Consultation chez {contractor.firstname} {contractor.lastname}',
                        },
                        "unit_amount": int(contractor.service_price * 100),
                    },
                    "quantity": 1,
                }],
                success_url=f"https://www.{os.environ.get('DOMAIN')}/salaries/accueil?payment_status=success",
                cancel_url=f"https://www.{os.environ.get('DOMAIN')}/salaries/accueil?payment_status=cancel",
                payment_intent_data={
                    # Transfert du paiement vers le compte Stripe du prestataire (contractor)
                    "transfer_data": {
                        "destination": contractor.stripe_id,
                    }
                },
                metadata={
                    "origin": "book-medical-appointment",
                    "appointment_id": str(uuid.uuid4()),
                    "contractor_id": contractor.contractor_id,
                    "collaborator_id": self.user_id,
                    "appointment_datetime_utc": appointment_dt.isoformat(),
                    "appointment_type": appointment_type,
                    "token": self.token
                }
            )
        except stripe.error.StripeError as e:
            print(f"Stripe error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            print(f"Error creating Stripe session: {str(e)}")
            raise HTTPException(status_code=500, detail="An internal error occurred while preparing the payment.")

        return {"checkout_session_id": checkout_session.id}

    def list_ngos(self):
        return self.query.get_all_ngos()

    def get_events_by_ngo(self, ngo_id: str):
        return self.query.get_events_by_ngo(ngo_id)

    def get_joined_event_ids(self):
        return self.query.get_booked_events_by_collaborator(self.user_id)

    def join_event(self, event_id: str):
        if self.query.is_event_full(event_id):
            raise HTTPException(status_code=400, detail="Événement complet")

        already_joined = event_id in self.get_joined_event_ids()
        if already_joined:
            raise HTTPException(status_code=409, detail="Déjà inscrit")

        return self.query.join_event(event_id, self.user_id)

    def leave_event(self, event_id: str):
        return self.query.leave_event(event_id, self.user_id)

    def make_donation(self, request: DonationRequest):

        if request.donation_type not in ["physique", "argent"]:
            raise HTTPException(status_code=400, detail="Type de don invalide")

        bill_file = None
        if request.donation_type == "argent":
            if not request.amount or not request.billing_name or not request.billing_address or not request.iban:
                raise HTTPException(status_code=400, detail="Champs manquants pour le don d'argent")

            file_name = f"bill_{uuid.uuid4().hex}.pdf"
            upload_dir = os.path.join(os.getcwd(), "uploads")
            os.makedirs(upload_dir, exist_ok=True)
            full_path = os.path.join(upload_dir, file_name)

            PDFGenerator.generate_pdf_bill(request.dict(), full_path)

            bill_file = os.path.join("/uploads", file_name)

        donation = Donation(
            collaborator_id=self.user_id,
            ngo_id=request.ngo_id,
            donation_type=request.donation_type,
            amount=request.amount,
            billing_name=request.billing_name,
            billing_address=request.billing_address,
            iban=request.iban,
            bill_file=bill_file
        )

        with self.query.get_session() as session:
            created = self.query.create_donation(session, donation)
        return {"message": "Merci pour votre don !", "donation": created}


    def create_medical_appointment_bill(self, nom, prenom, adresse, date_facture_obj, kbis, prix_total, dossier_sortie="/app/uploads/medical_bill"):

        class PDFInvoice(FPDF):
            def header(self):
                # Pas d'en-tête par défaut pour cet exemple simple de facture,
                # mais vous pourriez mettre un logo ici.
                # self.image('logo.png', 10, 8, 33)
                # self.set_font('Arial', 'B', 15)
                # self.cell(80)
                # self.cell(30, 10, 'Titre', 1, 0, 'C')
                # self.ln(20)
                pass

            def footer(self):
                # Position à 1.5 cm du bas
                self.set_y(-15)
                self.set_font('Arial', 'I', 8)
                # Numéro de page
                self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

        try:
            # Utilisez FPDF directement ou votre classe PDFInvoice si elle est définie
            pdf = PDFInvoice('P', 'mm', 'A4')  # Ou pdf = FPDF(...) si pas de classe perso
            pdf.alias_nb_pages()  # Important pour le {nb} dans le footer

            # --- PAS BESOIN DE add_font ---
            # pdf.add_font(...) # <--- Supprimez ces lignes

            pdf.add_page()
            # --- UTILISEZ UNE POLICE DE BASE ---
            pdf.set_font('Helvetica', '', 10)  # Ou 'Arial', 'Times', 'Courier'

            # --- FORMAT DU TEXTE SANS CARACTERES SPECIAUX (€) ---
            pdf.set_font('Helvetica', 'B', 12)
            pdf.cell(0, 7, "Details de la facture", ln=1,
                     align='L')  # Attention aux accents si vous utilisez strictement latin-1
            pdf.set_font('Helvetica', '', 10)
            client_info = f"Client: {prenom} {nom}"
            adresse_info = f"Adresse: {adresse}"  # Vérifiez les accents dans l'adresse aussi!
            date_info = f"Date: {date_facture_obj.strftime('%d/%m/%Y')}"
            kbis_info = f"KBIS: {kbis}"
            # Remplacez '€'
            total_info = f"Montant Total (EUR): {prix_total:.2f}"  # Ou "Montant Total: ..."

            pdf.cell(0, 7, client_info, ln=1, align='L')
            # Utilisez encode('latin-1', 'replace') pour être sûr si l'adresse peut contenir des choses bizarres
            # pdf.multi_cell(0, 7, adresse_info.encode('latin-1', 'replace').decode('latin-1'), ln=1, align='L')
            # Ou plus simplement, assurez-vous que l'adresse n'a pas de caractères problématiques
            pdf.multi_cell(0, 7, adresse_info, border=0, ln=1,
                           align='L')  # Utilisez multi_cell pour les adresses sur plusieurs lignes
            pdf.cell(0, 7, date_info, ln=1, align='L')
            pdf.cell(0, 7, kbis_info, ln=1, align='L')
            pdf.cell(0, 7, total_info, ln=1, align='L')
            # ... (fin de la logique de création de PDF) ...

            os.makedirs(dossier_sortie, exist_ok=True)
            nom_fichier_pdf = f"facture_{nom}_{prenom}_{uuid.uuid4()}.pdf"
            chemin_fichier_complet = os.path.join(dossier_sortie, nom_fichier_pdf)

            # --- ENCODAGE explicite à la sortie (bonne pratique avec polices de base) ---
            # FPDF devrait gérer cela mais préciser peut aider dans certains cas
            # Bien que .output() gère souvent cela, soyez conscient des encodages
            pdf.output(chemin_fichier_complet, 'F')
            print(f"Facture PDF générée : {chemin_fichier_complet}")
            return nom_fichier_pdf

            # Gardez ce bloc au cas où un autre caractère inattendu poserait problème
        except FPDFUnicodeEncodingException as e:
            print(f"Erreur d'encodage FPDF (caractère non supporté par la police de base?): {e}.")
            import traceback
            traceback.print_exc()
            return None
        except Exception as e:
            import traceback
            print(f"Une erreur générale est survenue lors de la création de la facture PDF : {e}")
            traceback.print_exc()
            return None

    def find_medical_appointment(self, uuid, fromDate=None):
        filter_date = None
        if fromDate:
            try:
                # Si fromDate est une chaîne, on la convertit en datetime
                if isinstance(fromDate, str):
                    if fromDate.endswith("Z"):
                        fromDate = fromDate.replace("Z", "+00:00")
                    naive_filter_date = datetime.fromisoformat(fromDate)
                else:
                    # Sinon, c'est déjà un objet datetime
                    naive_filter_date = fromDate
                # Conversion en heure UTC
                filter_date = naive_filter_date.astimezone(timezone.utc)
            except Exception:
                raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")

        # Appel de la méthode qui récupère les rendez-vous
        naive_medical_appointments = self.query.read_medical_appointment(uuid, filter_date)

        aware_medical_appointments = []
        for appointment in naive_medical_appointments:
            # Si appointment est un objet ORM, vous pouvez utiliser __dict__ ou adapter selon votre implémentation
            appointment_data = dict(appointment.__dict__)

            if 'medical_appointment_date' in appointment_data and isinstance(
                    appointment_data['medical_appointment_date'], datetime):
                appointment_data['medical_appointment_date'] = appointment_data['medical_appointment_date'].astimezone(
                    timezone.utc)

            if 'creation_date' in appointment_data and isinstance(appointment_data['creation_date'], datetime):
                appointment_data['creation_date'] = appointment_data['creation_date'].astimezone(timezone.utc)

            aware_medical_appointments.append(appointment_data)

        return aware_medical_appointments

    def find_one_contractor(self, uuid):
        result = self.query.read_contractor_by_id(uuid)
        if result is False:
            raise HTTPException(status_code=404, detail="No medical contractor found")
        return result

    def cancel_medical_appointment(self, appointment_id: str):
        appointment = self.query.read_medical_appointment_by_appointment_id(appointment_id)

        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        if appointment.collaborator_id != self.user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        if appointment.medical_appointment_date.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Cannot cancel past appointments")

        appointment = self.query.update_medical_appointment_by_appointment_id(appointment_id, {"status": "CANCELED"})

        if appointment is None:
            raise HTTPException(status_code=500, detail="Internal server error")

        return {"message": "Appointment cancelled successfully"}


    def add_medical_appointment_note(self, note: int, medical_appointment_id: str):
        appointment = self.query.read_medical_appointment_by_appointment_id(medical_appointment_id)

        if not appointment:
            raise HTTPException(status_code=404, detail="Appointment not found")

        if appointment.collaborator_id != self.user_id:
            raise HTTPException(status_code=403, detail="Forbidden")

        if appointment.status == "CANCELED":
            raise HTTPException(status_code=400, detail="Cannot add note to canceled appointments")

        if appointment.note is not None:
            raise HTTPException(status_code=400, detail="Note already added")

        if note < 0 or note > 5:
            raise HTTPException(status_code=400, detail="Note must be between 0 and 5")

        appointment = self.query.update_medical_appointment_by_appointment_id(medical_appointment_id, {"note": note})

        if appointment is None:
            raise HTTPException(status_code=500, detail="Internal server error")

        return {"message": "Note added successfully"}

    from datetime import datetime
    from calendar import monthrange

    def get_period_boundaries(self, bill_date: datetime) -> (datetime, datetime):
        """
        Calcule la période mensuelle de validité à partir de bill_date.
        La période s'étend du jour bill_date.day jusqu'au même jour du mois suivant.
        Si ce jour n'existe pas dans le mois suivant, on prend le dernier jour du mois.
        """
        now = datetime.now(tz=bill_date.tzinfo)
        day = bill_date.day

        # Détermine le début de la période
        if now.day >= day:
            period_start = now.replace(day=day)
        else:
            # Si le jour courant est inférieur, on passe au mois précédent
            month = now.month - 1 if now.month > 1 else 12
            year = now.year if now.month > 1 else now.year - 1
            try:
                period_start = now.replace(year=year, month=month, day=day)
            except ValueError:
                last_day = monthrange(year, month)[1]
                period_start = now.replace(year=year, month=month, day=last_day)

        # Fin de la période : même jour du mois suivant
        month = period_start.month + 1
        year = period_start.year
        if month > 12:
            month = 1
            year += 1
        try:
            period_end = period_start.replace(year=year, month=month)
        except ValueError:
            last_day = monthrange(year, month)[1]
            period_end = period_start.replace(year=year, month=month, day=last_day)

        return period_start, period_end

    def get_available_free_medical_appointment(self):

        company_bill = self.query.read_company_bill_by_company_id_and_subscription_id(self.company_id)
        if not company_bill or not getattr(company_bill, "payed_date", None):
            return 0

        company_subscription = self.query.read_company_subscription_by_id(company_bill.company_subscription_id)
        if company_subscription.status != "ACTIVE":
            return 0

        packs = self.query.read_packs_by_id(company_subscription.pack_id)
        if not packs or not getattr(packs, "default_consultation_number", None):
            return 0

        # Vérifier que la date actuelle est dans la période d'un an à partir de la date de paiement.
        now = datetime.now(tz=company_bill.payed_date.tzinfo)
        try:
            subscription_end = company_bill.payed_date.replace(year=company_bill.payed_date.year + 1)
        except ValueError:
            # Gestion du cas particulier (par exemple 29 février)
            last_day = monthrange(company_bill.payed_date.year + 1, company_bill.payed_date.month)[1]
            subscription_end = company_bill.payed_date.replace(year=company_bill.payed_date.year + 1, day=last_day)
        if now > subscription_end:
            return 0

        period_start, period_end = self.get_period_boundaries(company_bill.payed_date)

        appointments = self.query.read_medical_appointment(self.user_id, filter_date=company_bill.payed_date)
        if not appointments:
            appointments = []

        monthly_appointments = [
            appointment for appointment in appointments
            if period_start <= appointment.medical_appointment_date < period_end
        ]
        count_appointments = len(monthly_appointments)

        free_consultations = packs.default_consultation_number

        remaining_free_appointments = free_consultations - count_appointments
        return remaining_free_appointments if remaining_free_appointments >= 0 else 0

