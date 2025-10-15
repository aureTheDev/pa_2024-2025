import logging
import os
from pyexpat.errors import messages

from fastapi import HTTPException
from pydantic import constr
from fastapi import APIRouter, status, Header
from queries.company_queries import CompanyQuery
from queries.user_queries import UserQuery
from service.user import User
from models.api.login import LoginRequest, LoginResponse
from models.api.sign_in import SignInRequest, VerifRequest

router = APIRouter()

@router.post("/login", response_model=LoginResponse)
def login(login_data: LoginRequest):
    user_queries = UserQuery()
    user = User(user_queries, None)
    user.login(login_data)


    return {"token": user.token}

@router.post("/logout")
def logout(token: str = Header("token")):
    user_queries = UserQuery()
    user = User(user_queries, token)
    user.logout()
    return {"message": "Successfully logged out"}


@router.post("/signin", status_code=status.HTTP_201_CREATED)
def sign_in(sign_in_data: SignInRequest):
    user_queries = UserQuery()
    user = User(user_queries, None)

    user_id = user.sign_in(sign_in_data)

    return {
        "message": "User created successfully",
        "user_id": f"{user_id}"
    }


@router.post("/send_verif_email")
def send_verification_email(token: str = Header("token")):
    user_queries = UserQuery()
    user = User(user_queries, token)

    if user.verified:
        raise HTTPException(status_code=400, detail="User already verified")

    code = user.create_verification_code()

    subject = "Verification Code"

    message = f"Your verification code is: {code}"


    if user.send_email(subject, message):
        return {"message": "Verification email sent successfully"}
    else:
        raise HTTPException(status_code=500, detail="Server Error: Failed to send verification email")


@router.post("/verify")
def verify(request: VerifRequest, token: str = Header("token")):
    user_queries = UserQuery()
    user = User(user_queries, token)

    if user.verified:
        raise HTTPException(status_code=400, detail="User already verified")

    if user.verify(request.code):
        user.logout()
        return {"message": "User verified successfully"}
    else:
        raise HTTPException(status_code=403, detail="Verification failed")


