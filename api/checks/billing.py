from rest_framework.response import Response
from rest_framework.views import APIView

from checks.models import Plan


class BillingPlansView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request):
        rows = Plan.objects.filter(active=True).order_by("code")
        return Response(
            {
                "processor": False,
                "plans": [
                    {
                        "id": p.code,
                        "audience": p.audience,
                        "interval": p.interval,
                        "entitlements": p.entitlements,
                        "currency": p.currency,
                        "amountText": p.amount_text or None,
                    }
                    for p in rows
                ],
            }
        )
