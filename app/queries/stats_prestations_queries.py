from sqlmodel import select, or_
from collections import Counter
from queries.base_queries import BaseQuery

from models.database.contractors_model import ContractorTable
from models.database.appointments_model import AppointmentTable
from models.database.medical_appointments_model import MedicalAppointmentTable


class StatsPrestationQuery(BaseQuery):

    def get_service_count_by_type(self):
        with self.get_session() as session:
            stmt = select(ContractorTable.type)
            results = session.exec(stmt).all()
            return Counter(results)

    def get_intervention_distribution(self):
        with self.get_session() as session:
            stmt = select(ContractorTable.intervention)
            results = session.exec(stmt).all()
            return Counter(results)

    def get_service_price(self):
        with self.get_session() as session:
            stmt = select(ContractorTable.service, ContractorTable.service_price)
            results = session.exec(stmt).all()
            return {service: price for service, price in results}

    def get_top_5_prestations(self):
        with self.get_session() as session:
    
            stmt_appointments = select(AppointmentTable.contractor_id)
            stmt_medical = select(MedicalAppointmentTable.contractor_id)

            contractor_ids = session.exec(stmt_appointments).all()
            contractor_ids += session.exec(stmt_medical).all()

            stmt_services = select(ContractorTable.contractor_id, ContractorTable.service)
            contractor_services = session.exec(stmt_services).all()

            id_to_service = {cid: service for cid, service in contractor_services}

            counted_services = Counter(
                id_to_service[contractor_id]
                for contractor_id in contractor_ids
                if contractor_id in id_to_service
            )

            top5 = counted_services.most_common(5)
            return [{"service": name, "total": total} for name, total in top5]