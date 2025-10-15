# base_queries.py
import os
from sqlmodel import Session, create_engine, SQLModel

class BaseQuery:
    def __init__(self, engine=None):
        self.engine = engine or create_engine(os.environ.get("DATABASE_URL"))

    def get_session(self):
        return Session(self.engine)
