from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional

class Donation(SQLModel, table=True):  # <- le `table=True` dit que c'est pour la BDD
    __tablename__ = "donations"

    collaborator_id: str = Field(foreign_key="collaborators.collaborator_id", primary_key=True)
    ngo_id: str = Field(foreign_key="ngo.ngo_id", primary_key=True)
    donation_type: str
    amount: Optional[int] = None
    billing_name: Optional[str] = None
    billing_address: Optional[str] = None
    iban: Optional[str] = None
    bill_file: Optional[str] = None
    creation_date: datetime = Field(default_factory=datetime.utcnow)