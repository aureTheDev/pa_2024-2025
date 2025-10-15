# models/company_subscriptions_model.py
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from typing import Optional


class CompanySubscription(SQLModel, table=True):
    __tablename__ = "company_subscriptions"

    company_id: str = Field(primary_key=True, foreign_key="companies.company_id")
    company_subscription_id: str = Field(default_factory=lambda: str(uuid4()), primary_key=True, nullable=False)
    bonus_consultation_number: int = Field(nullable=False)
    status: Optional[str] = Field(default=None, max_length=50)
    pack_id: str = Field(nullable=False, foreign_key="packs.pack_id")