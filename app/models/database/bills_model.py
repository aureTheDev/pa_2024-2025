# models/bills_model.py
from sqlmodel import SQLModel, Field
from uuid import UUID, uuid4
from datetime import datetime
from typing import Optional


class BillTable(SQLModel, table=True):
    __tablename__ = "bills"

    company_id: str = Field(primary_key=True, foreign_key="company_subscriptions.company_id")
    company_subscription_id: str = Field(primary_key=True, foreign_key="company_subscriptions.company_subscription_id")
    file: str = Field(nullable=False, unique=True, max_length=255)
    payed: bool = Field(nullable=False, default=False)
    payed_date: Optional[datetime] = Field(default=None, nullable=True)
  

  