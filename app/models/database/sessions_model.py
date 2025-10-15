from datetime import datetime

from sqlmodel import SQLModel, Field


class SessionTable(SQLModel, table=True):
    __tablename__ = "sessions"

    session_id: str = Field(primary_key=True, min_length=32, max_length=32)
    user_id: str = Field(foreign_key="users.user_id", primary_key=True, min_length=36, max_length=36)
    creation_date: datetime = Field(nullable=False)
    exp_date: datetime = Field(nullable=False)
    revoked: bool = Field(nullable=False, default=False)