from pydantic import BaseModel
from typing import Optional
from datetime import date
class ContractorAdminResponse(BaseModel):
    contractor_id: str
    registration_number: str
    registration_date: date
    contract_file: Optional[str]
    sign_date: Optional[str]
    service: str
    service_price: int
    website: Optional[str]
    intervention: str
    type: str
    firstname: str
    lastname: str
    email: str
    phone: str
    city: str
    country: str


   
    
    