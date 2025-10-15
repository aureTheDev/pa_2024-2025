# queries/contractor_queries.py
from sqlmodel import Session
from models.database.contractors_model import ContractorTable
from models.database.users_model import UserTable
from fastapi import HTTPException
from uuid import UUID
from queries.user_queries import UserQuery
from sqlmodel import select, asc
from models.local.user import ContractorSchema
from service.logging import logging
from models.database.medical_appointments_model import MedicalAppointmentTable
from models.database.calendars_model import CalendarTable
from datetime import datetime, timezone, timedelta
from models.database.collaborators_model import CollaboratorTable


class ContractorQueries(UserQuery):
    def create_contractor(self, contractor_data: ContractorSchema) -> bool:
        with self.get_session() as session:
            new_contractor = ContractorTable(**contractor_data.dict(by_alias=True))
            session.add(new_contractor)

            session.commit()

            session.refresh(new_contractor)

        if new_contractor.contractor_id:
            return True
        else:
            return False

    def read_contractor_by_registration_number(self, registration_number: str) -> ContractorSchema:
        with self.get_session() as session:
            stmt = (
                select(ContractorTable, UserTable)
                .join(UserTable, ContractorTable.contractor_id == UserTable.user_id)
                .where(ContractorTable.registration_number == registration_number)
            )
            result = session.execute(stmt).one_or_none()

        if result is None:
            return False

        contractor, user = result
        combined_data = {**user.__dict__, **contractor.__dict__}
        return ContractorSchema(**combined_data)

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

    def read_medical_appointment(self, contractor_id: str, date_filter=None):
        with self.get_session() as session:
            stmt = select(MedicalAppointmentTable).where(
                MedicalAppointmentTable.contractor_id == contractor_id
            )
            if date_filter:
                stmt = stmt.where(MedicalAppointmentTable.medical_appointment_date >= date_filter)
            stmt = stmt.order_by(asc(MedicalAppointmentTable.medical_appointment_date))
            result = session.execute(stmt).scalars().all()
            return result

    def create_calendar(self, calendar: CalendarTable):
        with self.get_session() as session:
            session.add(calendar)
            session.commit()
            session.refresh(calendar)
            return calendar

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

    def read_contractor_by_id2(self, id: str):
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



    def read_appointment_by_appointment_date(self, uuid: str, date: datetime):
        with self.get_session() as session:
            stmt = select(MedicalAppointmentTable).where(MedicalAppointmentTable.contractor_id == uuid, MedicalAppointmentTable.medical_appointment_date == date)
            result = session.execute(stmt).scalar_one_or_none()
            return result

    def read_collaborator_by_id(self, id: str):
        with self.get_session() as session:
            stmt = select(UserTable).where(UserTable.user_id == id)
            result = session.execute(stmt).scalar_one_or_none()

        return result

    def read_contractor_calendar(self, contractor_id: str, date_filter=None):
        with self.get_session() as session:
            if date_filter is None:
                stmt = select(CalendarTable).where(CalendarTable.contractor_id == contractor_id)
            else:
                stmt = select(CalendarTable).where(CalendarTable.contractor_id == contractor_id, CalendarTable.unvailable_end_date > date_filter)

            results = session.execute(stmt).scalars().all()

            return results

    def delete_contractor_calendar(self, calendar_id: str):
        with self.get_session() as session:
            stmt = select(CalendarTable).where(CalendarTable.calendar_id == calendar_id)
            result = session.execute(stmt).scalar_one_or_none()

            if result is None:
                raise HTTPException(status_code=404, detail="Calendar not found")

            session.delete(result)
            session.commit()

    def read_one_calendar(self, calendar_id: str):
        with self.get_session() as session:
            stmt = select(CalendarTable).where(CalendarTable.calendar_id == calendar_id)
            result = session.execute(stmt).scalar_one_or_none()

            if result is None:
                raise HTTPException(status_code=404, detail="Calendar not found")

            return result


    def update_contractor_contract(self, contractor_id: str, file: str):
        with self.get_session() as session:
            stmt = select(ContractorTable).where(ContractorTable.contractor_id == contractor_id)
            result = session.execute(stmt).scalar_one_or_none()

            if result is None:
                raise HTTPException(status_code=404, detail="Contractor not found")

            result.contract_file = file
            session.commit()
            session.refresh(result)