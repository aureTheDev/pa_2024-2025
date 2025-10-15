from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional


class MedicalAppointmentTable(SQLModel, table=True):
    __tablename__ = "medical_appointments"

    medical_appointment_id: str = Field(primary_key=True,  min_length=36, max_length=36)
    contractor_id: str = Field(default=None, foreign_key="contractors.contractor_id")
    collaborator_id: str = Field(default=None, foreign_key="collaborators.collaborator_id")
    medical_appointment_date: datetime = Field(nullable=False)
    creation_date: datetime = Field(nullable=False, default_factory=datetime.utcnow)
    status: Optional[str] = Field(default=None, max_length=50)
    bill_file: str = Field(nullable=False, unique=True, max_length=255)
    place: str = Field(nullable=False, max_length=8)
    price: int = Field(nullable=False)
    note: Optional[int] = Field(default=None)