# stats_queries.py
from .base_queries import BaseQuery
from sqlmodel import select, func
from models.database.companies_model import CompanyTable
from models.database.company_subscriptions_model import CompanySubscription
from models.database.estimates_model import Estimate
from models.database.packs_model import Pack
from collections import defaultdict, Counter
from datetime import datetime


class StatsQuery(BaseQuery):

    def get_top_clients_by_revenue(self):
        with self.get_session() as session:
            stmt = select(CompanyTable.name, CompanyTable.revenue).order_by(CompanyTable.revenue.desc()).limit(5)
            results = session.exec(stmt).all()
            return [{"name": name, "revenue": revenue} for name, revenue in results]

    def get_client_type_distribution(self):
        with self.get_session() as session:
            stmt = (
                select(Pack.name)
                .join(CompanySubscription, CompanySubscription.pack_id == Pack.pack_id)
            )
            results = session.exec(stmt).all()
            count = Counter(results)
            return {
                "Starter": count.get("Starter", 0),
                "Basic": count.get("Basic", 0),
                "Premium": count.get("Premium", 0)
            }

    def get_tariff_by_type(self):
        current_year = datetime.now().year
        with self.get_session() as session:
            stmt = (
                select(Pack.name, Estimate.amount)
                .join(CompanySubscription, CompanySubscription.pack_id == Pack.pack_id)
                .join(Estimate, Estimate.company_subscription_id == CompanySubscription.company_subscription_id)
                .where(func.extract("year", Estimate.creation_date) == current_year)
            )
            results = session.exec(stmt).all()

            data = defaultdict(list)
            for pack_name, amount in results:
                data[pack_name].append(amount)

            return {
                k: round(sum(v), 2) if v else 0
                for k, v in data.items()
            }

    def get_top_clients_pie(self):
        current_year = datetime.now().year
        with self.get_session() as session:
            stmt = (
                select(CompanyTable.name, Estimate.amount)
                .join(CompanySubscription, CompanySubscription.company_id == CompanyTable.company_id)
                .join(Estimate, Estimate.company_subscription_id == CompanySubscription.company_subscription_id)
                .where(func.extract("year", Estimate.creation_date) == current_year)
            )
            results = session.exec(stmt).all()

            total_by_client = defaultdict(float)
            for name, amount in results:
                total_by_client[name] += amount

            top_5 = sorted(total_by_client.items(), key=lambda x: x[1], reverse=True)[:5]
            return [{"name": name, "total": total} for name, total in top_5]