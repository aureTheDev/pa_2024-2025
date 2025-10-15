from pydantic import constr, BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
class EstimateSchema(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    company_id:  constr(min_length=36, max_length=36)
    company_subscription_id: constr(min_length=36, max_length=36)
    file: str
    creation_date: datetime
    signature_date: datetime 
    employees: Optional[int]
    amount: float
