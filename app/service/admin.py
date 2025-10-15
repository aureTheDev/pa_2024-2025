from queries.admin_queries import AdminQuery
from models.api.company_api import CompanyResponse
from models.api.user  import CollaboratorWithCompanyResponse
from models.api.estimate import EstimateAdminResponse
from models.api.contract import ContractAdminResponse
from queries.admin_queries import AdminQuery
from models.api.bill import BillAdminResponse
from typing import List
from models.local.forum import CategorySchema
from models.local.forum import SubjectAdminResponse, SubjectCreateSchema
from models.database.subjects_model import Subject
from models.api.company_api import  CompanyUpdate, CompanyAdminResponse
from models.api.user import CollaboratorWithCompanyResponse
from service.pdf_generator import PDFGenerator
from datetime import datetime
from queries.company_queries import CompanyQuery 
from service.user import User
from service.company import Company
from models.local.bill import BillSchema
from fastapi import HTTPException
from service.user import User 


class Admin(User):
    def __init__(self, query: AdminQuery, token: str):
        super().__init__(query, token)
        print("Rôle dans token:", self.function)
        print("ID utilisateur:", self.user_id)
        print("Payload du token:", self.token)
        if self.function != "administrator":
            raise HTTPException(
                status_code=403,
                detail=f"Accès refusé : rôle attendu 'administrator', reçu '{self.function}'"
            )

class AdminCompanyService:
    def __init__(self):
        self.query = AdminQuery()

    def get_all_companies(self) -> List[CompanyAdminResponse]:
        return self.query.get_all_companies()

    def update_company(self, company_id: str, data: CompanyUpdate) -> CompanyAdminResponse:
        return self.query.update_company(company_id, data)

    def delete_company(self, company_id: str):
        self.query.delete_company(company_id)




class AdminCollaboratorService:
    def __init__(self, query: AdminQuery, token: str):
        self.query = query
        self.token = token

    def __call__(self) -> List[CollaboratorWithCompanyResponse]:
        return self.query.get_all()
    
    def update(self, collaborator_id: str, data: dict) -> CollaboratorWithCompanyResponse:
        return self.query.update_collaborator(collaborator_id, data)

    def delete(self, collaborator_id: str):
        self.query.delete_collaborator(collaborator_id)

class AdminEstimateService:
    def __init__(self, query: AdminQuery, token: str):
        self.query = query
        self.token = token

    def __call__(self) -> List[EstimateAdminResponse]:
        return self.query.get_all_estimates_with_company_name(self.token)
    
    def delete_estimate(self, subscription_id: str) -> bool:
        estimate = self.query.read_estimate_by_subscription_id(subscription_id)
        if not estimate:
            return False
        return self.query.delete_estimate(estimate.company_id, subscription_id)
   

class AdminBillService:
    def __init__(self, query: AdminQuery, token: str):
        self.query = query
        self.token = token

    def __call__(self) -> List[BillAdminResponse]:
        return self.query.get_all_bills_with_company_name(self.token)
    @staticmethod
    def generate_bill_for_company(query, company_id, subscription_id):
     estimate = query.read_estimate(company_id, subscription_id)
     if not estimate:
        raise HTTPException(404, "Devis introuvable")

     subscription = query.get_company_subscription_by_id(subscription_id)
     pack = query.get_pack_by_id(subscription.pack_id)
     company = query.read_company_by_id(company_id)
     if not company:
        raise HTTPException(404, "Entreprise introuvable")

     facture_path = query.generate_facture_pdf(
      company_name=company.name,
      subscription_id=subscription_id,
      pack=pack,  
      total_ht=round(estimate.amount / 1.2, 2),
      tva=round(estimate.amount - estimate.amount / 1.2, 2),
      total_ttc=estimate.amount,
      date_facture=datetime.utcnow()
)


     query.create_bill(BillSchema(
        company_id=company_id,
        company_subscription_id=subscription_id,
        amount=estimate.amount,
        file=facture_path,
        payed=False
    ))
 

    def delete_bill(self, subscription_id: str) -> bool:
     return self.query.delete_bill(subscription_id)

 
