from fastapi import APIRouter, HTTPException
from models.local.company_creation import CompanyCreateLocal
from models.api.company_api import CompanyCreatedAPI
from service.company_inscription_service import handle_company_inscription
import traceback

router = APIRouter()

@router.post("/inscription")
def create_company(payload: CompanyCreateLocal):
    try:
        return handle_company_inscription(payload)
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'inscription : {str(e)}")
