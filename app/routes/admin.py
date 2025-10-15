# routes/admin_routes.py
from fastapi import APIRouter, Header , Body ,Depends, HTTPException
from typing import List
from models.api.company_api import CompanyResponse
from queries.admin_queries import AdminQuery
from service.admin import AdminCompanyService
from models.api.user import CollaboratorWithCompanyResponse
from service.admin import AdminCollaboratorService
from models.api.estimate import EstimateAdminResponse
from service.admin import AdminEstimateService
from models.api.contract import ContractAdminResponse
from service.admin import AdminContractService
from models.api.bill import BillAdminResponse
from service.admin import AdminBillService
from models.local.forum import CategorySchema
from service.admin import AdminForumService
from models.local.forum import SubjectAdminResponse
from models.local.forum import SubjectCreateSchema
from service.admin import AdminSubjectService
from service.admin import AdminCollaboratorService
from models.api.user import CollaboratorWithCompanyResponse
from queries.company_queries import CompanyQuery
from models.api.company_api import CompanyAdminResponse, CompanyUpdate
from service.company import Company
from service.admin import Admin as AdminUser
from queries.admin_queries import AdminQuery
from service.admin import Admin 
from service.admin import AdminContractService 
from datetime import datetime
from service.admin import AdminServiceSummaryService
from service.pdf_generator import  PDFGenerator
from models.api.ticket import TicketAdminResponse
from service.admin import AdminTicketService
from service.user import User
from queries.user_queries import UserQuery
from service.admin import AdminContractorService
from models.api.contractor  import ContractorAdminResponse
from models.api.ngo import NgoAdminResponse
from service.admin import AdminNgoService
from models.api.ngo import NgoCreate

from models.local.event import EventCreate, EventResponse
from service.admin import AdminEventService
from queries.admin_queries import AdminQuery
from service.admin import Admin


router = APIRouter()

@router.get("/companies", response_model=List[CompanyAdminResponse])
def get_all_companies(service: AdminCompanyService = Depends()):
    return service.get_all_companies()

@router.put("/companies/{company_id}", response_model=CompanyAdminResponse)
def update_company(company_id: str, company: CompanyUpdate, service: AdminCompanyService = Depends()):
    return service.update_company(company_id, company)

@router.delete("/companies/{company_id}")
def delete_company(company_id: str, service: AdminCompanyService = Depends()):
    service.delete_company(company_id)
    return {"detail": "Entreprise supprimée"}


@router.get("/collaborators", response_model=List[CollaboratorWithCompanyResponse])
def get_all_collaborators(token: str = Header(...)):
    query = AdminQuery()
    service = AdminCollaboratorService(query, token)
    return service()


@router.put("/collaborators/{collaborator_id}", response_model=CollaboratorWithCompanyResponse)
def update_collaborator(
    collaborator_id: str,
    data: dict = Body(...), 
    token: str = Header(...)
):
    query = AdminQuery()
    service = AdminCollaboratorService(query, token)
    return service.update(collaborator_id, data)


@router.delete("/collaborators/{collaborator_id}")
def delete_collaborator(collaborator_id: str, token: str = Header(...)):
    query = AdminQuery()
    service = AdminCollaboratorService(query, token)
    service.delete(collaborator_id)
    return {"detail": "Collaborateur supprimé"}


@router.get("/estimates", response_model=List[EstimateAdminResponse])
def get_all_estimates(token: str = Header("token")):
    query = AdminQuery()
    service = AdminEstimateService(query, token)
    return service()


@router.get("/contracts", response_model=List[ContractAdminResponse])
def get_all_contracts(token: str = Header("token")):
    query = AdminQuery()
    service = AdminContractService(token=token, query=AdminQuery())
    return service()



@router.get("/bills", response_model=List[BillAdminResponse])
def get_all_bills(token: str = Header("token")):
    query = AdminQuery()
    service = AdminBillService(query, token)
    return service()


@router.get("/forum/categories", response_model=List[CategorySchema])
def get_all_forum_categories(token: str = Header("token")):
    query = AdminQuery()
    service = AdminForumService(query, token)
    return service.get_all()

