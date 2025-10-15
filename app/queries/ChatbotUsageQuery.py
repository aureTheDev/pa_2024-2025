
# queries/chatbot_queries.py
from sqlmodel import select
from sqlalchemy import extract
from datetime import datetime
from models.database.chatbot_usage_model import ChatbotUsage
from models.database.collaborators_model import CollaboratorTable
from models.database.company_subscriptions_model import CompanySubscription
from models.database.packs_model import Pack
from models.database.companies_model import CompanyTable
from queries.base_queries import BaseQuery

class ChatbotQuery(BaseQuery):

    def get_message_limit(self, collaborator_id: str) -> int | None:
     with self.get_session() as session:
        print(f" Recherche de l’abonnement pour le collaborateur : {collaborator_id}")

       
        company_id = session.exec(
            select(CollaboratorTable.company_id)
            .where(CollaboratorTable.collaborator_id == collaborator_id)
        ).first()

        if not company_id:
            print(" Aucun collaborateur trouvé avec cet ID.")
            return None

        print(f" Company ID trouvé : {company_id}")

     
        sub = session.exec(
            select(CompanySubscription)
            .where(CompanySubscription.company_id == company_id)
            .where(CompanySubscription.status == "ACTIVE")
            .order_by(CompanySubscription.company_subscription_id.desc())
        ).first()

        if not sub:
            print(" Aucune subscription ACTIVE trouvée.")
            return None

        print(f" Subscription ID : {sub.company_subscription_id} | Pack ID : {sub.pack_id}")

     
        pack = session.exec(
            select(Pack)
            .where(Pack.pack_id == sub.pack_id)
        ).first()

        if not pack:
            print(" Aucun pack trouvé pour ce subscription.")
            return None

        print(f" Pack : {pack.name} | Messages chatbot autorisés : {pack.chatbot_messages_number}")

        return pack.chatbot_messages_number

    def get_usage_count_this_month(self, collaborator_id: str) -> int:
        now = datetime.utcnow()
        with self.get_session() as session:
            stmt = (
                select(ChatbotUsage)
                .where(ChatbotUsage.collaborator_id == collaborator_id)
                .where(extract("month", ChatbotUsage.used_at) == now.month)
                .where(extract("year", ChatbotUsage.used_at) == now.year)
            )
            return len(session.exec(stmt).all())

    def log_question(self, collaborator_id: str, message: str):
        with self.get_session() as session:
            usage = ChatbotUsage(collaborator_id=collaborator_id, message_text=message)
            session.add(usage)
            session.commit()
