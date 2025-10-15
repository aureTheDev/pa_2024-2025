from datetime import datetime, timezone

from sqlmodel import select, asc
from pydantic import EmailStr
from .base_queries import BaseQuery
from models.database.users_model import UserTable
from models.database.companies_model import CompanyTable
from models.database.contractors_model import ContractorTable
from models.database.collaborators_model import CollaboratorTable
from models.database.administrators_model import AdministratorTable
from models.database.sessions_model import SessionTable
from models.local.user import UserSchema
from models.local.session import SessionSchema
from models.local.user import UserUpdateSchema
from service.logging import logging
from fastapi import HTTPException
from models.database.verifications_model import VerificationTable

logger = logging.getLogger(__name__)


# to_print = stmt.compile(compile_kwargs={"literal_binds": True})  -> print la requete
# logger.debug(f"Query : {to_print}")

class UserQuery(BaseQuery):

    def read_user_by_email(self, email: EmailStr) -> UserSchema:
     with self.get_session() as session:
        stmt = select(UserTable).where(UserTable.email == email)
        result = session.execute(stmt)
        user = result.scalar_one_or_none()

     if user is None:
        return False

     print(" From DB: email =", user.email, "| verified =", user.verified) 

     schema = UserSchema.from_orm(user)
     print(" From Schema:", schema.email, "| verified =", schema.verified)  

     return schema


    def read_user_by_id(self, uuid: str) -> UserSchema:
        with self.get_session() as session:
            stmt = select(UserTable).where(UserTable.user_id == uuid)
            result = session.execute(stmt)
            user = result.scalar_one_or_none()

        if user is None:
            return False

        return UserSchema.from_orm(user)

    def read_user_session_by_id(self, uuid: str) -> list[SessionSchema]:
        with self.get_session() as session:
            stmt = (
                select(SessionTable)
                .where(SessionTable.user_id == uuid)
            )
            user_sessions = session.execute(stmt).scalars().all()

        if user_sessions is None:
            return False

        return [SessionSchema.from_orm(user_session) for user_session in user_sessions]

    def read_user_session_by_session_id(self, session_id: str) -> SessionSchema:
        with self.get_session() as session:
            stmt = (
                select(SessionTable)
                .where(SessionTable.session_id == session_id)
            )
            user_session = session.execute(stmt).scalar_one_or_none()
            if user_session is None:
                return False
            return SessionSchema.from_orm(user_session)

    def create_user_session(self, uuid: str, session_id: str, exp_date: datetime, token_iat: datetime):
        with self.get_session() as session:
            new_session = SessionTable(user_id=uuid, session_id=session_id, exp_date=exp_date, creation_date=token_iat)
            session.add(new_session)
            session.commit()
            session.refresh(new_session)
            return new_session

    def read_user_function(self, uuid: str):
        with self.get_session() as session:

            stmt = select(CollaboratorTable).where(CollaboratorTable.collaborator_id == uuid)
            collaborator = session.execute(stmt).scalar_one_or_none()
            if collaborator:
                return "collaborator"

            stmt = select(CompanyTable).where(CompanyTable.company_id == uuid)
            company = session.execute(stmt).scalar_one_or_none()
            if company:
                return "company"

            stmt = select(ContractorTable).where(ContractorTable.contractor_id == uuid)
            contractor = session.execute(stmt).scalar_one_or_none()
            if contractor:
                return "contractor"

            stmt = select(AdministratorTable).where(AdministratorTable.admin_id == uuid)
            admin = session.execute(stmt).scalar_one_or_none()
            if admin:
                return "administrator"

            logger.warning("No function found for user with id : %s", uuid)

    def update_expired_token(self):
        with self.get_session() as session:
            stmt = select(SessionTable).where(SessionTable.exp_date < datetime.now())
            user_sessions = session.execute(stmt).scalars().all()
            for user_session in user_sessions:
                user_session.revoked = True
                session.add(user_session)
                session.commit()

    def update_user_session_by_session_id(self, session_id: str) -> bool:
        with self.get_session() as session:
            stmt = select(SessionTable).where(SessionTable.session_id == session_id)
            res = session.execute(stmt).scalar_one_or_none()
            if res and res.revoked is False:
                res.revoked = True
                session.add(res)
                session.commit()
                return True
            return False
        

    def update_user_by_id(self, user_id: str, data: UserUpdateSchema):
       with self.get_session() as session:
          db_obj = session.get(UserTable, user_id)
          if db_obj is None:
              raise HTTPException(status_code=404, detail="Utilisateur non trouvé")

          for field, value in data.model_dump().items():
              setattr(db_obj, field, value)

          session.commit()
          session.refresh(db_obj)
          return UserSchema.model_validate(db_obj)
          return False

    def create_user(self, new_user: UserSchema) -> bool:
        with self.get_session() as session:
            new_user_db = UserTable(**new_user.dict())
            session.add(new_user_db)
            session.commit()
            session.refresh(new_user_db)
            if new_user_db.user_id:
                return True
            else:
                return False

    def read_user_by_phone(self, phone_number: str) -> UserSchema:
        if len(phone_number) > 15:
            logger.warning("Phone number too long: %s", phone_number)
            return False

        with self.get_session() as session:
            stmt = select(UserTable).where(UserTable.phone == phone_number)
            result = session.execute(stmt)
            user = result.scalar_one_or_none()

        if user is None:
            return False
        
        return UserSchema.from_orm(user)


    def update_password_by_user_id(self, uuid: str, new_password: str) -> bool:
        with self.get_session() as session:
            stmt = select(UserTable).where(UserTable.user_id == uuid)
            result = session.execute(stmt)
            user = result.scalar_one_or_none()

        if user is None:
            return False

        user.password = new_password
        with self.get_session() as session:
            session.add(user)
            session.commit()
            session.refresh(user)

        return True

    def update_all_session_by_user_id(self, uuid: str) -> bool:
        with self.get_session() as session:
            stmt = select(SessionTable).where(SessionTable.user_id == uuid)
            result = session.execute(stmt)
            ses = result.scalars().all()

        if not ses:
            return False

        for se in ses:
            se.revoked = True
            with self.get_session() as session:
                session.add(se)
                session.commit()
                session.refresh(se)

        return True

    def update_verified_by_user_id(self, uuid: str) -> bool:
        with self.get_session() as session:
            stmt = select(UserTable).where(UserTable.user_id == uuid)
            result = session.execute(stmt)
            user = result.scalar_one_or_none()

            if user is None:
                return False

            user.verified = True
            session.commit()
        return True

    def read_user_vrification_by_user_id(self, uuid: str):
        with self.get_session() as session:
            stmt = select(VerificationTable).where(VerificationTable.user_id == uuid)
            result = session.execute(stmt)
            verif = result.scalar_one_or_none()

        if verif is None:
            return False

        return verif

    def create_verification_by_user_id(self, uuid: str, code: str):
        with self.get_session() as session:
            new_verification = VerificationTable(user_id=uuid, code=code)
            session.add(new_verification)
            session.commit()
            session.refresh(new_verification)
            return True

    def update_verification_by_user_id(self, uuid: str, code: str, date: datetime):
        with self.get_session() as session:
            stmt = select(VerificationTable).where(VerificationTable.user_id == uuid)
            result = session.execute(stmt)
            verif = result.scalar_one_or_none()

            if verif is None:
                return False

            verif.code = code
            verif.creation_date = date
            session.commit()
        return True


    def update_user_2_by_id(self, uuid: str, **kwargs):
        with self.get_session() as session:
            stmt = select(UserTable).where(UserTable.user_id == uuid)
            result = session.execute(stmt)
            contractor = result.scalar_one_or_none()

            if contractor is None:
                return False

            for key, value in kwargs.items():
                if hasattr(contractor, key):
                    setattr(contractor, key, value)
                else:
                    logging.info('invalid param key')

            session.commit()
        return True