class AdminContractService:
    def __init__(self, token: str, query=None):
        self.token = token
        self.query = query or CompanyQuery()

    def __call__(self) -> List[ContractAdminResponse]:
        return self.query.get_all_contracts_with_company_name(self.token)

    def sign_contract_as_admin(self, company_id, subscription_id, signature_base64):
     contract = self.query.get_contract(company_id, subscription_id)
     if not contract:
        raise HTTPException(404, "Contrat introuvable")

     update_data = {"admin_signed": True}
     
     estimate = self.query.read_estimate(company_id, subscription_id)
    

     subscription = self.query.get_company_subscription_by_id(subscription_id)
     pack = self.query.get_pack_by_id(subscription.pack_id)
     company = self.query.read_company_by_id(company_id)

     contrat_path = PDFGenerator.generate_contrat(
            company_name=company.name,
            subscription_id=subscription_id,
            plan=pack.name,
            employees=estimate.employees,
            price_per_employee=pack.annual_collaborator_price,
            consultation_nb=pack.default_consultation_number,
            chatbot_msgs=pack.chatbot_messages_number or 0,
            signature_date=datetime.utcnow(),
            company_signature_base64=contract.company_signature,
            admin_signature_base64=signature_base64
        )

      
     update_data = {
            "admin_signed": True,
            "admin_signature": signature_base64,
            "file": contrat_path,
            "signature_date": datetime.utcnow()
        }
     self.query.update_contract(company_id, subscription_id, update_data)



     AdminBillService.generate_bill_for_company(self.query, company_id, subscription_id)


     return {"message": "Contrat signé par l'admin"}

    def delete_contract(self, company_id: str, subscription_id: str) -> bool:
     return AdminQuery().delete_contract(company_id, subscription_id)



class AdminForumService:
    def __init__(self, query: AdminQuery, token: str):
        self.query = query
        self.token = token

    def get_all(self) -> List[CategorySchema]:
        return self.query.get_all_forum_categories()

    def create(self, title: str) -> CategorySchema:
        return self.query.create_forum_category(title)
    
    def update(self, category_id: str, title: str) -> CategorySchema:
     return self.query.update_forum_category(category_id, title)


    def delete(self, category_id: str):
     return self.query.delete_forum_category(category_id)


class AdminSubjectService:
    def __init__(self, query: AdminQuery, token: str):
        self.query = query
        self.token = token

    def __call__(self) -> List[SubjectAdminResponse]:
        return self.query.get_all_subjects_with_category_name(self.token)

    def create(self, request: SubjectCreateSchema) -> Subject:
        return self.query.create_subject(title=request.title, category_id=request.category_id)

    def update(self, subject_id: str, title: str):
        return self.query.update_subject_title(subject_id, title)

    def delete(self, subject_id: str):
        return self.query.delete_subject(subject_id)
    

class AdminTicketService:
    def __init__(self, query):
        self.query = query

    def get_all_tickets(self):
        return self.query.get_all_tickets()

    def delete_ticket(self, ticket_id: str):
        return self.query.delete_ticket(ticket_id)

    def reply_to_ticket(self, ticket_id: str, message_text: str, admin_id: str):
     return self.query.reply_to_ticket(ticket_id, message_text, admin_id)
    
    def get_ticket_with_messages(self, ticket_id: str):
     return self.query.get_ticket_with_messages(ticket_id)

    def close_ticket(self, ticket_id: str):
     return self.query.close_ticket(ticket_id)


class AdminContractorService:
    def __init__(self, query):
        self.query = query

    def get_all_contractors(self):
        return self.query.get_all_contractors()
    

class AdminNgoService:
    def __init__(self, query):
        self.query = query

    def get_all_ngos(self):
        return self.query.get_all_ngos()

    def create_ngo(self, ngo_data):
        return self.query.insert_ngo(ngo_data)
    
    def delete_ngo(self, ngo_id: str):
     return self.query.delete_ngo(ngo_id)



class AdminEventService:
    def __init__(self, query):
        self.query = query

    def get_events_by_ngo(self, ngo_id: str):
        return self.query.get_events_by_ngo(ngo_id)

    def create_event(self, ngo_id: str, event_data):
        return self.query.create_event(ngo_id, event_data)

    def delete_event(self, event_id: str):
        success = self.query.delete_event(event_id)
        if not success:
            raise HTTPException(status_code=404, detail="Événement introuvable")
        return {"message": "Événement supprimé"}
    

class AdminServiceSummaryService:
    def __init__(self, query):
        self.query = query

    def get_services_summary(self):
        return self.query.get_services_summary()

    def get_contractors_by_service(self, service: str):
        return self.query.get_contractors_by_service(service)

    def get_intervention_summary(self):
        return self.query.get_intervention_summary()    