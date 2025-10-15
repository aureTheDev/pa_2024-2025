from models.database.users_model import UserTable
from models.database.companies_model import CompanyTable
from queries.company_queries import CompanyQuery 

def save_company_with_user(user: UserTable, company: CompanyTable):
    query = CompanyQuery()
    with query.get_session() as session:
        try:
            session.add(user)
            session.flush()
            session.add(company)
            session.commit()

         
            session.refresh(user)
            session.refresh(company)
        except Exception as e:
            session.rollback()
            raise e
