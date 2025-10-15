
from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime


class Message(SQLModel, table=True):
    __tablename__ = "messages"
    ticket_id: str = Field(primary_key=True, nullable=False, index=True)
    messages_id: str = Field(primary_key=True, nullable=False, index=True)
    text: str = Field(nullable=False)
    creation_date: datetime = Field(default_factory=datetime.utcnow, nullable=False)
    user_id: Optional[str] = Field(default=None, foreign_key="users.user_id")
    admin_id: Optional[str] = Field(default=None, foreign_key="administrators.admin_id")