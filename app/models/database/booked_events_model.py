# models/booked_events_model.py
from sqlmodel import SQLModel, Field
from uuid import UUID
from datetime import datetime
from typing import Optional


class BookedEvent(SQLModel, table=True):
    __tablename__ = "booked_events"

    event_id: str = Field(primary_key=True, foreign_key="events.event_id")
    collaborator_id: str = Field(primary_key=True, foreign_key="collaborators.collaborator_id")
    creation_date: datetime = Field(nullable=False, default_factory=datetime.utcnow)