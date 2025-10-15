from models.database.administrators_model import AdministratorTable
from queries.company_queries import CompanyQuery
from queries.collaborator_queries import CollaboratorQuery
from fastapi import  HTTPException
import random
from uuid import UUID
from models.database.estimates_model import Estimate
from models.database.companies_model import CompanyTable
from models.api.estimate import EstimateAdminResponse
from .user_queries import UserQuery
from sqlmodel import select, func , Session
from models.database.users_model import UserTable
from models.database.collaborators_model import CollaboratorTable
from models.api.company_api import CompanyResponse
from models.api.user import CollaboratorWithCompanyResponse
from models.database.events_model import Event
from models.database.contracts_model import Contract
from models.database.company_subscriptions_model import CompanySubscription
from models.api.contract import ContractAdminResponse
from models.database.bills_model import BillTable
from models.api.bill import BillAdminResponse
from typing import List
from models.database.contractors_model  import ContractorTable
from models.database.categories_model import Category
from models.local.forum import CategorySchema
from models.api.company_api import CompanyAdminResponse, CompanyUpdate
from models.database.subjects_model import Subject
from models.local.forum import SubjectAdminResponse
from sqlalchemy.exc import IntegrityError
from models.database.tickets_model import Ticket
from models.api.ticket import TicketAdminResponse
from .base_queries import BaseQuery
from models.database.ngo_model import Ngo
from models.database.messages_model import Message
from uuid import uuid4
from datetime import datetime
def get_random_admin_id() -> str:
    query = AdminQuery()
    with query.get_session() as session:
        admin_ids = session.query(AdministratorTable.admin_id).all()
        if not admin_ids:
            raise Exception("Aucun administrateur disponible")

        return random.choice(admin_ids)[0]


