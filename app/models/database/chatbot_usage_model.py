from sqlmodel import SQLModel, Field
from uuid import uuid4
from datetime import datetime

class ChatbotUsage(SQLModel, table=True):
    __tablename__ = "chatbot_usages"

    usage_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True)
    collaborator_id: str = Field(foreign_key="collaborators.collaborator_id", nullable=False)
    used_at: datetime = Field(default_factory=datetime.utcnow)