from fastapi import APIRouter, status, Header, Depends, HTTPException, Query, Request
from queries.contractor_queries import ContractorQueries
from queries.collaborator_queries import CollaboratorQuery
from models.api.sign_in import ContractorSignInRequest
from service.contractor import Contractor
from service.collaborator import Collaborator
from queries.collaborator_queries import CollaboratorQuery
from models.api.user import ContractorResponse, UpdatePasswordRequest
from models.api.filter import MedicalContractorFilter
from models.database.medical_appointments_model import MedicalAppointmentTable
from models.local.periode import PeriodeSchema
from service.user import User
from queries.user_queries import UserQuery
from typing import Optional, List
import stripe
import os
from service.logging import logging
from datetime import datetime, timezone
from queries.company_queries import CompanyQuery
from service.company import Company

router = APIRouter()

@router.post("/webhook", status_code=status.HTTP_200_OK)
async def webhook(request: Request):
    sig_header = request.headers.get("Stripe-Signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    payload = await request.body()

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, os.environ.get('STRIPE_WEBHOOK_SECRET')
        )
    except ValueError as e:
        logging.error(f"Webhook error (Invalid payload): {e}")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        logging.error(f"Webhook error (Invalid signature): {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        metadata = session.get("metadata", {})
        origin = metadata.get("origin")

        if origin == "company-subscription":
            company_subscription_id = metadata.get("company_subscription_id")
            token = metadata.get("token")
            if not company_subscription_id or not token:
                logging.error("Missing company_subscription_id or token in metadata")
            else:
                company_query = CompanyQuery()
                company = Company(company_query, token)
                result = company.query.update_bill2(company.company_id, company_subscription_id, {"payed": True, "payed_date": datetime.now(timezone.utc)})

                company.query.update_company_subscription_status(company.company_id, company_subscription_id, "ACTIVE")

                subject = f"Votre facture : {company_subscription_id}"
                html = f"Voici votre facture pour l abbonement {company_subscription_id}"
                file_path = result.file

                company.send_email(subject, html, file_path)

                if result is None or result.payed is False:
                    logging.error(f"Failed to update bill for company subscription ID: {company_subscription_id}")


        elif origin == "book-medical-appointment":
            appointment_id = metadata.get("appointment_id")
            contractor_id = metadata.get("contractor_id")
            collaborator_id = metadata.get("collaborator_id")
            appointment_dt_str = metadata.get("appointment_datetime_utc")
            appointment_type = metadata.get("appointment_type")
            token = metadata.get("token")

            if not all([appointment_id, contractor_id, collaborator_id, appointment_dt_str, appointment_type, token]):
                logging.error("Missing one or more metadata fields in Stripe event")
            else:
                try:
                    appointment_dt = datetime.fromisoformat(appointment_dt_str)
                except ValueError:
                    logging.error(f"Invalid date format for appointment_dt: {appointment_dt_str}")
                    raise HTTPException(status_code=400, detail="Invalid appointment_dt format in metadata")

                try:
                    collaborator_queries = CollaboratorQuery()
                    collaborator = Collaborator(collaborator_queries, token)
                    contractor = collaborator.query.read_contractor_by_id(contractor_id)
                    address = f"{contractor.street} - {contractor.city} - {contractor.country}"
                    file = collaborator.create_medical_appointment_bill(
                        contractor.firstname,
                        contractor.lastname,
                        address,
                        datetime.now(timezone.utc),
                        contractor.registration_number,
                        contractor.service_price
                    )
                    appointment = MedicalAppointmentTable(
                        medical_appointment_id=appointment_id,
                        contractor_id=contractor_id,
                        collaborator_id=collaborator_id,
                        medical_appointment_date=appointment_dt,
                        appointment_type=appointment_type,
                        creation_date=datetime.now(timezone.utc),
                        status='PAYED',
                        price=contractor.service_price,
                        bill_file=file,
                        place=appointment_type
                    )
                    res = collaborator.query.create_medical_appointment(appointment)
                    if not res:
                        raise HTTPException(status_code=500, detail="Failed to create medical appointment")
                    logging.info(f"Successfully created medical appointment: {appointment_id}")
                except Exception as e:
                    logging.error(f"Error creating medical appointment: {e}")
        else:
            logging.error(f"Unknown origin in metadata: {origin}")

    return {"status": "success"}
