from sqlmodel import select
from .user_queries import UserQuery
from fastapi import  HTTPException
from service.logging import logging
from models.database.users_model import UserTable
from models.database.companies_model import CompanyTable
from models.database.collaborators_model import CollaboratorTable
from models.database.bills_model import BillTable
from models.database.contracts_model import Contract
from models.database.estimates_model import Estimate
from models.local.user import CompanySchema
from models.local.user import CollaboratorSchema
from models.local.user import UserSchema
from models.local.user import  CompanyUpdateSchema
from models.local.bill import BillSchema
from models.local.contract import ContractSchema
from models.local.estimate import EstimateSchema
from datetime import datetime, timedelta
from sqlalchemy.orm import joinedload
from datetime import datetime, timedelta
from sqlalchemy import text
from sqlalchemy.orm import Session
from models.database.company_subscriptions_model import CompanySubscription
from models.local.user import CollaboratorCreateRequest
from models.database.packs_model import Pack
from models.local.packs import PackCreate
from models.local.company_subscription import CompanySubscriptionCreate
from models.database.company_subscriptions_model import CompanySubscription
import hashlib
from models.database.contracts_model import Contract
from sqlalchemy import insert
logger = logging.getLogger(__name__)
from uuid import uuid4
from datetime import datetime
from service.pdf_generator import PDFGenerator  

from typing import Optional


class CompanyQuery(UserQuery):
    def __init__(self):
        super().__init__()



    
    def read_company_by_id(self, uuid: str) -> Optional[CompanySchema]:
     with self.get_session() as session:
        stmt = (
            select(CompanyTable, UserTable)
            .join(UserTable, CompanyTable.company_id == UserTable.user_id)
            .where(CompanyTable.company_id == uuid)
        )
        result = session.execute(stmt).one_or_none()

        if not result:
            return None  

        company, user = result
        data = {**user.__dict__, **company.__dict__}
        return CompanySchema.from_orm(data)




    def update_company_by_id(self, company_id: str, data: CompanyUpdateSchema):
     with self.get_session() as session:
        db_obj = session.get(CompanyTable, company_id)
        if db_obj is None:
            return False

        for field, value in data.model_dump().items():
            setattr(db_obj, field, value)

        session.commit()
        session.refresh(db_obj)
        return CompanyUpdateSchema.model_validate(db_obj.__dict__) 





#Collaborators
    def read_collaborators_by_company_id(self, uuid: str):
            with self.get_session() as session:
                stmt = select(CollaboratorTable, UserTable).join(UserTable, CollaboratorTable.collaborator_id == UserTable.user_id).where(CollaboratorTable.company_id == uuid)
                results = session.execute(stmt).all()

                datas = []
                for collaborator, user in results:
                    combined_data = {**collaborator.__dict__, **user.__dict__}
                    datas.append(CollaboratorSchema.from_orm(combined_data))

                return [CollaboratorSchema.from_orm(data) for data in datas]


    def create_collaborator(self, collaborator_data: CollaboratorSchema):
     with self.get_session() as session:
        hashed_password = hashlib.sha512(collaborator_data.password.encode("utf-8")).hexdigest()

        user = UserTable(
            user_id=collaborator_data.user_id,
            firstname=collaborator_data.firstname,
            lastname=collaborator_data.lastname,
            dob=collaborator_data.dob,
            phone=collaborator_data.phone,
            email=collaborator_data.email,
            password=collaborator_data.password,
            role=collaborator_data.role,
            country=collaborator_data.country,
            city=collaborator_data.city,
            street=collaborator_data.street,
            pc=collaborator_data.pc,
            inscription_date=collaborator_data.inscription_date,
            verified=collaborator_data.verified,
        )
        session.add(user)
        session.flush()  

        collaborator = CollaboratorTable(
            collaborator_id=collaborator_data.collaborator_id,
            company_id=collaborator_data.company_id
        )
        session.add(collaborator)
        session.commit()
        return collaborator_data

    def read_collaborator_by_id(self, company_id: str, collaborator_id: str):
     with self.get_session() as session:
        stmt = (
            select(CollaboratorTable, UserTable)
            .join(UserTable, CollaboratorTable.collaborator_id == UserTable.user_id)
            .where(
                CollaboratorTable.company_id == company_id,
                CollaboratorTable.collaborator_id == collaborator_id
            )
        )
        result = session.execute(stmt).one_or_none()

        if not result:
            return None

        collaborator, user = result
        combined_data = {**collaborator.__dict__, **user.__dict__}
        return CollaboratorSchema.model_validate(combined_data)




    def update_collaborator(self, company_id: str, collaborator_id: str, update_data: dict):
     with self.get_session() as session:
       
        stmt_collab = select(CollaboratorTable).where(
            CollaboratorTable.company_id == company_id,
            CollaboratorTable.collaborator_id == collaborator_id
        )
        collaborator = session.execute(stmt_collab).scalar_one_or_none()

        if not collaborator:
            return None

        
        stmt_user = select(UserTable).where(UserTable.user_id == collaborator_id)
        user = session.execute(stmt_user).scalar_one_or_none()

        if not user:
            return None

       
        for field in ["company_id"]:  
            if field in update_data:
                setattr(collaborator, field, update_data[field])

      
        user_fields = [
            "firstname", "lastname", "dob", "phone", "email",
            "role", "country", "city", "street", "pc", "verified",
            "inscription_date", "password", "function"
        ]
        for field in user_fields:
            if field in update_data:
                setattr(user, field, update_data[field])

        session.commit()
        session.refresh(collaborator)
        session.refresh(user)

      
        merged_data = {**user.__dict__, **collaborator.__dict__}
        return CollaboratorSchema.model_validate(merged_data)



    def delete_collaborator(self, company_id: str, collaborator_id: str):
     with self.get_session() as session:
     
        stmt_collab = select(CollaboratorTable).where(
            CollaboratorTable.company_id == company_id,
            CollaboratorTable.collaborator_id == collaborator_id
        )
        collaborator = session.execute(stmt_collab).scalar_one_or_none()

        if not collaborator:
            return False
        
        session.delete(collaborator)

    
        stmt_user = select(UserTable).where(UserTable.user_id == collaborator_id)
        user = session.execute(stmt_user).scalar_one_or_none()

        if user:
            session.delete(user)

        session.commit()
        return True



