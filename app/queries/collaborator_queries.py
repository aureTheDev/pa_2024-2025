from sqlmodel import select
from .user_queries import UserQuery
from models.database.users_model import UserTable
from models.database.companies_model import CompanyTable
from models.database.collaborators_model import CollaboratorTable
from models.local.user import CollaboratorSchema, ContractorSchema
from service.logging import logging
from sqlalchemy import delete
from models.database.contractors_model import ContractorTable
from models.database.medical_appointments_model import MedicalAppointmentTable
from models.database.calendars_model import CalendarTable
from datetime import datetime, date, timezone
from models.database.ngo_model import Ngo
from models.database.events_model import Event
from models.database.booked_events_model import BookedEvent
from sqlmodel import Session
from models.database.donations_model import Donation
from models.database.packs_model import Pack
from models.database.company_subscriptions_model import CompanySubscription
from models.database.bills_model import BillTable

logger = logging.getLogger(__name__)


# to_print = stmt.compile(compile_kwargs={"literal_binds": True}) print la requete
# logger.debug(f"Query : {to_print}")

class CollaboratorQuery(UserQuery):
    def __init__(self):
        super().__init__()

    def read_collaborator_by_id(self, uuid: str):
        with self.get_session() as session:
            stmt = (select(CollaboratorTable, UserTable).join(UserTable, CollaboratorTable.collaborator_id == UserTable.user_id).where(
                CollaboratorTable.collaborator_id == uuid))
            result = session.execute(stmt).one_or_none()

            collaborator, user = result
            data = {**user.__dict__, **collaborator.__dict__}
            return CollaboratorSchema.from_orm(data)

    def read_medical_contractor(self):
        with self.get_session() as session:
            stmt = (
                select(ContractorTable, UserTable).join(UserTable, ContractorTable.contractor_id == UserTable.user_id).where(
                    ContractorTable.type == 'Medical')
            )
            results = session.execute(stmt).all()

        if results is None:
            return False

        return [ContractorSchema.from_orm({**user.__dict__, **contractor.__dict__}) for contractor, user in results]

    def read_contractor_appointment_by_contractor_id(self, contractor_id: str):
        with self.get_session() as session:
            stmt = select(MedicalAppointmentTable).where(MedicalAppointmentTable.contractor_id == contractor_id, MedicalAppointmentTable.medical_appointment_date > datetime.now(timezone.utc), MedicalAppointmentTable.status != 'CANCELED')
            result = session.execute(stmt).scalars().all()

            if result is None:
                return False

            return [MedicalAppointmentTable.from_orm(appointment) for appointment in result]

    def read_contractor_calendar_by_contractor_id(self, contractor_id: str):
        with self.get_session() as session:
            stmt = select(CalendarTable).where(CalendarTable.contractor_id == contractor_id, CalendarTable.unvailable_begin_date > datetime.now(timezone.utc))
            results = session.execute(stmt).scalars().all()
            if results is None:
                return False

            return [CalendarTable.from_orm(calendar) for calendar in results]

    def read_contractor_by_id(self, contractor_id: str) -> ContractorSchema:
        with self.get_session() as session:
            stmt = (
                select(ContractorTable, UserTable)
                .join(UserTable, ContractorTable.contractor_id == UserTable.user_id)
                .where(ContractorTable.contractor_id == contractor_id)
            )
            result = session.execute(stmt).one_or_none()
            if result is None:
                return False

            contractor, user = result
            combined_data = {**user.__dict__, **contractor.__dict__}
            return ContractorSchema.from_orm(combined_data)

    def create_medical_appointment(self, appointment: MedicalAppointmentTable) -> MedicalAppointmentTable:
        with self.get_session() as session:
            session.add(appointment)
            session.commit()
            session.refresh(appointment)
            return appointment

    def read_medical_appointment(self, uuid, filter_date=None):
        with self.get_session() as session:
            stmt = select(MedicalAppointmentTable).where(MedicalAppointmentTable.collaborator_id == uuid)
            if filter_date:
                stmt = stmt.where(MedicalAppointmentTable.medical_appointment_date >= filter_date)
            results = session.execute(stmt).scalars().all()
            return results

    def read_contractor_by_id(self, id: str):
        with self.get_session() as session:
            stmt = (
                select(ContractorTable, UserTable)
                .join(UserTable, ContractorTable.contractor_id == UserTable.user_id)
                .where(ContractorTable.contractor_id == id)
            )
            result = session.execute(stmt).one_or_none()

        if result is None:
            return False

        contractor, user = result
        combined_data = {**user.__dict__, **contractor.__dict__}
        return ContractorSchema(**combined_data)

    def read_medical_appointment_by_appointment_id(self, uuid: str):
        with self.get_session() as session:
            logger.info(f"UUID : {uuid}")
            stmt = select(MedicalAppointmentTable).where(MedicalAppointmentTable.medical_appointment_id == uuid)
            result = session.execute(stmt).scalar_one_or_none()
            return result

    def update_medical_appointment_by_appointment_id(self, appointment_id: str, data: dict):
        with self.get_session() as session:
            stmt = select(MedicalAppointmentTable).where(
                MedicalAppointmentTable.medical_appointment_id == appointment_id)
            appointment = session.execute(stmt).scalar_one_or_none()

            if appointment is None:
                return appointment

            for key, value in data.items():
                setattr(appointment, key, value)

            session.add(appointment)
            session.commit()
            session.refresh(appointment)
            return appointment

    def get_all_ngos(self):
        with self.get_session() as session:
            statement = select(
                Ngo.ngo_id,
                Ngo.name,
                Ngo.registration_date,
                Ngo.address,
                Ngo.country,
                Ngo.type,
                Ngo.presentation,
                Ngo.website,
                Ngo.phone
            )
            return session.exec(statement).all()

    def get_events_by_ngo(self, ngo_id: str):
        with self.get_session() as session:
            statement = select(Event).where(Event.ngo_id == ngo_id)
            return session.exec(statement).all()

    def get_booked_events_by_collaborator(self, collaborator_id: str):
        with self.get_session() as session:
            stmt = select(BookedEvent.event_id).where(BookedEvent.collaborator_id == collaborator_id)
            return [row[0] for row in session.exec(stmt).all()]

    def is_event_full(self, event_id: str):
        with self.get_session() as session:
            from models.database.events_model import Event

            event = session.get(Event, event_id)
            if not event:
                return True

            stmt = select(BookedEvent).where(BookedEvent.event_id == event_id)
            count = len(session.exec(stmt).all())
            return count >= event.capacity

    def join_event(self, event_id: str, collaborator_id: str):
        with self.get_session() as session:
            booked = BookedEvent(event_id=event_id, collaborator_id=collaborator_id)
            session.add(booked)
            session.commit()
            return booked

    def leave_event(self, event_id: str, collaborator_id: str):
        with self.get_session() as session:
            stmt = delete(BookedEvent).where(
                BookedEvent.event_id == event_id,
                BookedEvent.collaborator_id == collaborator_id
            )
            session.execute(stmt)
            session.commit()

    def create_donation(self, session, donation: Donation):
        session.add(donation)
        session.commit()
        session.refresh(donation)
        return donation


    def read_company_subscription_by_id(self, company_subscription_id: str):
        with self.get_session() as session:
            subscription_stmt = select(CompanySubscription).where(CompanySubscription.company_subscription_id == company_subscription_id)
            result = session.execute(subscription_stmt).scalars().first()
            return result

    def read_packs_by_id(self, uuid: str):
        with self.get_session() as session:
            stmt = select(Pack).where(Pack.pack_id == uuid)
            result = session.execute(stmt).scalar_one_or_none()
            return result

    def read_company_bill_by_company_id_and_subscription_id(self, company_id: str):
        with self.get_session() as session:
            stmt = select(BillTable).where(BillTable.company_id == company_id).order_by(BillTable.payed_date.desc())
            result = session.execute(stmt).scalar_one_or_none()

            return result