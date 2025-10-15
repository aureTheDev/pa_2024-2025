from pydantic import BaseModel, Field
from typing import Optional

class DonationRequest(BaseModel):
    ngo_id: str
    donation_type: str 
    amount: Optional[int] = None 
    billing_name: Optional[str] = None
    billing_address: Optional[str] = None
    iban: Optional[str] = None