@router.post("/forum/categories", response_model=CategorySchema)
def create_forum_category(title: str = Body(...), token: str = Header("token")):
    query = AdminQuery()
    service = AdminForumService(query, token)
    return service.create(title)

@router.put("/forum/categories/{category_id}", response_model=CategorySchema)
def update_forum_category(category_id: str, title: str = Body(...), token: str = Header("token")):
    query = AdminQuery()
    service = AdminForumService(query, token)
    return service.update(category_id, title)

@router.delete("/forum/categories/{category_id}")
def delete_forum_category(category_id: str, token: str = Header("token")):
    query = AdminQuery()
    service = AdminForumService(query, token)
    return service.delete(category_id)


@router.get("/forum/subjects", response_model=List[SubjectAdminResponse])
def get_all_subjects(token: str = Header("token")):
    query = AdminQuery()
    service = AdminSubjectService(query, token)
    return service()

@router.post("/forum/subjects")
def create_subject(payload: SubjectCreateSchema, token: str = Header("token")):
    query = AdminQuery()
    service = AdminSubjectService(query, token)
    return service.create(payload)

@router.put("/forum/subjects/{subject_id}")
def update_subject(subject_id: str, title: str = Body(...), token: str = Header("token")):
    query = AdminQuery()
    service = AdminSubjectService(query, token)
    return service.update(subject_id, title)

@router.delete("/forum/subjects/{subject_id}")
def delete_subject(subject_id: str, token: str = Header("token")):
    query = AdminQuery()
    service = AdminSubjectService(query, token)
    return service.delete(subject_id)


@router.post("/sign-contract")
def sign_contract_admin(payload: dict = Body(...), token: str = Header(...)):
    admin = Admin(AdminQuery(), token)
    service = AdminContractService(token, CompanyQuery())
    return service.sign_contract_as_admin(
        company_id=payload["company_id"],
        subscription_id=payload["subscription_id"],
        signature_base64=payload.get("admin_signature")
    )

@router.delete("/estimates/{subscription_id}")
def delete_estimate(subscription_id: str, token: str = Header(...)):
    admin = Admin(AdminQuery(), token)
    service = AdminEstimateService(AdminQuery(), token)
    success = service.delete_estimate(subscription_id)
    if not success:
        raise HTTPException(404, detail="Devis introuvable")
    return {"message": "Devis supprimé avec succès "}

@router.delete("/bills/{subscription_id}")
def delete_bill(subscription_id: str, token: str = Header(...)):
    admin = Admin(AdminQuery(), token) 
    service = AdminBillService(AdminQuery(), token)
    success = service.delete_bill(subscription_id)
    if not success:
        raise HTTPException(status_code=404, detail="Facture introuvable")
    return {"message": "Facture supprimée avec succès"}


@router.delete("/contracts/{company_id}/{subscription_id}")
def delete_contract(company_id: str, subscription_id: str, token: str = Header(...)):
    admin = Admin(AdminQuery(), token)
    service = AdminContractService(token)
    success = service.delete_contract(company_id, subscription_id)
    if not success:
        raise HTTPException(status_code=404, detail="Contrat introuvable")
    return {"message": "Contrat supprimé avec succès"}


@router.get("/tickets", response_model=List[TicketAdminResponse])
def get_all_tickets(token: str = Header(...)):
    admin = Admin(AdminQuery(), token)
    service = AdminTicketService(AdminQuery())
    return service.get_all_tickets()


@router.delete("/tickets/{ticket_id}")
def delete_ticket(ticket_id: str, token: str = Header(...)):
    service = AdminTicketService(AdminQuery())
    success = service.delete_ticket(ticket_id)
    if not success:
        raise HTTPException(404, "Ticket introuvable")
    return {"message": "Ticket supprimé"}

@router.get("/tickets/{ticket_id}/messages")
def get_ticket_messages(ticket_id: str, token: str = Header(...)):
    admin = User(AdminQuery(), token)
    service = AdminTicketService(AdminQuery())
    result = service.get_ticket_with_messages(ticket_id)
    if not result:
        raise HTTPException(status_code=404, detail="Ticket introuvable")
    return result

