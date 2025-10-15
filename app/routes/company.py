from dataclasses import Field

from fastapi import APIRouter, HTTPException, Header, Depends , File, UploadFile
from service.company import Company
from models.api.user import CompanyResponse
from models.local.user import CollaboratorSchema
from models.local.user import CompanySchema
from models.api.user import CollaboratorResponse
from models.local.user import CompanyUpdateSchema
from models.local.user import UserUpdateSchema
from queries.company_queries import CompanyQuery
from models.api.bill import BillCompanyResponse
from models.api.contract import ContractCompanyResponse
from models.api.estimate import EstimateCompanyResponse
from models.local.estimate import EstimateSchema
from models.local.contract import ContractSchema
from models.local.user import UserSchema
from models.local.bill import BillSchema
from models.database.company_subscriptions_model import CompanySubscription
from models.local.packs import PackCreate
from models.database.packs_model import Pack
from fastapi import Body
from models.local.bill import BillUpdateSchema
from queries.user_queries import UserQuery
from service.user import User
from fastapi.responses import JSONResponse
from models.local.contract import ContractResiliationRequest
import os
from datetime import datetime
from models.api.company_subscription import CompanySubscriptionResponse
from models.local.company_subscription import CompanySubscriptionCreate
from models.api.estimate import  EstimatePreviewSchema
from models.api.estimate import EstimateRequestSchema

from pydantic import BaseModel, constr


import traceback

router = APIRouter()


@router.get("/", response_model=CompanyResponse)
def get_company(token: str = Header("token")):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    return company

#Profil

@router.get("/companies/me", response_model=CompanySchema)
def get_my_company(token: str = Header(...)):
    user = User(CompanyQuery(), token)
    if user.function != "company":
         raise HTTPException(status_code=403, detail="Not authorized")
    return CompanyQuery().read_company_by_id(user.user_id)


@router.put("/companies/me", response_model=CompanySchema)
def update_my_company(updated_data: CompanyUpdateSchema, token: str = Header(...)):
    user = User(CompanyQuery(), token)
    if user.function != "company":
        raise HTTPException(status_code=403, detail="Not authorized")

    updated = CompanyQuery().update_company_by_id(user.user_id, updated_data)
    return updated  



@router.put("/user/me", response_model=UserSchema)
def update_user(updated_data: UserUpdateSchema, token: str = Header(...)):
    user = User(UserQuery(), token)
    updated = UserQuery().update_user_by_id(user.user_id, updated_data)
    return updated


#Collaborators
@router.get("/collaborators", response_model=list[CollaboratorResponse])
def get_collaborator(token: str = Header("token")):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    collaborators = company.get_collaborators()
    return collaborators

