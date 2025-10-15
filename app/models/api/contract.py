from pydantic import constr, BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from .api_base import MyBaseModel
class ContractCompanyResponse(MyBaseModel):
    model_config = ConfigDict(from_attributes=True)
    company_id: constr(min_length=36, max_length=36)
    company_subscription_id : constr(min_length=36, max_length=36)
    file: str
    creation_date: datetime 
    signature_date: Optional[datetime] = None 
    company_signed: bool          
    admin_signed: bool 
    status: str 
class ContractAdminResponse(BaseModel):
    company_id: str
    company_subscription_id: str
    file: str
    creation_date: datetime
    signature_date: Optional[datetime]
    company_name: str
    subscription_status: str
    company_signed: bool
    admin_signed: bool