# models/reports_model.py
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional


class Report(SQLModel, table=True):
    __tablename__ = "reports"

    report_id: str = Field(default_factory=uuid4, primary_key=True)
    collaborator_id: Optional[str] = Field(default=None, foreign_key="collaborators.collaborator_id")
    title: str = Field(nullable=False, max_length=255)
    creation_date: datetime = Field(nullable=False, default_factory=datetime.utcnow)
    post_id: Optional[str] = Field(default=None, foreign_key="posts.post_id")
    subject_id: Optional[str] = Field(default=None, foreign_key="subjects.subject_id")
    medical_appointment_id: Optional[str] = Field(default=None, foreign_key="appointments.appointment_id")