@router.post("/tickets/{ticket_id}/reply")
def reply_to_ticket(ticket_id: str, data: dict = Body(...), token: str = Header(...)):
    admin = User(AdminQuery(), token)
    if admin.function != "administrator":
        raise HTTPException(403, detail="Non autorisé")

    message_text = data.get("text")
    if not message_text:
        raise HTTPException(400, detail="Message requis")

    service = AdminTicketService(AdminQuery())
    success = service.reply_to_ticket(ticket_id, message_text, admin.user_id)
    if not success:
        raise HTTPException(404, detail="Ticket introuvable")
    return {"message": "Réponse envoyée"}


@router.get("/contractors", response_model=List[ContractorAdminResponse])
def get_all_contractors(token: str = Header(...)):
    admin = Admin(AdminQuery(), token)
    service = AdminContractorService(AdminQuery())
    return service.get_all_contractors()

@router.get("/ngos", response_model=list[NgoAdminResponse])
def get_all_ngos(token: str = Header(...)):
    admin = Admin(AdminQuery(), token) 
    service = AdminNgoService(AdminQuery())
    ngos = service.get_all_ngos()
    return ngos


@router.post("/ngos")
def create_ngo(ngo_data: NgoCreate, token: str = Header(...)):
    admin = Admin(AdminQuery(), token) 
    service = AdminNgoService(AdminQuery())
    return service.create_ngo(ngo_data)

@router.delete("/ngos/{ngo_id}")
def delete_ngo(ngo_id: str, token: str = Header(...)):
    admin = Admin(AdminQuery(), token)
    service = AdminNgoService(AdminQuery())
    return service.delete_ngo(ngo_id)


@router.get("/ngos/{ngo_id}/events", response_model=List[EventResponse])
def get_events_by_ngo(ngo_id: str, token: str = Header(...)):
    admin = Admin(AdminQuery(), token)
    service = AdminEventService(AdminQuery())
    return service.get_events_by_ngo(ngo_id)

@router.post("/ngos/{ngo_id}/events", response_model=EventResponse)
def create_event(ngo_id: str, event: EventCreate, token: str = Header(...)):
    admin = Admin(AdminQuery(), token)
    service = AdminEventService(AdminQuery())
    return service.create_event(ngo_id, event)

@router.delete("/events/{event_id}")
def delete_event(event_id: str, token: str = Header(...)):
    admin = Admin(AdminQuery(), token)
    service = AdminEventService(AdminQuery())
    return service.delete_event(event_id)


@router.get("/services")
def get_services_summary(token: str = Header(...)):
    service = AdminServiceSummaryService(AdminQuery())
    services_data = [
        {"service": row[0], "count": row[1]}
        for row in service.get_services_summary()
    ]

    interventions_data = [
        {"intervention": row[0], "count": row[1]}
        for row in service.get_intervention_summary()
    ]

    return {
        "services": services_data,
        "interventions": interventions_data
    }

@router.get("/services/{service}/contractors")
def get_contractors_by_service(service: str, token: str = Header(...)):
    service_layer = AdminServiceSummaryService(AdminQuery())
    return service_layer.get_contractors_by_service(service)


@router.get("/intervention-summary")
def get_intervention_summary(token: str = Header(...)):
    service = AdminServiceSummaryService(AdminQuery())
    return service.get_intervention_summary()


@router.post("/contracts/{company_id}/{subscription_id}/resiliate")
def resiliate_contract(company_id: str, subscription_id: str):
    query = AdminQuery()
    return query.resiliate_subscription(company_id, subscription_id)



@router.post("/tickets/{ticket_id}/close")
def close_ticket(ticket_id: str):
    try:
        service = AdminTicketService(AdminQuery())
        service.close_ticket(ticket_id)
        return {"detail": "Ticket fermé avec succès"}
    except HTTPException as e:
        raise e
    except Exception:
        raise HTTPException(status_code=500, detail="Erreur serveur")