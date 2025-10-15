# models/users_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import uuid4, UUID
from datetime import datetime, date, timezone


class UserTable(SQLModel, table=True):
    __tablename__ = "users"

    user_id: str = Field(primary_key=True, foreign_key="users.user_id", min_length=36, max_length=36)
    firstname: str = Field(nullable=False, max_length=50)
    lastname: str = Field(nullable=False, max_length=50)
    dob: date = Field(nullable=False)
    phone: str = Field(nullable=False, unique=True, max_length=50)
    email: str = Field(nullable=False, unique=True, max_length=255)
    password: str = Field(nullable=False, max_length=128)
    role: Optional[str] = Field(default=None, max_length=50)
    country: str = Field(nullable=False, max_length=255)
    city: str = Field(nullable=False, max_length=255)
    street: str = Field(nullable=False, max_length=255)
    pc: str = Field(nullable=False, max_length=10)
    inscription_date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), nullable=False)
    verified: bool = Field(nullable=False)
    stripe_id: Optional[str] = Field(default=None, unique=True, max_length=255)