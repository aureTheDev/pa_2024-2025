import base64
import logging
import os
from fastapi import APIRouter, status, Header, Depends, HTTPException, Query
from queries.contractor_queries import ContractorQueries
from models.api.sign_in import ContractorSignInRequest
from service.contractor import Contractor
from service.collaborator import Collaborator
from queries.collaborator_queries import CollaboratorQuery
from models.api.user import ContractorResponse, UpdatePasswordRequest
from models.api.filter import MedicalContractorFilter
from models.local.periode import PeriodeSchema
from service.user import User
from queries.user_queries import UserQuery
from typing import Optional, List
from datetime import datetime
from pydantic import constr
from models.api.appointment import BookMedicalAppointmentRequest
from models.api.login import LoginRequest
import stripe
from pydantic import constr
from models.api.calendar import CalendarRequest
from pydantic import BaseModel, model_validator

router = APIRouter()

@router.post("/signin", status_code=status.HTTP_201_CREATED)
def signin(sign_in_data: ContractorSignInRequest):
    contractor_queries = ContractorQueries()
    contractor = Contractor(contractor_queries, None)

    contractor_id = contractor.sign_in(sign_in_data)

    login_param = LoginRequest(email=sign_in_data.email, password=sign_in_data.password)
    contractor.login(login_param)

    return {"token": contractor.token, "contractor_id": contractor_id}


@router.get("/", response_model=ContractorResponse)
def get_contractor(token: str = Header("token")):
    contractor_queries = ContractorQueries()
    contractor = Contractor(contractor_queries, token)
    if contractor.stripe_id is None:
        contractor.stripe = False
        return contractor
    else:
        try:
            account = stripe.Account.retrieve(contractor.stripe_id)

            if not account.get("details_submitted", False):
                contractor.stripe = False
                return contractor

            capabilities = account.get("capabilities", {})
            required_capabilities = ["transfers"]

            logging.info(f"Capabilities for {account.id}: {capabilities}")

            for required in required_capabilities:
                if capabilities.get(required) != "active":
                    contractor.stripe = False
                    return contractor

            contractor.stripe = True
            return contractor

        except stripe.error.StripeError as e:
            print(f"Erreur lors de la récupération du compte Stripe: {e}")
            return False


@router.patch("/password")
def update_password(request: UpdatePasswordRequest, token: str = Header("token")):
    contractor_queries = ContractorQueries()
    contractor = Contractor(contractor_queries, token)

    if not contractor.hash_password(request.password):
        raise HTTPException(status_code=403, detail="Wrong password")

    if contractor.hash_password(request.new_password):
        raise HTTPException(status_code=403, detail="New password is the same as the old one")

    return contractor.update_password(request.new_password)

@router.get("/medical", response_model=list[ContractorResponse])
def get_medical_contractor(token: str = Header("token"), filter: MedicalContractorFilter = Depends()):
    collaborator_queries = CollaboratorQuery()
    collaborator = Collaborator(collaborator_queries, token)
    results = collaborator.find_medical_contractor()

    if not results:
        raise HTTPException(status_code=404, detail="Aucun contractor médical trouvé")

    if filter.intervention:
        results = [result for result in results if result.intervention == filter.intervention or result.intervention == "both"]

    if filter.service:
        results = [result for result in results if result.service == filter.service]


    if not results:
        raise HTTPException(status_code=404, detail="Aucun contractor médical ne correspond aux filtres")

    return results


@router.get("/calendar/{contractor_id}", response_model=list[PeriodeSchema])
def get_contractor_planning_by_id(
    contractor_id: str,
    weekStart: Optional[str] = Query(None, description="Date de début de la semaine au format YYYY-MM-DD. Si omis, la semaine en cours sera utilisée."),
    token: str = Header("token")
):
    user_query = UserQuery()
    user = User(user_query, token)
    if user.user_id == contractor_id:
        contractor_queries = ContractorQueries()
        contractor = Contractor(contractor_queries, token)
        results = contractor.find_contractor_planning_by_id(weekStart)
        return results
    else:
        collaborator_queries = CollaboratorQuery()
        collaborator = Collaborator(collaborator_queries, token)
        results = collaborator.find_contractor_planning_by_id(contractor_id, weekStart)
        return results


@router.post("/book/medical-appointment")
def book_medical_appointment(payload: BookMedicalAppointmentRequest, token: str = Header("token")):
    collaborator_queries = CollaboratorQuery()
    collaborator = Collaborator(collaborator_queries, token)
    return collaborator.checkout_medical_appointment(payload.appointment_datetime_utc, payload.contractor_id, payload.appointment_type)

@router.get("/stripe-onboarding")
def create_account_link(token: str = Header("token")):
    contractor_queries = ContractorQueries()
    contractor = Contractor(contractor_queries, token)

    if contractor.stripe_id is None:
        try:
            account = stripe.Account.create(
                type="express",
                country="FR",
                email=contractor.email,
                capabilities={
                    "card_payments": {"requested": True},
                    "transfers": {"requested": True},
                },
            )
            if account:
                contractor.contractor_query.update_user_2_by_id(contractor.contractor_id, stripe_id=account.id)
            else:
                raise HTTPException(status_code=500, detail="Server error lors de la création du compte")
        except stripe.error.StripeError as e:
            raise HTTPException(status_code=500, detail=f"Erreur lors de la création du compte Stripe: {e}")
    else:
        account = stripe.Account.retrieve(contractor.stripe_id)

    try:
        link_type = "account_onboarding"
        account_link = stripe.AccountLink.create(
            account=account.id,
            refresh_url=f"https://www.{os.getenv('DOMAIN')}/prestataires/accueil",
            return_url=f"https://www.{os.getenv('DOMAIN')}/prestataires/accueil",
            type=link_type,
        )
        return {"url": account_link.url}
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur interne du serveur : {e}")



@router.post("/calendar")
def add_contractor_calendar(payload: CalendarRequest, token: str = Header("token")):
    contractor_queries = ContractorQueries()
    contractor = Contractor(contractor_queries, token)
    return contractor.add_calendar(payload.unvailable_begin_date, payload.unvailable_end_date)

@router.get("/collaborator/byAppointmentDate")
def get_collaborator_by_appointment_date(appointment_date: datetime, token: str = Header("token")):
    contractor_queries = ContractorQueries()
    contractor = Contractor(contractor_queries, token)
    return contractor.get_collaborator_by_appointment_date(appointment_date)


@router.get("/calendar/indispo/{date_filter}")
def get_contractor_calendar(date_filter: Optional[datetime] = None, token: str = Header("token")):
    contractor_queries = ContractorQueries()
    contractor = Contractor(contractor_queries, token)
    return contractor.contractor_query.read_contractor_calendar(contractor.contractor_id, date_filter)


@router.delete("/calendar/indispo/{calendar_id}")
def delete_contractor_calendar(calendar_id: constr(min_length=36, max_length=36), token: str = Header("token")):
    contractor_queries = ContractorQueries()
    contractor = Contractor(contractor_queries, token)
    return contractor.delete_one_calendar(calendar_id)


@router.get("/note")
def get_note(token: str = Header("token")):
    contractor_queries = ContractorQueries()
    contractor = Contractor(contractor_queries, token)
    return contractor.get_note_moyenne()


class ContractorSignContractRequest(BaseModel):
    signature: str

@router.post("/sign_contract")
def sign_contract(payload: ContractorSignContractRequest, token: str = Header("token")):
    contractor_queries = ContractorQueries()
    contractor = Contractor(contractor_queries, token)
    return contractor.sign_contract(payload.signature)