# service/contractor.py
import base64
from queries.user_queries import UserQuery
from service.user import User
from queries.contractor_queries import ContractorQueries
from fastapi import HTTPException
from uuid import uuid4
from datetime import datetime, timezone, timedelta
from typing import Optional
from models.api.sign_in import ContractorSignInRequest, SignInRequest
import random, string
from models.local.user import ContractorSchema
import uuid
from models.database.calendars_model import CalendarTable
from models.local.periode import PeriodeSchema
import os
from reportlab.pdfgen import canvas
from PIL import Image
import io


class Contractor(User):
    def __init__(self,contractor_query: ContractorQueries, token: Optional[str] = None):
        super().__init__(contractor_query, token)
        self.contractor_query = contractor_query
        if token is None:
            self.registration_number = None
            self.registration_date = None
            self.contract_file = None
            self.sign_date = None
            self.service = None
            self.service_price = None
            self.website = None
            self.intervention = None
            self.type = None
            self.admin_id = None
        else:
            result = self.contractor_query.read_contractor_by_id(self.user_id)
            if result is None:
                raise HTTPException(status_code=401, detail="Token is invalid")

            if self.verified is False:
                raise HTTPException(status_code=403, detail="Please verify your email")


            self.firstname = result.firstname
            self.lastname = result.lastname
            self.dob = result.dob
            self.phone = result.phone
            self.email = result.email
            self.role = result.role
            self.country = result.country
            self.city = result.city
            self.street = result.street
            self.pc = result.pc
            self.verified = result.verified
            self.password = result.password
            self.inscription_date = result.inscription_date

            self.contractor_id = result.contractor_id
            self.registration_number = result.registration_number
            self.registration_date = result.registration_date
            self.contract_file = result.contract_file if result.contract_file else None
            self.sign_date = result.sign_date if result.sign_date else None
            self.service = result.service
            self.service_price = result.service_price
            self.website = result.website
            self.intervention = result.intervention
            self.type = result.type
            self.stripe_id = result.stripe_id
            self.admin_id = result.admin_id


    def sign_in(self, data: ContractorSignInRequest):

        existing_contractor_by_registration_number = self.contractor_query.read_contractor_by_registration_number(data.registration_number)

        if existing_contractor_by_registration_number:
            raise HTTPException(
                status_code=409,
                detail="An account with these informations already exists."
            )

        user_id = super().sign_in(data)

        contractor_data = data.dict()
        contractor_data.update({
            "contractor_id": user_id,
            "user_id": user_id,
            "verified": False,
            "inscription_date": datetime.now()
        })

        contractor = ContractorSchema(**contractor_data)

        contractor_created = self.contractor_query.create_contractor(contractor)

        if not contractor_created or contractor_created is False:
            raise HTTPException(status_code=500, detail="Contractor creation failed")

        return user_id

    def add_calendar(self, unvailable_begin_date: datetime, unvailable_end_date: datetime):
        calendar_id = str(uuid4())

        if unvailable_begin_date < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Invalid date 1")

        if unvailable_end_date < datetime.now(timezone.utc):
            raise HTTPException(status_code=400, detail="Invalid date 2")

        if unvailable_end_date < unvailable_begin_date:
            raise HTTPException(status_code=400, detail="Invalid date 3")

        payed_appointment = self.contractor_query.read_medical_appointment(
            self.contractor_id, unvailable_begin_date)
        if payed_appointment:
            raise HTTPException(
                status_code=400,
                detail="Impossible d'ajouter l'indisponibilité car un rendez-vous PAYED existe durant cette période."
            )

        calendar = CalendarTable(
            contractor_id=self.contractor_id,
            calendar_id=str(uuid4()),
            unvailable_begin_date=unvailable_begin_date,
            unvailable_end_date=unvailable_end_date
        )

        return self.contractor_query.create_calendar(calendar)


    def find_contractor_planning_by_id(self, week_start: str = None):
        test = self.contractor_query.read_contractor_by_id2(self.contractor_id)
        if not test:
            raise HTTPException(status_code=404, detail="Contractor not found")

        results1 = self.contractor_query.read_contractor_appointment_by_contractor_id(self.contractor_id)
        results2 = self.contractor_query.read_contractor_calendar_by_contractor_id(self.contractor_id)

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

    def get_collaborator_by_appointment_date(self, appointment_date: datetime):
        if appointment_date.tzinfo is None:
            appointment_date = appointment_date.replace(tzinfo=timezone.utc)

        results = self.contractor_query.read_appointment_by_appointment_date(self.contractor_id, appointment_date)
        if not results:
            raise HTTPException(status_code=404, detail="No appointment found")

        results2 = self.contractor_query.read_collaborator_by_id(results.collaborator_id)

        return results2

    def delete_one_calendar(self, calendar_id: str):
        calendar = self.contractor_query.read_one_calendar(calendar_id)
        if calendar is None:
            raise HTTPException(status_code=404, detail="Calendar not found")
        if calendar.contractor_id != self.contractor_id:
            raise HTTPException(status_code=403, detail="You are not authorized to delete this calendar")

        self.contractor_query.delete_contractor_calendar(calendar_id)

        return {"message": "Calendar deleted successfully"}

    def sign_contract(self, signature: str, abs_path="/app/uploads/contractor_contract"):
        # Création du répertoire si nécessaire
        try:
            os.makedirs(abs_path, exist_ok=True)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la création du répertoire : {str(e)}"
            )

        # Définition des chemins pour l'image et le contrat
        nom_fichier_signature = os.path.join(abs_path, f"{self.contractor_id}_signature.png")
        nom_fichier_contrat = os.path.join(abs_path, f"{self.contractor_id}_contrat_prestataire.pdf")

        # Traitement de la signature et retraitement de l'image
        if signature.startswith("data:image"):
            try:
                # Extraction et décodage de l'image
                signature_data = signature.split(",", 1)[1]
                img_data = base64.b64decode(signature_data)

                # Utilisation de Pillow pour ouvrir et retraiter l'image
                image = Image.open(io.BytesIO(img_data))

                # Si l'image possède un canal alpha, on le remplace par un fond blanc
                if image.mode in ("RGBA", "LA"):
                    background = Image.new("RGB", image.size, (255, 255, 255))
                    background.paste(image, mask=image.split()[3])
                    image = background
                else:
                    image = image.convert("RGB")

                # Sauvegarde de l'image retraitée
                image.save(nom_fichier_signature)
            except Exception as e:
                raise HTTPException(
                    status_code=400,
                    detail=f"Erreur lors de l'enregistrement de la signature : {str(e)}"
                )
        else:
            raise HTTPException(
                status_code=400,
                detail="Format de signature non supporté. Veuillez envoyer une signature au format data:image."
            )

        # Création du PDF avec ReportLab et insertion de l'image de signature
        try:
            c = canvas.Canvas(nom_fichier_contrat)
            c.setFont("Helvetica", 12)
            text = c.beginText(40, 800)
            text.textLine("CONTRAT DE PRESTATION DE SERVICES")
            text.textLine("")
            text.textLine("J'accepte les conditions de business care")
            text.textLine("")
            text.textLine("Signature du prestataire :")
            c.drawText(text)
            # Ajustez la position et la taille de l'image selon vos besoins
            c.drawImage(nom_fichier_signature, 40, 700, width=100, height=50)
            c.showPage()
            c.save()
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la création du PDF du contrat : {str(e)}"
            )

        # Mise à jour du chemin du contrat dans la base de données
        try:
            self.contractor_query.update_contractor_contract(
                self.contractor_id,
                f"{self.contractor_id}_contrat_prestataire.pdf"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Erreur lors de la mise à jour du contrat dans la base de données : {str(e)}"
            )

        return {"message": "Contract signed successfully"}

