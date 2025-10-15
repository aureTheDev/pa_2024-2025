# models/contractors_model.py
from sqlmodel import SQLModel, Field
from typing import Optional
from uuid import UUID, uuid4
from datetime import date


class ContractorTable(SQLModel, table=True):
    __tablename__ = "contractors"

    contractor_id: str = Field(primary_key=True, foreign_key="users.user_id", min_length=36, max_length=36)
    registration_number: str = Field(nullable=False, unique=True, max_length=50)
    registration_date: date = Field(nullable=False)
    contract_file: Optional[str] = Field(default=None, unique=True, max_length=255)
    sign_date: Optional[str] = Field(default=None, max_length=50)
    service: str = Field(nullable=False, max_length=255)
    service_price: int = Field(nullable=False)
    website: Optional[str] = Field(default=None, max_length=255)
    intervention: str = Field(nullable=False, max_length=50)
    type: str = Field(nullable=False, max_length=10)
    admin_id: Optional[str] = Field(default=None, foreign_key="administrators.admin_id")