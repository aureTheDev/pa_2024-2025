from pydantic import constr, BaseModel, ConfigDict
from datetime import datetime
from typing import Optional


class ContractSchema(BaseModel):
    company_id: str
    company_subscription_id: str
    file: str
    company_signed: bool
    admin_signed: bool
    signature_date: Optional[datetime] = None
    creation_date: datetime
    company_signature: Optional[str] = None      # ✅ AJOUT ICI
    admin_signature: Optional[str] = None
    # Champ calculé (non attendu dans la base ou le JSON d'origine)
    @property
    def signed(self) -> bool:
        return self.company_signed and self.admin_signed

    class Config:
        orm_mode = True



from pydantic import BaseModel

class ContractResiliationRequest(BaseModel):
    company_id: str
    subscription_id: str
