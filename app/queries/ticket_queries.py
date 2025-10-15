from models.database.tickets_model import Ticket
from models.database.messages_model import Message
from models.api.ticket import TicketResponse
from sqlmodel import select
from uuid import uuid4
from datetime import datetime
from .base_queries import BaseQuery
from models.database.users_model import UserTable
from models.database.administrators_model import AdministratorTable
import random

class TicketQuery(BaseQuery):

    def get_random_admin_id(self, session):
        admins = session.exec(select(AdministratorTable.admin_id)).all()
        if not admins:
            raise Exception("Aucun administrateur disponible")
        return str(random.choice(admins))

    def create_ticket_with_message(self, title, text, user_id):
        with self.get_session() as session:
            admin_id = self.get_random_admin_id(session)

            ticket_id = str(uuid4()) 
            message_id = str(uuid4())

            ticket = Ticket(
                ticket_id=ticket_id,
                title=title,
                text=text,
                user_id=str(user_id),  
                admin_id=admin_id
            )
            session.add(ticket)
            session.commit()
            session.refresh(ticket)

            message = Message(
                ticket_id=ticket_id,
                messages_id=message_id,
                text=text,
                creation_date=datetime.utcnow(),
                user_id=str(user_id),
                admin_id=admin_id
            )
            session.add(message)
            session.commit()

            return TicketResponse(
                                ticket_id=ticket.ticket_id,
                                title=ticket.title,
                                text=ticket.text,
                                open_date=ticket.open_date,
                                user_id=ticket.user_id
)

    
    
    def get_tickets_by_user(self, user_id):
     with self.get_session() as session:
        statement = select(Ticket).where(Ticket.user_id == user_id)
        tickets = session.exec(statement).all()
        return tickets
     

    def create_message_reply(self, ticket_id, text, user_id=None, admin_id=None):
     with self.get_session() as session:
        ticket = session.get(Ticket, ticket_id)
        if not ticket:
            return False

        message = Message(
            ticket_id=ticket_id,
            messages_id=str(uuid4()),
            text=text,
            creation_date=datetime.utcnow(),
            user_id=user_id,
            admin_id=admin_id
        )
        session.add(message)
        session.commit()
        return True
    

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
