
from fastapi import APIRouter
from queries.stats_prestations_queries import StatsPrestationQuery

router = APIRouter()

@router.get("/service-count-by-type")
def service_count_by_type():
    query = StatsPrestationQuery()
    return query.get_service_count_by_type()

@router.get("/intervention-distribution")
def intervention_distribution():
    query = StatsPrestationQuery()
    return query.get_intervention_distribution()

@router.get("/service-price")
def service_price():
    query = StatsPrestationQuery()
    return query.get_service_price()

@router.get("/top5-prestations")
def top5_prestations():
    query = StatsPrestationQuery()
    return query.get_top_5_prestations() 