@router.post("/collaborators", response_model=CollaboratorResponse)
def create_collaborator(collaborator_data: CollaboratorSchema, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    return company.create_collaborator(collaborator_data)


@router.get("/collaborators/{collaborator_id}", response_model=CollaboratorResponse)
def get_collaborator_by_id(collaborator_id: str, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    result = company.get_collaborator_by_id(collaborator_id)
    if not result:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    return result


@router.put("/collaborators/{collaborator_id}", response_model=CollaboratorResponse)
def update_collaborator(
    collaborator_id: str,
    update_data: dict,
    token: str = Header(...)
):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    result = company.update_collaborator(collaborator_id, update_data)
    if not result:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    return result


@router.delete("/collaborators/{collaborator_id}")
def delete_collaborator(collaborator_id: str, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    success = company.delete_collaborator(company.company_id, collaborator_id)
    if not success:
        raise HTTPException(status_code=404, detail="Collaborator not found")
    return {"deleted": True}

#Bills

@router.get("/bills", response_model=list[BillCompanyResponse])
def get_bills(token: str = Header("token") ):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    bills= company.get_bills()
    return bills


@router.get("/bills/{subscription_id}", response_model=BillCompanyResponse)
def read_bill(subscription_id: str, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    result = company.get_bill(subscription_id)
    if not result:
        raise HTTPException(status_code=404, detail="Bill not found")
    return result



@router.put("/bills/{subscription_id}")
def update_bill(
    subscription_id: str,
    update_data: BillUpdateSchema,
    token: str = Header(...)
):
    if not token:
        raise HTTPException(status_code=401, detail="Token manquant")

    company_queries = CompanyQuery()
    company_service = Company(company_queries, token)

    success = company_service.update_bill(
        company_service.company_id,
        subscription_id,
        update_data.model_dump()
    )

    if not success:
        raise HTTPException(status_code=404, detail="Facture non trouvée.")

    return {"subscription_id": subscription_id, "payed": update_data.payed}


@router.delete("/bills/{company_id}/{subscription_id}")
def delete_bill(subscription_id: str, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    success = company.delete_bill( subscription_id)
    if not success:
        raise HTTPException(status_code=404, detail="Bill not found")
    return {"deleted": True}


#Contracts

@router.get("/contracts", response_model=list[ContractCompanyResponse])
def get_contracts(token: str = Header("token") ):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    contracts= company.get_contracts()
    return  contracts


@router.get("/contracts/{company_id}/{subscription_id}", response_model=ContractCompanyResponse)
def get_contract(company_id: str, subscription_id: str, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    result = company.get_contract(company_id, subscription_id)
    if not result:
        raise HTTPException(status_code=404, detail="Contract not found")
    return result


@router.put("/contracts/{company_id}/{subscription_id}", response_model=ContractCompanyResponse)
def update_contract(
    company_id: str,
    subscription_id: str,
    update_data: dict,
    token: str = Header(...)
):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    result = company.update_contract(company_id, subscription_id, update_data)
    if not result:
        raise HTTPException(status_code=404, detail="Contract not found")
    return result


@router.delete("/contracts/{company_id}/{subscription_id}")
def delete_estimate(company_id: str, subscription_id: str, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    success = company.delete_contract(company_id, subscription_id)
    if not success:
        raise HTTPException(status_code=404, detail="Contract not found")
    return {"deleted": True}


#Estimates

@router.get("/estimates", response_model=list[EstimateCompanyResponse])
def get_estimates(token: str = Header("token") ):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    estimates= company.get_estimates()
    return  estimates



@router.get("/estimates/{company_id}/{subscription_id}", response_model=EstimateCompanyResponse)
def get_estimate(company_id: str, subscription_id: str, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    result = company.get_estimate(company_id, subscription_id)
    if not result:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return result


@router.put("/estimates/{company_id}/{subscription_id}", response_model=EstimateCompanyResponse)
def update_estimate(
    company_id: str,
    subscription_id: str,
    update_data: dict,
    token: str = Header(...)
):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    result = company.update_estimate(company_id, subscription_id, update_data)
    if not result:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return result


@router.delete("/estimates/{company_id}/{subscription_id}")
def delete_estimate(company_id: str, subscription_id: str, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    success = company.delete_estimate(company_id, subscription_id)
    if not success:
        raise HTTPException(status_code=404, detail="Estimate not found")
    return {"deleted": True}



@router.post("/estimates", response_model=EstimateCompanyResponse)
def create_estimate(estimate_data: EstimateRequestSchema, token: str = Header(...)):
    company = Company(CompanyQuery(), token)
    return company.process_estimate_creation(estimate_data)



#stats
@router.get("/stats")
def get_company_stats(token: str = Header(...)):
    company = Company(CompanyQuery(), token)
    stats = company.get_stats()
    return stats



#Packs
@router.post("/packs", response_model=Pack)
def create_pack(pack_data: PackCreate, token: str = Header(...)):
    try:
        company_queries = CompanyQuery()
        company = Company(company_queries, token)
        return company.create_pack(pack_data)
    except Exception as e:
        traceback.print_exc()  
        raise HTTPException(status_code=500, detail=f"Erreur création pack : {str(e)}")
    
@router.get("/packs/{pack_id}", response_model=Pack)
def get_pack_by_id(pack_id: str, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    return company.get_pack_by_id(pack_id)


#Company_subscription


@router.get("/company-subscriptions/{subscription_id}", response_model=CompanySubscriptionResponse)
def get_subscription(subscription_id: str, token: str = Header("token")):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    return company.get_company_subscription_by_id(subscription_id)



@router.post("/estimate-preview")
def preview_estimate(data: EstimatePreviewSchema, token: str = Header(...)):
    company = Company(CompanyQuery(), token)
    pack = company.select_pack_by_employees(data.employees)
    if not pack:
        raise HTTPException(400, "Aucun pack adapté")
    ttc = pack.annual_collaborator_price * data.employees * 1.2
    return {"amount": round(ttc, 2)}

@router.post("/generate-bill")
def generate_bill(data: dict = Body(...), token: str = Header(...)):
    subscription_id = data.get("subscription_id")
    if not subscription_id:
        raise HTTPException(400, detail="subscription_id manquant")

    company = Company(CompanyQuery(), token)
    return company.generate_bill(subscription_id)


@router.post("/sign-contract")
def sign_contract_company(payload: dict, token: str = Header(...)):
    company_id = payload["company_id"]
    subscription_id = payload["subscription_id"]
    signature_base64 = payload.get("signature")

    company_service = Company(CompanyQuery(), token)
    contrat_path = company_service.sign_by_company(company_id, subscription_id, signature_base64)

    if not contrat_path:
        raise HTTPException(404, "Contrat introuvable")

    return {"message": "Contrat signé avec succès", "path": contrat_path}


@router.post("/resiliate-contract")
def resiliate_contract(data: ContractResiliationRequest, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    return company.resiliate_contract(data.company_id, data.subscription_id)


class CheckoutSessionRequest(BaseModel):
    company_id: constr(min_length=36, max_length=36)
    subscription_id: constr(min_length=36, max_length=36)

@router.post("/subscription_payement")
def subscription_payement(data: CheckoutSessionRequest, token: str = Header(...)):
    company_queries = CompanyQuery()
    company = Company(company_queries, token)
    return company.subscription_payement(data.subscription_id)