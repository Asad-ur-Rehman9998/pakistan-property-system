"""What this database is allowed to hold."""

from __future__ import annotations

from django.db import models

FORBIDDEN_FIELD_TYPES = (models.FileField, models.ImageField, models.BinaryField)

FORBIDDEN_FIELD_NAMES = frozenset(
    {
        "share_key",
        "sharekey",
        "password",
        "pan",
        "cvv",
        "card_number",
        "full_cnic",
        "cnic",
        "photo",
        "photo_bytes",
        "image",
        "file",
        "document_blob",
        "pipeline_stage",
        "deal_value",
        "whatsapp_dump",
        "sms_body",
    }
)

ALLOWED_SECRETISH = frozenset(
    {
        "password_hash",
        "totp_secret",
        "share_token_hash",
        "on_device_photo_ref",
        "image_print",
        "phone_last4",
    }
)

NORMALIZED_TABLES = (
    "users",
    "profiles",
    "dealers",
    "customers",
    "properties",
    "property_locations",
    "property_documents",
    "document_extractions",
    "verification_requests",
    "property_checks",
    "risk_indicators",
    "property_comparisons",
    "property_listings",
    "leads",
    "appointments",
    "reports",
    "audit_logs",
    "plans",
    "subscriptions",
    "payments",
    "notifications",
)


def concrete_models():
    from checks import models as m

    return [
        m.User,
        m.Profile,
        m.Dealer,
        m.Customer,
        m.Property,
        m.PropertyLocation,
        m.PropertyDocument,
        m.DocumentExtraction,
        m.VerificationRequest,
        m.PropertyCheck,
        m.RiskIndicator,
        m.PropertyComparison,
        m.PropertyListing,
        m.Lead,
        m.Appointment,
        m.Report,
        m.AuditLog,
        m.Plan,
        m.Subscription,
        m.Payment,
        m.Notification,
    ]


def field_names(model) -> set[str]:
    return {f.name.lower() for f in model._meta.get_fields() if getattr(f, "name", None)}
