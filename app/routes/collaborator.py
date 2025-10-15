import os
from fastapi import APIRouter, HTTPException, Header, Depends, Query
from sqlalchemy.orm import Session
from service.collaborator import Collaborator
from queries.collaborator_queries import CollaboratorQuery
from models.api.user import CollaboratorResponse, UpdatePasswordRequest, ContractorResponse
from models.api.appointment import MedicalAppointmentResponse
from typing import Optional
from datetime import datetime
from pydantic import constr
from starlette.responses import FileResponse
from models.api.user import CollaboratorResponse, UpdatePasswordRequest
from models.api.ngo import NgoResponse
from models.api.events import EventResponse
from models.api.donation import DonationRequest
from typing import List


router = APIRouter()

@router.get("/", response_model=CollaboratorResponse)
def get_collaborator(token: str = Header("token")):
    collaborator_queries = CollaboratorQuery()
    collaborator = Collaborator(collaborator_queries, token)
    return collaborator

@router.patch("/password")
def update_password(request: UpdatePasswordRequest, token: str = Header("token")):
    collaborator_queries = CollaboratorQuery()
    collaborator = Collaborator(collaborator_queries, token)

    if not collaborator.hash_password(request.password):
        raise HTTPException(status_code=403, detail="Wrong password")

    if collaborator.hash_password(request.new_password):
        raise HTTPException(status_code=403, detail="New password is the same as the old one")

    return collaborator.update_password(request.new_password)


@router.get("/ngos", response_model=list[NgoResponse])
def list_ngos(token: str = Header(...)):
    user = Collaborator(CollaboratorQuery(), token)
    service = Collaborator(CollaboratorQuery(), token)
    return service.list_ngos()


@router.get("/ngos/{ngo_id}/events", response_model=List[EventResponse])
def list_events_by_ngo(ngo_id: str, token: str = Header(...)):
    user = Collaborator(CollaboratorQuery(), token)
    return user.get_events_by_ngo(ngo_id)


@router.get("/events/joined", response_model=List[str])
def get_joined_events(token: str = Header(...)):
    user = Collaborator(CollaboratorQuery(), token)
    return user.get_joined_event_ids()


@router.post("/events/{event_id}/join")
def join_event(event_id: str, token: str = Header(...)):
    user = Collaborator(CollaboratorQuery(), token)
    return user.join_event(event_id)


@router.delete("/events/{event_id}/leave")
def leave_event(event_id: str, token: str = Header(...)):
    user = Collaborator(CollaboratorQuery(), token)
    return user.leave_event(event_id)


@router.post("/donations")
def make_donation(request: DonationRequest, token: str = Header(...)):
    user = Collaborator(CollaboratorQuery(), token)
    return user.make_donation(request)

@router.get("/medical_appointments/{collaborator_id}", response_model=list[MedicalAppointmentResponse])
def get_medical_appointments(collaborator_id: str, dateFilter: Optional[datetime] = Query(None), token: str = Header("token")):
    collaborator_queries = CollaboratorQuery()
    collaborator = Collaborator(collaborator_queries, token)
    appointments = collaborator.find_medical_appointment(collaborator_id, dateFilter)

    return appointments



@router.get("/contractor/{contractor_id}", response_model=ContractorResponse)
def get_medical_contractor(contractor_id: constr(min_length=36, max_length=36), token: str = Header("token")):
    collaborator_queries = CollaboratorQuery()
    collaborator = Collaborator(collaborator_queries, token)
    contractor = collaborator.find_one_contractor(contractor_id)

    return contractor

@router.patch("/medical-appointment/cancel/{appointment_id}")
def book_medical_appointment(appointment_id: constr(min_length=36, max_length=36), token: str = Header("token")):
    collaborator_queries = CollaboratorQuery()
    collaborator = Collaborator(collaborator_queries, token)
    return collaborator.cancel_medical_appointment(appointment_id)


@router.get("/medical/bill/{medical_appointment_id}", response_class=FileResponse)
def download_invoice(medical_appointment_id: constr(min_length=36, max_length=36), token: str = Header(...)):
    collaborator_queries = CollaboratorQuery()
    collaborator = Collaborator(collaborator_queries, token)
    medical_appointment = collaborator.query.read_medical_appointment_by_appointment_id(medical_appointment_id)

    if medical_appointment is None:
        raise HTTPException(status_code=404, detail="Bill not found")

    file_name = medical_appointment.bill_file


    file_path = f"/app/uploads/medical_bill/{file_name}"

    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Invoice not found")

    return FileResponse(
        path=file_path,
        media_type="application/pdf",
        filename=f"{file_name}"
    )


@router.patch("/medical-appointment/note/{appointment_id}")
def add_medical_appointment_note(appointment_id: constr(min_length=36, max_length=36), note: int, token: str = Header("token")):
    collaborator_queries = CollaboratorQuery()
    collaborator = Collaborator(collaborator_queries, token)
    return collaborator.add_medical_appointment_note(note, appointment_id)


@router.get("/medical-appointment/free-slots/")
def get_free_slots(token: str = Header("token")):
    collaborator_queries = CollaboratorQuery()
    collaborator = Collaborator(collaborator_queries, token)
    return collaborator.get_available_free_medical_appointment()
