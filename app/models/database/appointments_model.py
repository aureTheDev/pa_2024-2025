from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional


class AppointmentTable(SQLModel, table=True):
    __tablename__ = "appointments"

    appointment_id: str = Field(default_factory=uuid4, primary_key=True)
    contractor_id: str = Field(default=None, foreign_key="contractors.contractor_id")
    company_id: str = Field(default=None, foreign_key="company.company_id")
    appointment_date: datetime = Field(nullable=False)
    creation_date: datetime = Field(nullable=False, default_factory=datetime.utcnow)
    bill_file: str = Field(nullable=False, unique=True, max_length=255)
    room_id: str = Field(default=None, foreign_key="rooms.room_id")
    size: int = Field(nullable=False)
    note: Optional[int] = Field(default=None)