#Bills
    def read_all_bill_by_company_id(self, uuid: str):
        with self.get_session() as session:
            stmt = select(BillTable).where(BillTable.company_id == uuid)
            results = session.execute(stmt).scalars().all() 

            return [BillSchema.model_validate(bill) for bill in results]

    def read_bill(self, company_id: str, subscription_id: str):
      with self.get_session() as session:
        stmt = select(BillTable).where(
            BillTable.company_id == company_id,
            BillTable.company_subscription_id == subscription_id
        )
        result = session.execute(stmt).scalar_one_or_none()

        if not result:
            return None
        
        return BillSchema.model_validate(result)


    def create_bill(self, bill_data: BillSchema):
       with self.get_session() as session:
        try:
            bill = BillTable(**bill_data.model_dump())
            session.add(bill)
            session.commit()
            session.refresh(bill)
            return BillSchema.model_validate(bill)
        except Exception as e:
            session.rollback()
            raise e


    

    def update_bill(self, company_id: str, subscription_id: str, update_data: dict):
     with self.get_session() as session:
        query = text("""
            UPDATE bills
            SET payed = :payed
            WHERE company_id = :company_id AND company_subscription_id = :subscription_id
        """)
        values = {
            "payed": int(update_data["payed"]),  
            "company_id": company_id,
            "subscription_id": subscription_id,
        }
        result = session.execute(query, values)
        session.commit()
        return result.rowcount > 0


    def delete_bill(self, company_id: str, subscription_id: str):
       with self.get_session() as session:
        stmt = select(BillTable).where(
            BillTable.company_id == company_id,
            BillTable.company_subscription_id == subscription_id
        )
        result = session.execute(stmt).scalar_one_or_none()

        if not result:
            return None

        session.delete(result)
        session.commit()
        return True



    
    def update_company_subscription_status(self, company_id: str, subscription_id: str, new_status: str):
     with self.get_session() as session:
        subscription = session.get(CompanySubscription, (company_id, subscription_id))
        if not subscription:
            raise HTTPException(404, "Abonnement introuvable")

        subscription.status = new_status
        session.add(subscription)
        session.commit()



    def read_all_contract_by_company_id(self, company_id: str):
     with self.get_session() as session:
        stmt = select(Contract).where(Contract.company_id == company_id)
        results = session.execute(stmt).scalars().all()

        contracts = []
        now = datetime.utcnow()

        for contract in results:
       
            if contract.admin_signed and contract.signature_date:
                expiration_date = contract.signature_date + timedelta(days=365)
                if expiration_date < now:
            
                    sub = session.get(CompanySubscription, (contract.company_id, contract.company_subscription_id))
                    if sub and sub.status != "EXPIREE":
                        sub.status = "EXPIREE"
                        session.add(sub)

        session.commit()

        for contract in results:
            schema = ContractSchema.model_validate(contract, from_attributes=True)
            data = schema.model_dump()
            data["signed"] = contract.company_signed and contract.admin_signed
            data["company_signed"] = contract.company_signed
            data["admin_signed"] = contract.admin_signed

            sub = session.get(CompanySubscription, (contract.company_id, contract.company_subscription_id))
            data["status"] = sub.status if sub else "INCONNU"

            contracts.append(data)

        return contracts


    def get_contract(self, company_id: str, subscription_id: str):
      with self.get_session() as session:
        stmt = select(Contract).where(
            Contract.company_id == company_id,
            Contract.company_subscription_id == subscription_id
        )
        result = session.execute(stmt).scalar_one_or_none()

        if not result:
            return None

        return ContractSchema.model_validate(result, from_attributes=True)

    def update_contract(self, company_id: str, subscription_id: str, update_data: dict):
     with self.get_session() as session:
        stmt = select(Contract).where(
            Contract.company_id == company_id,
            Contract.company_subscription_id == subscription_id
        )
        result = session.execute(stmt).scalar_one_or_none()
        if not result:
            return None
        for key, value in update_data.items():
            setattr(result, key, value)
        session.commit()
        session.refresh(result)
        return ContractSchema.model_validate(result, from_attributes=True)


    
    def delete_contract(self, company_id: str, subscription_id: str):
        with self.get_session() as session:
            stmt = select(Contract).where(
                Contract.company_id == company_id,
                Contract.company_subscription_id == subscription_id
            )
            result = session.execute(stmt).scalar_one_or_none()
            if not result:
                return None
            session.delete(result)
            session.commit()
            return True

        
    

