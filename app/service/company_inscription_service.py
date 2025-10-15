from uuid import uuid4 
from datetime import datetime
import hashlib
from fastapi import HTTPException 
from models.database.users_model import UserTable
from models.database.companies_model import CompanyTable
from models.local.company_creation import CompanyCreateLocal
from models.api.company_api import CompanyCreatedAPI
from queries.company_inscription_query import save_company_with_user
from queries.admin_queries import get_random_admin_id
from queries.company_queries import CompanyQuery
from models.api.login import LoginRequest
from queries.company_queries import CompanyQuery
from service.company import Company

def handle_company_inscription(payload: CompanyCreateLocal):
    user_id = str(uuid4())

    hashed_password = hashlib.sha512(payload.password.encode("utf-8")).hexdigest()

    user = UserTable(
        user_id=user_id,
        firstname=payload.firstname,
        lastname=payload.lastname,
        dob=payload.dob,
        phone=payload.phone,
        email=payload.email,
        password=hashed_password,
        role="company",
        country=payload.country,
        city=payload.city,
        street=payload.street,
        pc=payload.pc,
        inscription_date=datetime.utcnow(),
        verified=False,
    )

    with CompanyQuery().get_session() as session:
        existing_user = session.query(UserTable).filter_by(phone=user.phone).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Téléphone déjà utilisé")

   
        existing_email = session.query(UserTable).filter_by(email=user.email).first()
        if existing_email:
            raise HTTPException(status_code=400, detail="Email déjà utilisé")

  
    admin_id = get_random_admin_id()

    company = CompanyTable(
        company_id=user_id,
        name=payload.name,
        website=payload.website,
        registration_number=payload.registration_number,
        registration_date=payload.registration_date,
        industry=payload.industry,
        revenue=payload.revenue,
        size=payload.size,
        admin_id=admin_id
    )

   
    save_company_with_user(user, company)

    company_query = CompanyQuery()
    company = Company(company_query, None)

    login_param = LoginRequest(email=payload.email, password=payload.password)
    company.login(login_param)

    return {"token": company.token, "company_id": company.user_id}
