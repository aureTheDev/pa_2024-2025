from fpdf import FPDF
from datetime import datetime
import os
from base64 import b64decode
from io import BytesIO
from PIL import Image
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from datetime import datetime
import uuid


class PDFGenerator:

    @staticmethod
    def generate_devis(company_name, subscription_id , plan, employees, price_per_employee, consultation_nb, chatbot_msgs, staff_size, signature_date):
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=12)

        total_ht = price_per_employee * employees
        tva = total_ht * 0.2
        total_ttc = total_ht + tva

        pdf.set_font("Arial", size=16)
        pdf.cell(200, 10, txt="Devis Entreprise", ln=True, align="C")
        pdf.ln(10)

        pdf.set_font("Arial", size=12)
        pdf.cell(200, 10, txt=f"Entreprise : {company_name}", ln=True)
        pdf.cell(200, 10, txt=f"Offre choisie : {plan}", ln=True)
        pdf.cell(200, 10, txt=f"Nombre de salaries : {employees}", ln=True)
        pdf.cell(200, 10, txt=f"Date de signature : {signature_date.strftime('%d/%m/%Y')}", ln=True)
        pdf.ln(10)

        pdf.cell(200, 10, txt=f"Prix HT : {total_ht:.2f} euros", ln=True)
        pdf.cell(200, 10, txt=f"TVA : {tva:.2f} euros", ln=True)
        pdf.cell(200, 10, txt=f"Total TTC : {total_ttc:.2f} euros", ln=True)
        pdf.ln(10)

        pdf.cell(200, 10, txt=f"Prix annuel / collaborateur : {price_per_employee} euros", ln=True)
        pdf.cell(200, 10, txt=f"Consultations incluses : {consultation_nb}", ln=True)
        pdf.cell(200, 10, txt=f"Messages chatbot : {chatbot_msgs}", ln=True)
        pdf.cell(200, 10, txt=f"Taille max. d'equipe : {staff_size}", ln=True)

        filename = f"devis_{company_name}_{subscription_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        filepath = os.path.join("uploads/estimates", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        pdf.output(filepath, 'F')
        return filepath



    @staticmethod
    def generate_contrat(
        company_name,
        subscription_id,
        plan,
        employees,
        price_per_employee,
        consultation_nb,
        chatbot_msgs,
        signature_date,
        company_signature_base64=None,
        admin_signature_base64=None
    ):
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=16)
        pdf.cell(200, 10, txt="Contrat de Service", ln=True, align="C")
        pdf.ln(10)

        pdf.set_font("Arial", size=12)
        total_ht = price_per_employee * employees

        pdf.cell(200, 10, txt=f"Date : {signature_date.strftime('%d/%m/%Y')}", ln=True)
        pdf.cell(200, 10, txt=f"Entreprise : {company_name}", ln=True)
        pdf.cell(200, 10, txt="Durée : 12 mois", ln=True)
        pdf.cell(200, 10, txt=f"Pack : {plan}", ln=True)
        pdf.cell(200, 10, txt=f"Salaries : {employees}", ln=True)
        pdf.cell(200, 10, txt=f"Total HT : {total_ht:.2f} euros", ln=True)
        pdf.cell(200, 10, txt=f"Consultations : {consultation_nb}", ln=True)
        pdf.cell(200, 10, txt=f"Chatbot : {chatbot_msgs}", ln=True)
        pdf.ln(10)

        pdf.multi_cell(0, 10, txt="Business Care s'engage à fournir l'accès à la plateforme selon les termes du pack sélectionné.")
        pdf.ln(10)

        # Signatures
        pdf.cell(95, 10, txt="Signature Business Care :", ln=0)
        pdf.cell(95, 10, txt="Signature Client :", ln=1)

        y_position = pdf.get_y()

        def insert_signature(base64_str, x):
          if base64_str:
           try:
            if "," in base64_str:
                base64_str = base64_str.split(",")[1]

            image_data = b64decode(base64_str)
            image = Image.open(BytesIO(image_data)).convert("RGBA")
            background = Image.new("RGB", image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])  # applique la transparence
            image_path = f"/tmp/signature_{subscription_id}_{x}.png"
            background.save(image_path, "PNG")
            pdf.image(image_path, x=x, y=pdf.get_y(), w=60)
           except Exception as e:
            print(f"Erreur lors du traitement de la signature : {e}")



        insert_signature(admin_signature_base64, x=10)
        insert_signature(company_signature_base64, x=110)

        filename = f"contrat_{company_name}_{subscription_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        filepath = os.path.join("uploads/contracts", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        pdf.output(filepath, 'F')

        return filepath






    @staticmethod
    def generate_facture(company_name, subscription_id , plan, total_ht, tva, total_ttc, date_facture):
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("Arial", size=16)
        pdf.cell(200, 10, txt="Facture", ln=True, align="C")
        pdf.ln(10)

        pdf.set_font("Arial", size=12)
        pdf.cell(200, 10, txt=f"Entreprise : {company_name}", ln=True)
        pdf.cell(200, 10, txt=f"Formule : {plan}", ln=True)
        pdf.cell(200, 10, txt=f"Date : {date_facture.strftime('%d/%m/%Y')}", ln=True)
        pdf.cell(200, 10, txt=f"HT : {total_ht:.2f} euros", ln=True)
        pdf.cell(200, 10, txt=f"TVA : {tva:.2f} euros", ln=True)
        pdf.cell(200, 10, txt=f"TTC : {total_ttc:.2f} euros", ln=True)

        filename = f"facture_{company_name}_{subscription_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}.pdf"
        filepath = os.path.join("uploads/bills", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        pdf.output(filepath, 'F')
        return filepath

    @staticmethod
    def generate_pdf_bill(data: dict, filepath: str):
     pdf = FPDF()
     pdf.add_page()
     pdf.set_font("Arial", size=12)
     pdf.cell(200, 10, txt="Facture de Don", ln=1, align="C")
     pdf.cell(200, 10, txt=f"Nom: {data.get('billing_name')}", ln=1)
     pdf.cell(200, 10, txt=f"Adresse: {data.get('billing_address')}", ln=1)
     pdf.cell(200, 10, txt=f"Montant: {data.get('amount')} €", ln=1)
     pdf.output(filepath)