class AdminQuery(UserQuery):
    def __init__(self):
        super().__init__()

    def get_all_companies(self):
        with self.get_session() as session:
            statement = select(CompanyTable, UserTable).join(UserTable, CompanyTable.company_id == UserTable.user_id)
            results = session.exec(statement).all()

            return [
                CompanyAdminResponse(
                    company_id=company.company_id,
                    name=company.name,
                    website=company.website,
                    registration_number=company.registration_number,
                    registration_date=company.registration_date,
                    industry=company.industry,
                    revenue=company.revenue,
                    size=company.size,
                    firstname=user.firstname,
                    lastname=user.lastname,
                    email=user.email,
                    phone=user.phone,
                    country=user.country,
                    city=user.city,
                    street=user.street,
                    pc=user.pc,
                )
                for company, user in results
            ]


    def update_company(self, company_id: str, data: CompanyUpdate) -> CompanyAdminResponse:
        with self.get_session() as session:
            company = session.get(CompanyTable, company_id)
            if not company:
                raise Exception("Entreprise non trouvée")
            for key, value in data.dict(exclude_unset=True).items():
                setattr(company, key, value)
            session.add(company)
            session.commit()
            session.refresh(company)
            user = session.get(UserTable, company_id)
            return CompanyAdminResponse(**company.dict(), **user.dict())


    def delete_company(self, company_id: str):
     with self.get_session() as session:
        company = session.get(CompanyTable, company_id)
        user = session.get(UserTable, company_id)
        if not company:
            raise Exception("Entreprise non trouvée")
        session.delete(company)
        if user:
            session.delete(user)
        session.commit()
        
    def get_all(self) -> List[CollaboratorWithCompanyResponse]:
       with self.get_session() as session:
            statement = (
                select(UserTable, CompanyTable.name)
                .join(CollaboratorTable, CollaboratorTable.collaborator_id == UserTable.user_id)
                .join(CompanyTable, CollaboratorTable.company_id == CompanyTable.company_id)
            )
            results = session.exec(statement).all()
            return [
                CollaboratorWithCompanyResponse(
                    user_id=user.user_id,
                    firstname=user.firstname,
                    lastname=user.lastname,
                    dob=user.dob,
                    phone=user.phone,
                    email=user.email,
                    country=user.country,
                    city=user.city,
                    street=user.street,
                    pc=user.pc,
                    verified=user.verified,
                    inscription_date=user.inscription_date,
                    company_name=company_name,
                )
                for user, company_name in results
            ]

    def update_collaborator(self, collaborator_id: str, data: dict) -> CollaboratorWithCompanyResponse:
     with self.get_session() as session:
        user = session.get(UserTable, collaborator_id)
        if not user:
            raise Exception("Collaborateur non trouvé")

        for key, value in data.items():
            if hasattr(user, key):
                setattr(user, key, value)

        session.add(user)
        session.commit()
        session.refresh(user)

        company = session.exec(
            select(CompanyTable.name).join(CollaboratorTable).where(CollaboratorTable.collaborator_id == user.user_id)
        ).first()

        return CollaboratorWithCompanyResponse(**user.dict(), company_name=company[0] if company else None)

    def delete_collaborator(self, collaborator_id: str):
        with self.get_session() as session:
            try:
                collaborator = session.get(CollaboratorTable, collaborator_id)
                if collaborator:
                    session.delete(collaborator)

                user = session.get(UserTable, collaborator_id)
                if not user:
                    raise HTTPException(status_code=404, detail="Collaborateur non trouvé")
                session.delete(user)

                session.commit()
            except IntegrityError as e:
                session.rollback()
                # Remonte l'erreur avec un message descriptif pour le front
                raise HTTPException(
                    status_code=400,
                    detail=f"Impossible de supprimer ce collaborateur en raison d'une contrainte liée : {e.orig}"
                )
            except Exception as e:
                session.rollback()
                raise HTTPException(
                    status_code=500,
                    detail=f"Erreur inattendue: {str(e)}"
                )

    def get_all_estimates_with_company_name(self, token: str) -> List[EstimateAdminResponse]:
     query = CompanyQuery()
     with query.get_session() as session:
        statement = (
            select(
                Estimate.company_subscription_id,
                Estimate.file,
                Estimate.creation_date,
                Estimate.signature_date,
                Estimate.employees,
                Estimate.amount,
                CompanyTable.name.label("company_name"),
                CompanySubscription.status.label("subscription_status"),
            )
            .join(CompanyTable, Estimate.company_id == CompanyTable.company_id)
            .join(CompanySubscription, Estimate.company_subscription_id == CompanySubscription.company_subscription_id)
        )
        results = session.exec(statement).all()

        return [
            EstimateAdminResponse(
                company_subscription_id=row.company_subscription_id,
                file=row.file,
                creation_date=row.creation_date,
                signature_date=row.signature_date,
                employees=row.employees,
                amount=row.amount,
                company_name=row.company_name,
                subscription_status=row.subscription_status,
            )
            for row in results
        ]
    def get_all_contracts_with_company_name(self, token: str) -> List[ContractAdminResponse]:
     query = CompanyQuery()
     with query.get_session() as session:
        statement = (
            select(
                Contract.company_id,
                Contract.company_subscription_id,
                Contract.file,
                Contract.creation_date,
                Contract.signature_date,
                Contract.company_signed,
                Contract.admin_signed,
                CompanyTable.name.label("company_name"),
                CompanySubscription.status.label("subscription_status")
            )
            .join(
                CompanySubscription,
                (Contract.company_subscription_id == CompanySubscription.company_subscription_id) &
                (Contract.company_id == CompanySubscription.company_id)  
            )
            .join(CompanyTable, Contract.company_id == CompanyTable.company_id)
        )

        results = session.exec(statement).all()

        filtered_contracts = []
        for row in results:
            estimate = session.exec(
                select(Estimate).where(
                    Estimate.company_id == row.company_id,
                    Estimate.company_subscription_id == row.company_subscription_id
                )
            ).first()

            if not estimate:
                continue

            filtered_contracts.append(
                ContractAdminResponse(
                    company_id=row.company_id,
                    company_subscription_id=row.company_subscription_id,
                    file=row.file,
                    creation_date=row.creation_date,
                    signature_date=row.signature_date,
                    company_signed=row.company_signed,
                    admin_signed=row.admin_signed,
                    company_name=row.company_name,
                    subscription_status=row.subscription_status,  # ✅ sera bien renseigné
                )
            )

        return filtered_contracts


    def get_all_bills_with_company_name(self, token: str) -> List[BillAdminResponse]:
        query = CompanyQuery()
        with query.get_session() as session:
            statement = (
                select(
                    BillTable.company_subscription_id,
                    BillTable.file,
                    BillTable.payed,
                    CompanyTable.name.label("company_name"),
                    CompanySubscription.status.label("subscription_status")
                )
                .join(CompanySubscription, BillTable.company_subscription_id == CompanySubscription.company_subscription_id)
                .join(CompanyTable, BillTable.company_id == CompanyTable.company_id)
            )

            results = session.exec(statement).all()

            return [
                BillAdminResponse(
                    company_subscription_id=row.company_subscription_id,
                    file=row.file,
                    payed=row.payed,
                    company_name=row.company_name,
                    subscription_status=row.subscription_status,
                )
                for row in results
            ]
        


    def get_all_forum_categories(self) -> List[CategorySchema]:
        with self.get_session() as session:
            results = session.exec(select(Category)).all()
            return [CategorySchema(**c.dict()) for c in results]

    def create_forum_category(self, title: str) -> CategorySchema:
        from uuid import uuid4
        new_category = Category(category_id=str(uuid4()), title=title)
        with self.get_session() as session:
            session.add(new_category)
            session.commit()
            session.refresh(new_category)
            return CategorySchema(**new_category.dict())


    def update_forum_category(self, category_id: str, title: str) -> CategorySchema:
     with self.get_session() as session:
        category = session.get(Category, category_id)
        if not category:
            raise Exception("Catégorie introuvable")
        category.title = title
        session.add(category)
        session.commit()
        session.refresh(category)
        return CategorySchema(**category.dict())
  

    def delete_forum_category(self, category_id: str):
     with self.get_session() as session:
        category = session.get(Category, category_id)
        if not category:
            raise Exception("Catégorie introuvable")
        session.delete(category)
        session.commit()



    def get_all_subjects_with_category_name(self, token: str) -> List[SubjectAdminResponse]:
        with self.get_session() as session:
            statement = (
                select(
                    Subject.subject_id,
                    Subject.title,
                    Subject.creation_date,
                    Category.title.label("category_name"),
                    (UserTable.firstname + " " + UserTable.lastname).label("collaborator_name")
                )
                .join(Category, Subject.category_id == Category.category_id)
                .join(CollaboratorTable, Subject.collaborator_id == CollaboratorTable.collaborator_id)
                .join(UserTable, CollaboratorTable.collaborator_id == UserTable.user_id)
            )
            results = session.exec(statement).all()
            return [SubjectAdminResponse(**row._asdict()) for row in results]


    def delete_subject(self, subject_id: str):
        with self.get_session() as session:
            subject = session.get(Subject, subject_id)
            if not subject:
                raise Exception("Sujet introuvable")
            session.delete(subject)
            session.commit()

    def update_subject_title(self, subject_id: str, title: str):
        with self.get_session() as session:
            subject = session.get(Subject, subject_id)
            if not subject:
                raise Exception("Sujet introuvable")
            subject.title = title
            session.add(subject)
            session.commit()
            session.refresh(subject)
            return subject

    def create_subject(self, title: str, category_id: str) -> Subject:
        from uuid import uuid4
        from datetime import datetime, timezone
        new_subject = Subject(
            subject_id=str(uuid4()),
            collaborator_id="a01973df-c332-4b5b-9973-dfc3327b5b1a",  
            title=title,
            category_id=category_id,
            creation_date=datetime.now(timezone.utc)
        )
        with self.get_session() as session:
            session.add(new_subject)
            session.commit()
            session.refresh(new_subject)
            return new_subject

    def read_estimate_by_subscription_id(self, subscription_id: str):
     with self.get_session() as session:
        stmt = select(Estimate).where(Estimate.company_subscription_id == subscription_id)
        result = session.execute(stmt).scalar_one_or_none()
        return result
     

    def delete_estimate(self, company_id: str, subscription_id: str):
        with self.get_session() as session:
            stmt = select(Estimate).where(
                Estimate.company_id == company_id,
                Estimate.company_subscription_id == subscription_id
            )
            result = session.execute(stmt).scalar_one_or_none()
            if not result:
                return None
            session.delete(result)
            session.commit()
            return True
    

    def delete_bill(self, subscription_id: str) -> bool:
     with self.get_session() as session:
        bill = session.exec(
            select(BillTable).where(BillTable.company_subscription_id == subscription_id)
        ).first()
        if not bill:
            return False
        session.delete(bill)
        session.commit()
        return True
     

    def delete_contract(self, company_id: str, subscription_id: str) -> bool:
     with self.get_session() as session:
        stmt = select(Contract).where(
            Contract.company_id == company_id,
            Contract.company_subscription_id == subscription_id
        )
        result = session.execute(stmt).scalar_one_or_none()
        if not result:
            return False
        session.delete(result)
        session.commit()
        return True
 

    def get_all_tickets(self):
        with self.get_session() as session:
            statement = (
                select(
                    Ticket,
                    UserTable.firstname,
                    UserTable.lastname,
                    UserTable.role
                )
                .join(UserTable, Ticket.user_id == UserTable.user_id)
            )
            results = session.exec(statement).all()

            return [
                TicketAdminResponse(
                    ticket_id=ticket.ticket_id,
                    title=ticket.title,
                    text=ticket.text,
                    open_date=ticket.open_date,
                    close_date=ticket.close_date,
                    user_firstname=firstname,
                    user_lastname=lastname,
                    user_role=role,
                    status="Terminé" if ticket.close_date else "En attente"
                )
                for ticket, firstname, lastname, role in results
            ]
        

    def delete_ticket(self, ticket_id: str) -> bool:
     with self.get_session() as session:
        ticket = session.get(Ticket, ticket_id)
        if not ticket:
            return False
        session.delete(ticket)
        session.commit()
        return True
      


    def create_message_reply(self, ticket_id: str, text: str, admin_id: str):
     with self.get_session() as session:
        ticket = session.get(Ticket, ticket_id)
        if not ticket:
            return False

        message = Message(
            ticket_id=ticket_id,
            messages_id=str(uuid4()),
            text=text,
            creation_date=datetime.utcnow(),
            admin_id=admin_id
        )
        session.add(message)
        session.commit()
        return True
        

    def reply_to_ticket(self, ticket_id: str, text: str, admin_id: str) -> bool:
          return self.create_message_reply(ticket_id, text, admin_id)


    def get_ticket_with_messages(self, ticket_id: str):
     with self.get_session() as session:
        ticket = session.get(Ticket, ticket_id)
        if not ticket:
            return None

        messages = session.exec(
            select(Message).where(Message.ticket_id == ticket_id).order_by(Message.creation_date)
        ).all()

        enriched_messages = []
        for msg in messages:
            if msg.admin_id:
                admin_user = session.get(UserTable, msg.admin_id)
                name = f"{admin_user.firstname} {admin_user.lastname}" if admin_user else "Admin"
                enriched_messages.append({
                    "text": msg.text,
                    "creation_date": msg.creation_date,
                    "admin_name": name
                })
            elif msg.user_id:
                user = session.get(UserTable, msg.user_id)
                name = f"{user.firstname} {user.lastname}" if user else "Utilisateur"
                enriched_messages.append({
                    "text": msg.text,
                    "creation_date": msg.creation_date,
                    "user_name": name
                })

        return {
            "ticket": {
                "ticket_id": ticket.ticket_id,
                "title": ticket.title,
                "text": ticket.text,
                "open_date": ticket.open_date,
                "close_date": ticket.close_date,
            },
            "messages": enriched_messages
        }


    def get_all_contractors(self):
        with self.get_session() as session:
            statement = (
                select(
                    ContractorTable.contractor_id,
                    ContractorTable.registration_number,
                    ContractorTable.registration_date,
                    ContractorTable.contract_file,
                    ContractorTable.sign_date,
                    ContractorTable.service,
                    ContractorTable.service_price,
                    ContractorTable.website,
                    ContractorTable.intervention,
                    ContractorTable.type,
                    UserTable.firstname,
                    UserTable.lastname,
                    UserTable.email,
                    UserTable.phone,
                    UserTable.city,
                    UserTable.country
                )
                .join(UserTable, UserTable.user_id == ContractorTable.contractor_id)
            )
            return session.exec(statement).all()
        

    def get_all_ngos(self):
        with self.get_session() as session:
            statement = select(
                Ngo.ngo_id,
                Ngo.name,
                Ngo.registration_number,
                Ngo.registration_date,
                Ngo.address,
                Ngo.country,
                Ngo.type,
                Ngo.presentation,
                Ngo.website,
                Ngo.phone
            )
            return session.exec(statement).all()    
        
        
    def insert_ngo(self, ngo_data):
      with self.get_session() as session:
      
        data = ngo_data.dict()
        if "ngo_id" in data and isinstance(data["ngo_id"], UUID):
            data["ngo_id"] = str(data["ngo_id"])
        ngo = Ngo(**data)
        session.add(ngo)
        session.commit()
        session.refresh(ngo)
        return ngo

    def delete_ngo(self, ngo_id: str):
        with self.get_session() as session:
            ngo = session.get(Ngo, ngo_id)
            if not ngo:
                raise HTTPException(status_code=404, detail="Association non trouvée")
            try:
                session.delete(ngo)
                session.commit()
            except IntegrityError:
                session.rollback()
                raise HTTPException(
                    status_code=400,
                    detail="Impossible de supprimer cette association car des événements associés existent."
                )
            return {"detail": "Association supprimée"}

    def get_events_by_ngo(self, ngo_id: str):
        with self.get_session() as session:
            stmt = select(Event).where(Event.ngo_id == ngo_id)
            return session.exec(stmt).all()



    def create_event(self, ngo_id: str, event_data):
     with self.get_session() as session:
        event = Event(**event_data.dict(), ngo_id=ngo_id)
        session.add(event)
        session.commit()
        session.refresh(event)
        return event


    def delete_event(self, event_id: str):
        with self.get_session() as session:
            event = session.get(Event, event_id)
            if not event:
                return False
            session.delete(event)
            session.commit()
            return True
        

    def get_services_summary(self):
        with self.get_session() as session:
            stmt = (
                select(ContractorTable.service, func.count().label("count"))
                .group_by(ContractorTable.service)
            )
            return session.exec(stmt).all()

    def get_contractors_by_service(self, service: str):
        with self.get_session() as session:
            stmt = select(ContractorTable).where(ContractorTable.service == service)
            return session.exec(stmt).all()

    def get_intervention_summary(self):
        with self.get_session() as session:
            stmt = (
                select(ContractorTable.intervention, func.count().label("count"))
                .group_by(ContractorTable.intervention)
            )
            return session.exec(stmt).all()
    

    def resiliate_subscription(self, company_id: str, subscription_id: str) -> dict:
     with self.get_session() as session:
        subscription = session.query(CompanySubscription).filter_by(
            company_id=company_id,
            company_subscription_id=subscription_id
        ).first()

        if not subscription:
            raise HTTPException(status_code=404, detail="Abonnement introuvable")

        subscription.status = "RESILIE"
        session.add(subscription)
        session.commit()

        return {"message": "Abonnement résilié avec succès"}


    def close_ticket(self, ticket_id: str) -> bool:
     with self.get_session() as session:
        ticket = session.get(Ticket, ticket_id)
        if not ticket:
            raise HTTPException(status_code=404, detail="Ticket introuvable")

        ticket.close_date = datetime.utcnow()
        session.add(ticket)
        session.commit()
        return True
