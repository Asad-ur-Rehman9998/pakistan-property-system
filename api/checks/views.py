import os

from rest_framework.response import Response
from rest_framework.views import APIView

from checks.models import SharedCheck
from checks.object_store import put_check_object
from checks.project import delete_normalized, ingest_shared_payload
from checks.schema_policy import NORMALIZED_TABLES
from checks.serializers import SharedCheckIdSerializer, SharedCheckWriteSerializer


def _first_error(errors) -> str:
    for value in errors.values():
        items = value if isinstance(value, list) else [value]
        for item in items:
            text = str(item)
            if text:
                return text
    return "invalid"


class HealthView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request):
        postgres = os.environ.get("DATABASE_URL", "").startswith("postgres")
        return Response(
            {
                "ok": True,
                "service": "propertycheck-api",
                "engine": "django-drf",
                "storage": "postgres" if postgres else "sqlite",
                "schema": "normalized-v1",
                "tables": list(NORMALIZED_TABLES),
                "papers_stored": False,
                "object_storage": bool(os.environ.get("AWS_STORAGE_BUCKET_NAME")),
                "llm": False,
                "official_live": False,
            }
        )


class CheckListView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request):
        data = dict(request.data)
        data.pop("shareKey", None)
        ser = SharedCheckWriteSerializer(data=data)
        if not ser.is_valid():
            msg = _first_error(ser.errors)
            if "papers_stay_on_phone" in msg:
                return Response({"error": "papers_stay_on_phone"}, status=400)
            if "too_long" in msg:
                return Response({"error": "too_long"}, status=400)
            return Response({"error": "invalid"}, status=400)
        check_id = ser.validated_data["id"]
        SharedCheck.objects.update_or_create(id=check_id, defaults={"payload": data})
        try:
            ingest_shared_payload(data)
        except Exception:
            if os.environ.get("DJANGO_DEBUG") == "1":
                raise
        put_check_object(check_id, data)
        return Response({"ok": True, "id": check_id, "papers": "not_stored"})


class CheckDetailView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request, check_id: str):
        id_ser = SharedCheckIdSerializer(data={"check_id": check_id})
        if not id_ser.is_valid():
            return Response({"error": "invalid"}, status=400)
        try:
            row = SharedCheck.objects.get(pk=check_id)
        except SharedCheck.DoesNotExist:
            return Response({"error": "not_found"}, status=404)
        return Response(row.payload)

    def delete(self, request, check_id: str):
        id_ser = SharedCheckIdSerializer(data={"check_id": check_id})
        if not id_ser.is_valid():
            return Response({"error": "invalid"}, status=400)
        SharedCheck.objects.filter(pk=check_id).delete()
        delete_normalized(check_id)
        return Response({"ok": True})
