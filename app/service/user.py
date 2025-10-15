import hashlib
import secrets
from datetime import datetime, timezone, timedelta
from typing import Optional
from uuid import UUID, uuid4
from fastapi import HTTPException
from fastapi.responses import Response
from pydantic import EmailStr
import os, jwt, requests
from urllib.parse import quote_plus
import random

from queries.user_queries import UserQuery
from models.api.sign_in import SignInRequest
from models.api.login import LoginRequest
from models.api.sign_in import SignInRequest
from models.local.token import TokenData
from models.local.user import UserSchema
from service.logging import logging



from email.mime.base import MIMEBase
from email import encoders
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import smtplib


logger = logging.getLogger(__name__)

class User:

    def __init__(self, query: UserQuery, token: Optional[str] = None):

        if token:
            if token and len(token.split('.')) == 3:
                self.query = query

                self.query.update_expired_token()

                self.token = token
                self.decrypt_token()

                if self.user_id is None or self.function is None or self.token_exp is None:
                    raise HTTPException(status_code=401, detail="Token is invalid")
                if self.token_exp < datetime.now(timezone.utc):
                    raise HTTPException(status_code=401, detail="Token is expired")

                res = self.query.read_user_by_id(self.user_id)
                if res is None:
                    raise HTTPException(status_code=401, detail="Token is invalid")

                self.email = res.email

            else:
                raise HTTPException(status_code=401, detail="Token is not a valid JWT")

        else:
            self.query = query

            self.user_id = None
            self.first_name = None
            self.last_name = None
            self.dob = None
            self.phone = None
            self.email = None
            self.role = None
            self.country = None
            self.city = None
            self.street = None
            self.pc = None
            self.verified = None
            self.inscription_date = None
            self.function = None
            self.password = None
            self.token_exp = None
            self.token_iat = None
            self.session_id = None
            self.token = None

    def login(self, login_data: LoginRequest):
        self.query.update_expired_token()

        req = self.query.read_user_by_email(login_data.email)

        if not req:
            raise HTTPException(status_code=401, detail="Wrong password or email")


        self.user_id = req.user_id
        self.password = req.password
        self.email = req.email
        self.verified = req.verified

        self.function = self.query.read_user_function(self.user_id)


        if self.function is None:
            raise HTTPException(status_code=401, detail="Wrong password or email")

        if not self.hash_password(login_data.password):
            raise HTTPException(status_code=401, detail="Wrong password or email")


        user_sessions = self.query.read_user_session_by_id(self.user_id)

        most_recent_session = None

        for session in user_sessions:
            if most_recent_session is None or session.creation_date > most_recent_session.creation_date:
                most_recent_session = session

        if most_recent_session:
            ten_minutes_ago = datetime.now(timezone.utc) - timedelta(seconds=10)
            if most_recent_session.creation_date.replace(tzinfo=timezone.utc) > ten_minutes_ago:
                raise HTTPException(
                    status_code=403,
                    detail="You cannot create a new session within 10 minutes of the last one."
                )

        self.session_id = secrets.token_hex(16)
        self.token_iat = datetime.now(timezone.utc)
        self.token_exp = self.token_iat + timedelta(days=15)

        res = self.query.create_user_session(self.user_id, self.session_id, self.token_exp, self.token_iat)
        if res is None:
            raise HTTPException(status_code=500, detail="Server error")

        self.create_access_token()
        if not self.token:
            raise HTTPException(status_code=500, detail="Server error")

    def logout(self):
        res = self.query.update_user_session_by_session_id(self.session_id)
        if res is False:
            raise HTTPException(status_code=500, detail="Server error")

    def create_access_token(self, secret_key=os.environ.get("SECRET_KEY")):
        payload = {
                    "user_id": self.user_id,
                    "function": self.function,
                    "session_id": self.session_id,
                    "exp": self.token_exp.timestamp(),
                    "iat": self.token_iat.timestamp(),
                    "verified": self.verified
                }
        encoded_jwt = jwt.encode(payload, secret_key, algorithm="HS512")
        self.token = encoded_jwt

    def hash_password(self, password):
        if self.password != hashlib.sha512(password.encode('utf-8')).hexdigest():
            return False
        return True

    def decrypt_token(self, secret_key=os.environ.get("SECRET_KEY")):

        if not self.token:
            raise HTTPException(status_code=500, detail="Server error")

        token = jwt.decode(self.token, secret_key, algorithms=["HS512"])

        try:
            token_data = TokenData(**token)
        except KeyError:
            raise HTTPException(status_code=401, detail="Token is invalid")

        self.user_id = token_data.user_id
        self.function = token_data.function
        self.token_exp = token_data.exp
        self.token_iat = token_data.iat
        self.session_id = token_data.session_id
        self.verified = token_data.verified

        res = self.query.read_user_session_by_session_id(self.session_id)
        if not res or not hasattr(res, "user_id"):
          raise HTTPException(status_code=401, detail="Token is invalid")

        if res.user_id != self.user_id:
            logger.warning("User id in token and in session don't match : %s %s", self.user_id, res.user_id)
            raise HTTPException(status_code=401, detail="Token is invalid")

        if res.revoked is True:
            raise HTTPException(status_code=401, detail="Token is revoked requset new token")

    def sign_in(self, sign_in_data: SignInRequest):

        existing_user_by_email = self.query.read_user_by_email(sign_in_data.email)
        existing_user_by_phone = self.query.read_user_by_phone(sign_in_data.phone)

        if existing_user_by_email or existing_user_by_phone:
            raise HTTPException(
                status_code=409,
                detail="An account with these informations already exists."
            )

        password = sign_in_data.password
        if len(password) < 6:
            raise HTTPException(
                status_code=422,
                detail="Password must be at least 6 characters long."
            )

        hashed_password = hashlib.sha512(password.encode('utf-8')).hexdigest()

        user_uuid = str(uuid4())

        new_user = UserSchema(
            user_id=user_uuid,
            firstname=sign_in_data.firstname,
            lastname=sign_in_data.lastname,
            dob=sign_in_data.dob,
            phone=sign_in_data.phone,
            email=sign_in_data.email,
            password=hashed_password,
            role=sign_in_data.role,
            country=sign_in_data.country,
            city=sign_in_data.city,
            street=sign_in_data.street,
            pc=sign_in_data.pc,
            verified=False,
            inscription_date = datetime.utcnow()
        )

        user_created = self.query.create_user(new_user)
        if not user_created or user_created is False:
            raise HTTPException(status_code=500, detail="User creation failed")

        return user_uuid


    def update_password(self, new_password: str):

        hashed_password = hashlib.sha512(new_password.encode('utf-8')).hexdigest()

        req = self.query.update_password_by_user_id(self.user_id, hashed_password)
        if req is False:
            raise HTTPException(status_code=500, detail="Server error")

        req = self.query.update_all_session_by_user_id(self.user_id)
        if req is False:
            raise HTTPException(status_code=500, detail="Server error")

        return Response(status_code=204)


    def verify(self, code: str):
        res = self.query.read_user_vrification_by_user_id(self.user_id)
        logging.info(res.code)
        logging.info(code)
        logging.info(f"Type de res.code: {type(res.code)}, Valeur: {res.code}")
        logging.info(f"Type de code du paramètre: {type(code)}, Valeur: {code}")
        logging.info(f"Avant strip - res.code: {repr(res.code)}, Longueur: {len(res.code)}")
        logging.info(f"Avant strip - code (param): {repr(code)}, Longueur: {len(code)}")

        if res.code != code:
            raise HTTPException(status_code=403, detail="Verification failed")
        if res.creation_date.replace(tzinfo=timezone.utc) < datetime.now(timezone.utc) - timedelta(days=1):
            raise HTTPException(status_code=403, detail="Verification code expired")

        res = self.query.update_verified_by_user_id(self.user_id)

        if res is False:
            raise HTTPException(status_code=500, detail="Server error")

        return True

    def create_verification_code(self):
        res1 = self.query.read_user_vrification_by_user_id(self.user_id)

        if not res1:
            code = str(random.randint(100000, 999999))
            res = self.query.create_verification_by_user_id(self.user_id, code)
            if res is False:
                raise HTTPException(status_code=500, detail="Server error")
            return code
        else:
            if res1.creation_date.replace(tzinfo=timezone.utc) > datetime.now(timezone.utc) - timedelta(minutes=1):
                raise HTTPException(status_code=403,
                                    detail="You cannot create a new verification code within 1 minute of the last one.")

            code = str(random.randint(100000, 999999))
            res = self.query.update_verification_by_user_id(self.user_id, code, datetime.now(timezone.utc))
            if res is False:
                raise HTTPException(status_code=500, detail="Server error")
            return code

    def send_email(self, subject: str, html: str, attachment_path: str = None):

        sender_email = f'noreply@{os.getenv("DOMAIN")}'

        recipient_email = self.email

        logging.info(
            f"Préparation de l'envoi d'e-mail via SMTP à {recipient_email} depuis {sender_email}")

        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = sender_email
        msg['To'] = recipient_email

        part_html = MIMEText(html, 'html', 'utf-8')
        msg.attach(part_html)

        if attachment_path is not None:
            try:
                with open(attachment_path, "rb") as file:
                    part = MIMEBase("application", "octet-stream")
                    part.set_payload(file.read())
                encoders.encode_base64(part)
                part.add_header("Content-Disposition", f"attachment; filename={os.path.basename(attachment_path)}")
                msg.attach(part)
            except Exception as e:
                logging.error(f"Erreur lors de l'attachement du fichier: {e}")
                raise HTTPException(status_code=500, detail="Erreur lors de l'attachement du fichier.")

        try:
            logging.debug("Connexion au serveur SMTP")
            with smtplib.SMTP('postfix', '25') as server:
                logging.debug("Tentative de démarrage de STARTTLS...")
                server.starttls()
                logging.debug("STARTTLS réussi.")
                logging.debug(f"Envoi de l'e-mail à {recipient_email}")
                server.sendmail(sender_email, recipient_email, msg.as_string())
                logging.info(f"E-mail envoyé avec succès à {recipient_email}")
                return True
        except smtplib.SMTPException as e:
            logging.error(f"Erreur SMTP lors de l'envoi de l'e-mail à {recipient_email}: {e}")
            raise HTTPException(status_code=500, detail="Server error")
        except Exception as e:
            logging.error(f"Erreur inattendue lors de l'envoi de l'e-mail : {e}")
            raise HTTPException(status_code=500, detail="Server error")

