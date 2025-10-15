# models/events_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime


class Event(SQLModel, table=True):
    __tablename__ = "events"

    event_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    created_at: datetime = Field(nullable=False, default_factory=datetime.utcnow)
    begin_at: datetime = Field(nullable=False)
    end_at: datetime = Field(nullable=False)
    place: str = Field(nullable=False, max_length=255)
    title: str = Field(nullable=False, max_length=255)
    capacity: int = Field(nullable=False)
    ngo_id: str = Field(foreign_key="ngo.ngo_id")
  

