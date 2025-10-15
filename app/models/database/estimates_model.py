# models/estimates_model.py
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional


class Estimate(SQLModel, table=True):
    __tablename__ = "estimates"
    company_id: str = Field(primary_key=True, foreign_key="company_subscriptions.company_id")
    company_subscription_id: str = Field(primary_key=True, foreign_key="company_subscriptions.company_subscription_id")
    file: str = Field(nullable=False, unique=True, max_length=255)
    creation_date: datetime = Field(nullable=False, default_factory=datetime.utcnow)
    signature_date: Optional[datetime] = None
    employees: int = Field(nullable=False)
    amount: float = Field(nullable=False) 