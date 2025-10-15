import uuid
from fastapi import HTTPException
from .user import User
from queries.company_queries import CompanyQuery
from service.logging import logging
from models.local.user import CollaboratorSchema
from models.local.bill import BillSchema
from models.database.estimates_model import Estimate
from models.local.estimate import EstimateSchema
from models.local.contract import ContractSchema
from models.database.company_subscriptions_model import CompanySubscription
from models.local.packs import PackCreate
from models.database.packs_model import Pack
from models.local.company_subscription import CompanySubscriptionCreate
from models.database.company_subscriptions_model import CompanySubscription
from models.database.users_model import  UserTable
from models.database.companies_model import CompanyTable
from models.local.company_creation import CompanyCreateLocal
from models.api.company_api import CompanyCreatedAPI
from datetime import datetime, timedelta
from uuid import uuid4
import os
from datetime import datetime
from models.api.estimate import EstimateRequestSchema
import hashlib
from service.pdf_generator import PDFGenerator
import stripe

logger = logging.getLogger(__name__)

class Company(User):
    def __init__(self, company_query: CompanyQuery, token: str, skip_validation: bool = False, company_id_override=None):
        super().__init__(company_query, token)
        self.query = company_query

        if company_id_override:
            self.company_id = company_id_override
        if self.function == "company":
            try:
                req = self.query.read_company_by_id(self.user_id)
            except Exception as e:
                logger.warning("Erreur lors de la lecture de l'entreprise : %s", e)
                raise HTTPException(status_code=500, detail="Erreur interne lors de la récupération de l'entreprise")

            if req is None:
                logger.warning("Un token invalide a été utilisé : %s", self.user_id)
                raise HTTPException(status_code=401, detail="Token is invalid")

            if getattr(req, "verified", False) is False:
                raise HTTPException(status_code=403, detail="Please verify your email")

         
            self.firstname = req.firstname
            self.lastname = req.lastname
            self.dob = req.dob
            self.phone = req.phone
            self.email = req.email
            self.role = req.role
            self.country = req.country
            self.city = req.city
            self.street = req.street
            self.pc = req.pc
            self.verified = req.verified
            self.inscription_date = req.inscription_date
            self.company_id = req.company_id
            self.name = req.name
            self.website = req.website
            self.registration_number = req.registration_number
            self.registration_date = req.registration_date
            self.industry = req.industry
            self.revenue = req.revenue
            self.size = req.size
            self.admin_id = req.admin_id

        elif self.function == "administrator":
         if skip_validation:
          try:
            req = self.query.read_company_by_id(self.user_id)
          except Exception as e:
            logger.warning("Erreur admin lecture entreprise : %s", e)
            raise HTTPException(status_code=500, detail="Erreur lors de la récupération de l'entreprise")

          if req is None:
            raise HTTPException(status_code=404, detail="Entreprise introuvable")

          self.firstname = req.firstname
          self.lastname = req.lastname
          self.dob = req.dob
          self.phone = req.phone
          self.email = req.email
          self.role = req.role
          self.country = req.country
          self.city = req.city
          self.street = req.street
          self.pc = req.pc
          self.verified = req.verified
          self.inscription_date = req.inscription_date
          self.company_id = req.company_id
          self.name = req.name
          self.website = req.website
          self.registration_number = req.registration_number
          self.registration_date = req.registration_date
          self.industry = req.industry
          self.revenue = req.revenue
          self.size = req.size
          self.admin_id = req.admin_id

         else:
          logger.info("Admin connecté. Pas de données entreprise à charger.")
  
