from queries.ticket_queries import TicketQuery

class TicketService:
    def __init__(self, query: TicketQuery):
        self.query = query

    def create_ticket_with_message(self, title, text, user_id):
        return self.query.create_ticket_with_message(title, text, user_id)
    
    def get_tickets_by_user(self, user_id):
        return self.query.get_tickets_by_user(user_id)
    
    def reply_to_ticket(self, ticket_id, text, user_id):
     return self.query.create_message_reply(ticket_id, text, user_id=user_id)

    def get_ticket_with_messages(self, ticket_id: str):
     return self.query.get_ticket_with_messages(ticket_id)
