from fastapi import APIRouter
from queries.stats_queries import StatsQuery

router = APIRouter()

@router.get("/top-clients")
def top_clients():
    query = StatsQuery()
    return query.get_top_clients_by_revenue()


@router.get("/client-type-distribution")
def client_type_distribution():
    query = StatsQuery()
    return query.get_client_type_distribution()


@router.get("/tariff-by-type")
def tariff_by_type():
    query = StatsQuery()
    return query.get_tariff_by_type()


@router.get("/top-clients-pie")
def top_clients_pie():
    query = StatsQuery()
    return query.get_top_clients_pie()