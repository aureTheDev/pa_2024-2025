from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional

class BookedAppointmentTable(SQLModel, table=True):
    __tablename__ = "booked_appointments"

    booked_appointment_id: str = Field(default_factory=uuid4, primary_key=True)
    appointment_id: str = Field(default=None, foreign_key="appointments.appointment_id")
    collaborator_id: str = Field(default=None, foreign_key="collaborators.collaborator_id")
    booked_date: datetime = Field(nullable=False)