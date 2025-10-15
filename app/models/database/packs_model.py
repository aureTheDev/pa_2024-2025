# models/packs_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import datetime

class Pack(SQLModel, table=True):
    __tablename__ = "packs"

    pack_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, nullable=False)
    name: str = Field(nullable=False, max_length=50)
    creation_date: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    activity_number: int = Field(nullable=False)
    annual_collaborator_price: int = Field(nullable=False)
    bonus_consultation_price: int = Field(nullable=False)
    default_consultation_number: int = Field(nullable=False)
    staff_size: int = Field(nullable=False)
    chatbot_messages_number: Optional[int] = Field(default=None)
  