#Collaborateurs
    def get_collaborators(self) -> list[CollaboratorSchema]:

        collaborators = self.query.read_collaborators_by_company_id(self.company_id)
        return collaborators

    def create_collaborator(self, collaborator_data: CollaboratorSchema):
        collaborator_data.company_id = self.company_id
        collaborator_data.password = hashlib.sha512(collaborator_data.password.encode()).hexdigest()
        return self.query.create_collaborator(collaborator_data)


    def get_collaborator_by_id(self, collaborator_id: str):
       return self.query.read_collaborator_by_id(self.company_id, collaborator_id)


    def update_collaborator(self, collaborator_id: str, update_data: dict):
        return self.query.update_collaborator(self.company_id, collaborator_id, update_data)

    def delete_collaborator(self, company_id: str, collaborator_id: str):
     return self.query.delete_collaborator(company_id, collaborator_id)

    
#Bills
    def update_bill(self, company_id: str, subscription_id: str, update_data: dict):
     return self.query.update_bill(company_id, subscription_id, update_data)
    
    def get_bills(self):
        return self.query.read_all_bill_by_company_id(self.company_id)
    
      
    def get_bill(self, subscription_id: str):
      return self.query.read_bill(self.company_id, subscription_id)

  
    def create_bill(self, bill_data: BillSchema):
        bill_data.company_id = self.company_id 
        return self.query.create_bill(bill_data)

 
    def delete_bill(self, subscription_id: str):
        return self.query.delete_bill(self.company_id, subscription_id)

#Contrats   
    def get_contracts(self):
        return self.query.read_all_contract_by_company_id(self.company_id)
    
    def update_contract(self, company_id: str, subscription_id: str, update_data: dict):
        return self.query.update_contract(company_id, subscription_id, update_data)

    def delete_contract(self, company_id: str, subscription_id: str):
        return self.query.delete_contract(company_id, subscription_id)

    def get_contract(self, company_id: str, subscription_id: str):
         return self.query.read_contract(company_id, subscription_id)

    def resiliate_contract(self, company_id: str, subscription_id: str) -> dict:
      contract = self.query.get_contract(company_id, subscription_id)

      if not contract:
        raise HTTPException(404, detail="Contrat introuvable")

      if not (contract.admin_signed and contract.company_signed):
        raise HTTPException(400, detail="Le contrat doit être signé par les deux parties pour être résilié.")

      self.query.update_company_subscription_status(company_id, subscription_id, "RESILIE")

      return {"message": "Contrat résilié avec succès"}


#Estimates    

    def get_estimates(self):
        return self.query.read_all_estimate_by_company_id(self.company_id)  
   
    def update_estimate(self, company_id: str, subscription_id: str, update_data: dict):
        return self.query.update_estimate(company_id, subscription_id, update_data)

    def delete_estimate(self, company_id: str, subscription_id: str):
        return self.query.delete_estimate(company_id, subscription_id)

    def get_estimate(self, company_id: str, subscription_id: str):
         return self.query.read_estimate(company_id, subscription_id)

    def get_stats(self):
     return self.query.get_stats(self.company_id)


#Packs
    # Packs
    def create_pack(self, pack_data: PackCreate) -> Pack:
     return self.query.create_pack(pack_data)
  
    def get_pack_by_id(self, pack_id: str) -> Pack:
     return self.query.get_pack_by_id(pack_id)