# Estimates

    def read_all_estimate_by_company_id(self, uuid: str):
        with self.get_session() as session:
            stmt = select(Estimate).where(Estimate.company_id == uuid)
            results = session.execute(stmt).scalars().all() 

            return [EstimateSchema.model_validate(estimate) for estimate in results]
        

    def read_estimate(self, company_id: str, subscription_id: str):
        with self.get_session() as session:
            stmt = select(Estimate).where(
                Estimate.company_id == company_id,
                Estimate.company_subscription_id == subscription_id
            )
            result = session.execute(stmt).scalar_one_or_none()
            if not result:
                return None
            return EstimateSchema.model_validate(result)


    def update_estimate(self, company_id: str, subscription_id: str, update_data: dict):
        with self.get_session() as session:
            stmt = select(Estimate).where(
                Estimate.company_id == company_id,
                Estimate.company_subscription_id == subscription_id
            )
            result = session.execute(stmt).scalar_one_or_none()
            if not result:
                return None
            for key, value in update_data.items():
                setattr(result, key, value)
            session.commit()
            session.refresh(result)
            return EstimateSchema.model_validate(result)
     
   
 



    def get_stats(self, company_id: str):
     with self.get_session() as session:
        salaries = session.query(CollaboratorTable).filter_by(company_id=company_id).count()
        contracts = session.query(Contract).filter_by(company_id=company_id).count()
        factures = session.query(BillTable).filter_by(company_id=company_id).count()
        devis = session.query(Estimate).filter_by(company_id=company_id).count()

     return {
        "salaries": salaries,
        "contracts": contracts,
        "factures": factures,
        "devis": devis
    }


#Packs

    def create_pack(self, pack_data: PackCreate) -> Pack:
        
        with self.get_session() as session:
            print("Reçu pour /packs:", pack_data.model_dump()) 
            new_pack = Pack(**pack_data.model_dump())
            session.add(new_pack)
            session.commit()
            session.refresh(new_pack)
            return new_pack

    def get_pack_by_id(self, pack_id: str) -> Pack:
        with self.get_session() as session:
            statement = select(Pack).where(Pack.pack_id == pack_id)
            result = session.exec(statement).first()
            return result
        
