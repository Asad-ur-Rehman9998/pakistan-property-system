from django.urls import path

from checks.views import CheckDetailView, CheckListView, HealthView
from checks.billing import BillingPlansView
from intelligence.views import ClassifyView, ExplainView

urlpatterns = [
    path("v1/health/", HealthView.as_view()),
    path("v1/billing/plans/", BillingPlansView.as_view()),
    path("v1/checks/", CheckListView.as_view()),
    path("v1/checks/<str:check_id>/", CheckDetailView.as_view()),
    path("v1/ai/classify/", ClassifyView.as_view()),
    path("v1/ai/explain/", ExplainView.as_view()),
]