#Company_subscription

    def get_company_subscription_by_id(self, sub_id: str) -> CompanySubscription:
        return self.query.get_company_subscription_by_id(sub_id)
    
    def get_company_subscriptions(self) -> list[CompanySubscription]:
     return self.query.get_company_subscriptions(self.company_id)
    

    def has_active_subscription(self) -> bool:
     try:
        if not hasattr(self, 'company_id') or not self.company_id:
            print("company_id non défini")
            return False

        print(f" Recherche des subscriptions pour company_id: {self.company_id}")
        subscriptions = self.query.get_company_subscriptions(self.company_id)
        
        if not subscriptions:
            print(" Aucune subscription trouvée")
            return False

        for sub in subscriptions:
            status = getattr(sub, 'status', '').upper()
            print(f"Subscription ID: {getattr(sub, 'id', '?')} - Status: {status}")
            if status == "ACTIVE":
                return True
        return False

     except Exception as e:
        print(f" Erreur dans has_active_subscription: {str(e)}")
        return False
     

    def process_estimate_creation(self, estimate_data: EstimateRequestSchema) -> EstimateSchema:
     if self.has_active_subscription():
        raise HTTPException(status_code=403, detail="Vous avez déjà un abonnement actif.")

     pack = self.select_pack_by_employees(estimate_data.employees)
     if not pack:
        raise HTTPException(status_code=400, detail="Aucun pack adapté")

   
     new_sub = self.query.create_subscription_auto(self.company_id, pack.pack_id)
     sub_id = new_sub.company_subscription_id

  
     devis_path = self.query.generate_estimate_pdf(self.name,  sub_id, estimate_data.employees, pack, estimate_data.signature_date)
     contrat_path = self.query.generate_contract_pdf(self.name,  sub_id, estimate_data.employees, pack, estimate_data.signature_date)

  
     estimate = self.query.create_estimate_record(
        company_id=self.company_id,
        subscription_id=new_sub.company_subscription_id,
        file_path=devis_path,
        employees=estimate_data.employees,
        signature_date=estimate_data.signature_date,
        amount=pack.annual_collaborator_price * estimate_data.employees * 1.2 
     )

     self.query.create_contract_record(
        company_id=self.company_id,
        subscription_id=new_sub.company_subscription_id,
        file_path=contrat_path,
        signed=False
     )

     return estimate

    def select_pack_by_employees(self, employees: int):
     return self.query.select_pack_by_employees(employees)

   
    def sign_by_company(self, company_id, subscription_id, signature_base64):
     contract = self.query.get_contract(company_id, subscription_id)
     if not contract:
        return None

     estimate = self.query.read_estimate(company_id, subscription_id)
     if not estimate:
        raise HTTPException(404, "Devis introuvable")

     pack = self.get_pack_by_id(self.get_company_subscription_by_id(subscription_id).pack_id)

     print("SIGNATURE INPUT =", signature_base64[:50])

     contrat_path = PDFGenerator.generate_contrat(
        company_name=self.name,
        subscription_id=subscription_id,
        plan=pack.name,
        employees=estimate.employees,
        price_per_employee=pack.annual_collaborator_price,
        consultation_nb=pack.default_consultation_number,
        chatbot_msgs=pack.chatbot_messages_number or 0,
        signature_date=datetime.utcnow(),
        company_signature_base64=signature_base64,
        admin_signature_base64=contract.admin_signature 
    )

     self.query.update_contract(company_id, subscription_id, {
        "company_signed": True,
        "company_signature": signature_base64,
        "file": contrat_path
    })

     return contrat_path


    def subscription_payement(self, company_subscription_id: str):

        estimate = self.query.read_estimate_by_subscription_id(company_subscription_id)
        bill = self.query.read_bill_by_subscription_id(company_subscription_id)

        if estimate is None or estimate.company_id != self.company_id or bill is None or bill.payed is True:
            raise HTTPException(status_code=404, detail="Estimate not found or does not belong to this company")

        try:
            checkout_session = stripe.checkout.Session.create(
                payment_method_types=["card"],
                mode="payment",
                line_items=[{
                    "price_data": {
                        "currency": "eur",
                        "product_data": {
                            "name": f'Abonnement a buisness care',
                        },
                        "unit_amount": int(estimate.amount * 100),
                    },
                    "quantity": 1,
                }],
                success_url=f"https://www.{os.environ.get('DOMAIN')}/societes/factures?payment_status=success",
                cancel_url=f"https://www.{os.environ.get('DOMAIN')}/societes/factures?payment_status=cancel",
                payment_intent_data={},
                metadata={
                    "origin": "company-subscription",
                    "company_subscription_id": company_subscription_id,
                    "token": self.token
                }
            )
        except stripe.error.StripeError as e:
            print(f"Stripe error: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")
        except Exception as e:
            print(f"Error creating Stripe session: {str(e)}")
            raise HTTPException(status_code=500, detail="An internal error occurred while preparing the payment.")

        return {"checkout_session_id": checkout_session.id}