#company_subscription

    def get_company_subscription_by_id(self, subscription_id: str) -> CompanySubscription:
        with self.get_session() as session:
            stmt = select(CompanySubscription).where(CompanySubscription.company_subscription_id == subscription_id)
            return session.exec(stmt).first()        
        



    def get_company_subscriptions(self, company_id: str) -> list[CompanySubscription]:
     try:
        with self.get_session() as session:
            print(f" Exécution de la requête pour company_id: {company_id}")
            stmt = select(CompanySubscription).where(CompanySubscription.company_id == company_id)
            result = session.execute(stmt).scalars().all()
            print(f" Nombre de résultats: {len(result)}")
            return result
     except Exception as e:
        print(f" Erreur SQL: {str(e)}")
        raise 
     


    def create_subscription_auto(self, company_id: str, pack_id: str) -> CompanySubscription:
     new_sub = CompanySubscription(
        company_subscription_id=str(uuid4()),
        company_id=company_id,
        pack_id=pack_id,
        status="EN ATTENTE",
        creation_date=datetime.utcnow(),
        bonus_consultation_number=10 
     )
     with self.get_session() as session:
        session.add(new_sub)
        session.commit()
        session.refresh(new_sub)
        return new_sub


    def create_estimate_record(self, company_id, subscription_id, file_path, employees, signature_date, amount) -> EstimateSchema:
     estimate = Estimate(
        estimate_id=str(uuid4()),
        company_id=company_id,
        company_subscription_id=subscription_id,
        file=file_path,
        employees=employees,
        signature_date=signature_date,
        creation_date=datetime.utcnow(),
        amount=amount
    )
     with self.get_session() as session:
        session.add(estimate)
        session.commit()
        session.refresh(estimate)
        return EstimateSchema.model_validate(estimate)

    def create_contract_record(self, company_id, subscription_id, file_path, signed=False):
     contract = Contract(
    company_id=company_id,
    company_subscription_id=subscription_id,
    file=file_path,
    company_signed=False,
    admin_signed=False,
    creation_date=datetime.utcnow()
)

     with self.get_session() as session:
        session.add(contract)
        session.commit()

    def select_pack_by_employees(self, employees: int):
     with self.get_session() as session:
        stmt = (
            select(Pack)
            .where(Pack.staff_size >= employees)
            .order_by(Pack.staff_size.asc())
        )
        return session.execute(stmt).scalars().first()


    
    def generate_estimate_pdf(self, company_name: str, subscription_id:str , employees: int, pack, signature_date: datetime) -> str:
     return PDFGenerator.generate_devis(
        company_name=company_name,
        subscription_id=subscription_id,
        plan=pack.name,
        employees=employees,
        price_per_employee=pack.annual_collaborator_price,
        consultation_nb=pack.default_consultation_number,
        chatbot_msgs=pack.chatbot_messages_number or 0,
        staff_size=pack.staff_size,
        signature_date=signature_date
    )

    def generate_contract_pdf(self, company_name: str , subscription_id:str , employees: int, pack, signature_date: datetime) -> str:
     return PDFGenerator.generate_contrat(
        company_name=company_name,
        subscription_id=subscription_id,
        plan=pack.name,
        employees=employees,
        price_per_employee=pack.annual_collaborator_price,
        consultation_nb=pack.default_consultation_number,
        chatbot_msgs=pack.chatbot_messages_number or 0,
        signature_date=signature_date
    )

    def generate_facture_pdf(self, company_name, subscription_id, pack, total_ht, tva, total_ttc, date_facture):
     return PDFGenerator.generate_facture(
        company_name=company_name,
        subscription_id=subscription_id,
        plan=pack.name,
        total_ht=total_ht,
        tva=tva,
        total_ttc=total_ttc,
        date_facture=date_facture
     )

    def read_estimate_by_subscription_id(self, subscription_id: str):
        with self.get_session() as session:
            stmt = select(Estimate).where(Estimate.company_subscription_id == subscription_id)
            result = session.execute(stmt).scalar_one_or_none()
            return result


    def update_bill2(self, company_id: str, subscription_id: str, update_data: dict):
        with self.get_session() as session:
            stmt = select(BillTable).where(
                BillTable.company_id == company_id,
                BillTable.company_subscription_id == subscription_id
            )
            result = session.execute(stmt).scalar_one_or_none()
            if not result:
                return None
            for key, value in update_data.items():
                setattr(result, key, value)
            session.commit()
            session.refresh(result)
            return result

    def read_bill_by_subscription_id(self, subscription_id: str):
        with self.get_session() as session:
            stmt = select(BillTable).where(BillTable.company_subscription_id == subscription_id)
            result = session.execute(stmt).scalar_one_or_none()
            if not result:
                return None
            return result