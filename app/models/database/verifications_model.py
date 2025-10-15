from sqlmodel import SQLModel, Field
from pydantic import constr
from datetime import datetime

class VerificationTable(SQLModel, table=True):
    __tablename__ = "verifications"
    user_id: str = Field(default=None, primary_key=True, foreign_key="users.user_id")
    code: constr(min_length=6, max_length=6) = Field(default=None, nullable=False)
    creation_date: datetime = Field(default_factory=datetime.utcnow, nullable=False)