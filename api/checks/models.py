"""Normalized PostgreSQL models for PropertyCheck Pakistan.

This is due-diligence storage, not a listing catalog or sales CRM.
Paper photos never have a column. CNIC is last-4 only. Share keys are hashed.
"""

from __future__ import annotations

import uuid

from django.core.validators import MaxLengthValidator, RegexValidator
from django.db import models

last4 = RegexValidator(r"^$|^\d{4}$", "Last four digits only.")


def extraction_cnic_last4_only(field_key: str, value: str) -> str:
    """Never persist a full CNIC. Last-4 only; other keys keep stripped text."""
    raw = value or ""
    if field_key != "cnicLast4":
        return raw[:200]
    digits = "".join(c for c in raw if c.isdigit())
    if len(digits) > 4:
        raise ValueError("cnic_last4_only")
    return digits


class Role(models.TextChoices):
    MEMBER = "member"
    PROFESSIONAL = "professional"
    STAFF = "staff"


class Lang(models.TextChoices):
    EN = "en"
    UR = "ur"
    ROMAN = "roman"


class Settlement(models.TextChoices):
    URBAN = "urban"
    RURAL = "rural"


class PropertyKind(models.TextChoices):
    HOUSE = "house"
    PLOT = "plot"
    FLAT = "flat"
    SHOP = "shop"
    AGRI = "agri"
    INDUSTRIAL = "industrial"
    FILE = "file"


class Intent(models.TextChoices):
    BUY = "buy"
    SELL = "sell"
    RENT = "rent"
    TOKEN = "token"


class EvidenceSource(models.TextChoices):
    VERIFIED = "verified"
    USER_PROVIDED = "user_provided"
    SYSTEM_DETECTED = "system_detected"
    NEEDS_VERIFICATION = "needs_verification"
    UNKNOWN = "unknown"


class UuidModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    class Meta:
        abstract = True


class User(UuidModel):
    """Optional account. Guests have no row. Password is a hash only."""

    email = models.EmailField(unique=True)
    password_hash = models.TextField()
    role = models.CharField(max_length=20, choices=Role.choices)
    totp_enabled = models.BooleanField(default=False)
    totp_secret = models.CharField(max_length=64, blank=True, default="")
    grants = models.JSONField(default=list, blank=True)
    disabled = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "users"
        indexes = [
            models.Index(fields=["role"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["disabled", "role"]),
        ]

    def save(self, *args, **kwargs):
        self.email = (self.email or "").strip().lower()
        super().save(*args, **kwargs)


class Profile(UuidModel):
    """Display prefs only — no CNIC, home address, or bank details."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")
    display_name = models.CharField(max_length=80, blank=True, default="")
    lang = models.CharField(max_length=8, choices=Lang.choices, default=Lang.ROMAN)
    settlement = models.CharField(max_length=8, choices=Settlement.choices, blank=True, default="")
    large_text = models.BooleanField(default=False)
    reduce_motion = models.BooleanField(default=False)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "profiles"


class Dealer(UuidModel):
    """Professional who keeps information pages — not a marketplace seller."""

    user = models.OneToOneField(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="dealer"
    )
    display_name = models.CharField(max_length=80, blank=True, default="")
    city = models.CharField(max_length=80, blank=True, default="")
    area = models.CharField(max_length=80, blank=True, default="")
    note = models.CharField(max_length=500, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "dealers"
        indexes = [models.Index(fields=["city"]), models.Index(fields=["created_at"])]


class Customer(UuidModel):
    """Person a dealer is helping understand a property. Not a CRM contact."""

    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, related_name="customers")
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="customer_rows"
    )
    display_name = models.CharField(max_length=80)
    role = models.CharField(max_length=16, default="other")
    phone_last4 = models.CharField(max_length=4, blank=True, default="", validators=[last4])
    note = models.CharField(max_length=240, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "customers"
        indexes = [models.Index(fields=["dealer", "created_at"])]


class Property(UuidModel):
    """Subject of a check. Not a public listing."""

    kind = models.CharField(max_length=16, choices=PropertyKind.choices, blank=True, default="")
    settlement = models.CharField(max_length=8, choices=Settlement.choices, blank=True, default="")
    is_society_file = models.BooleanField(null=True, blank=True)
    plot_number = models.CharField(max_length=64, blank=True, default="")
    khasra_number = models.CharField(max_length=64, blank=True, default="")
    khewat = models.CharField(max_length=64, blank=True, default="")
    khatooni = models.CharField(max_length=64, blank=True, default="")
    mouza = models.CharField(max_length=80, blank=True, default="")
    society_name = models.CharField(max_length=120, blank=True, default="")
    developer_name = models.CharField(max_length=120, blank=True, default="")
    area_size = models.CharField(max_length=32, blank=True, default="")
    area_unit = models.CharField(max_length=8, blank=True, default="")
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="properties"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "properties"
        indexes = [
            models.Index(fields=["plot_number"]),
            models.Index(fields=["khasra_number"]),
            models.Index(fields=["society_name"]),
            models.Index(fields=["kind", "created_at"]),
        ]


class PropertyLocation(UuidModel):
    """Place labels the user typed. Not a tracked GPS trail."""

    property = models.OneToOneField(Property, on_delete=models.CASCADE, related_name="location")
    province = models.CharField(max_length=24, blank=True, default="")
    city = models.CharField(max_length=80, blank=True, default="")
    district = models.CharField(max_length=80, blank=True, default="")
    tehsil = models.CharField(max_length=80, blank=True, default="")
    village = models.CharField(max_length=80, blank=True, default="")
    area = models.CharField(max_length=80, blank=True, default="")
    location_label = models.CharField(max_length=160, blank=True, default="")
    location_method = models.CharField(max_length=16, blank=True, default="")
    lat = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    lng = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    class Meta:
        db_table = "property_locations"
        indexes = [
            models.Index(fields=["city", "area"]),
            models.Index(fields=["province", "city"]),
            models.Index(fields=["village"]),
        ]


class PropertyCheck(UuidModel):
    """One due-diligence pass. Guest shares have user=null."""

    public_id = models.CharField(max_length=32, unique=True)
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="checks"
    )
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="checks")
    intent = models.CharField(max_length=8, choices=Intent.choices, blank=True, default="")
    found_via = models.CharField(max_length=24, blank=True, default="")
    counterparty = models.CharField(max_length=16, blank=True, default="")
    asking_price_text = models.CharField(max_length=40, blank=True, default="")
    asking_price_source = models.CharField(
        max_length=24, choices=EvidenceSource.choices, default=EvidenceSource.USER_PROVIDED
    )
    token_amount_text = models.CharField(max_length=40, blank=True, default="")
    notes = models.TextField(blank=True, default="", validators=[MaxLengthValidator(4000)])
    share_token_hash = models.CharField(max_length=64, blank=True, default="")
    created_at = models.DateTimeField()

    class Meta:
        db_table = "property_checks"
        indexes = [
            models.Index(fields=["user", "created_at"]),
            models.Index(fields=["property"]),
            models.Index(fields=["created_at"]),
            models.Index(fields=["intent"]),
            models.Index(fields=["share_token_hash"]),
        ]


class PropertyDocument(UuidModel):
    """Paper metadata only. No file, no bytes, no public URL."""

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="documents")
    property_check = models.ForeignKey(
        PropertyCheck, on_delete=models.CASCADE, null=True, blank=True, related_name="documents"
    )
    kind = models.CharField(max_length=24)
    state = models.CharField(max_length=12, default="unsure")
    on_device_photo_ref = models.CharField(max_length=80, blank=True, default="")
    image_print = models.CharField(max_length=16, blank=True, default="")
    encrypted_on_device = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "property_documents"
        indexes = [
            models.Index(fields=["property", "kind"]),
            models.Index(fields=["property_check"]),
            models.Index(fields=["image_print"]),
        ]


class DocumentExtraction(UuidModel):
    """On-device OCR fields. CNIC last-4 only. No raw document dump."""

    document = models.ForeignKey(
        PropertyDocument, on_delete=models.CASCADE, related_name="extractions"
    )
    field_key = models.CharField(max_length=32)
    value = models.CharField(max_length=200)
    sensitive = models.BooleanField(default=False)
    confirmed = models.BooleanField(null=True, blank=True)
    source = models.CharField(
        max_length=24, choices=EvidenceSource.choices, default=EvidenceSource.SYSTEM_DETECTED
    )

    class Meta:
        db_table = "document_extractions"
        indexes = [
            models.Index(fields=["document", "field_key"]),
            models.Index(fields=["field_key"]),
        ]

    def save(self, *args, **kwargs):
        self.value = extraction_cnic_last4_only(self.field_key, self.value)
        super().save(*args, **kwargs)


class VerificationRequest(UuidModel):
    """Ask an office or professional. Never auto-marks legally Verified."""

    property = models.ForeignKey(
        Property, on_delete=models.CASCADE, related_name="verification_requests"
    )
    property_check = models.ForeignKey(
        PropertyCheck, on_delete=models.CASCADE, null=True, blank=True, related_name="verification_requests"
    )
    requested_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="verification_requests"
    )
    what = models.CharField(max_length=400)
    office_hint = models.CharField(max_length=240, blank=True, default="")
    status = models.CharField(max_length=12, default="open")
    official_source_confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "verification_requests"
        indexes = [
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["property"]),
            models.Index(fields=["property_check"]),
        ]


class Report(UuidModel):
    """Decision-support sheet for one check. Not a legal certificate."""

    property_check = models.OneToOneField(PropertyCheck, on_delete=models.CASCADE, related_name="report")
    verdict = models.CharField(max_length=8)
    score = models.SmallIntegerField(default=0)
    info_status = models.CharField(max_length=16, default="insufficient")
    engine = models.CharField(max_length=12, default="rules")
    has_official_verification = models.BooleanField(default=False)
    provenance_verified = models.PositiveSmallIntegerField(default=0)
    provenance_user_provided = models.PositiveSmallIntegerField(default=0)
    provenance_system_detected = models.PositiveSmallIntegerField(default=0)
    provenance_needs_verification = models.PositiveSmallIntegerField(default=0)
    provenance_unknown = models.PositiveSmallIntegerField(default=0)
    headline = models.JSONField(default=dict)
    summary = models.JSONField(default=dict)
    created_at = models.DateTimeField()

    class Meta:
        db_table = "reports"
        indexes = [
            models.Index(fields=["verdict", "created_at"]),
            models.Index(fields=["info_status"]),
            models.Index(fields=["has_official_verification"]),
        ]


class RiskIndicator(UuidModel):
    """Rule-engine attention item. Never a fraud verdict."""

    property_check = models.ForeignKey(PropertyCheck, on_delete=models.CASCADE, related_name="risks")
    report = models.ForeignKey(
        Report, on_delete=models.CASCADE, null=True, blank=True, related_name="risks"
    )
    code = models.CharField(max_length=48)
    lane = models.CharField(max_length=32)
    attention = models.CharField(max_length=8)
    source = models.CharField(
        max_length=24, choices=EvidenceSource.choices, default=EvidenceSource.SYSTEM_DETECTED
    )
    title = models.JSONField(default=dict)
    why = models.JSONField(default=dict)

    class Meta:
        db_table = "risk_indicators"
        indexes = [
            models.Index(fields=["property_check", "attention"]),
            models.Index(fields=["lane"]),
            models.Index(fields=["code"]),
        ]


class PropertyComparison(UuidModel):
    """Possible similar check or advert. Not an accusation."""

    property_check = models.ForeignKey(PropertyCheck, on_delete=models.CASCADE, related_name="comparisons")
    other_check = models.ForeignKey(
        PropertyCheck,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="compared_from",
    )
    score = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    signals = models.JSONField(default=list)
    label = models.JSONField(default=dict)

    class Meta:
        db_table = "property_comparisons"
        indexes = [
            models.Index(fields=["property_check", "score"]),
            models.Index(fields=["other_check"]),
        ]


class PropertyListing(UuidModel):
    """How the property was found, or a dealer information page.

    Not a published marketplace listing. is_public stays false.
    """

    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name="listings")
    dealer = models.ForeignKey(
        Dealer, on_delete=models.SET_NULL, null=True, blank=True, related_name="pages"
    )
    property_check = models.ForeignKey(
        PropertyCheck, on_delete=models.CASCADE, null=True, blank=True, related_name="listings"
    )
    kind = models.CharField(max_length=16, default="source_card")
    found_via = models.CharField(max_length=24, blank=True, default="")
    source_note = models.CharField(max_length=500, blank=True, default="")
    asking_price_text = models.CharField(max_length=40, blank=True, default="")
    is_public = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "property_listings"
        indexes = [
            models.Index(fields=["property"]),
            models.Index(fields=["dealer", "created_at"]),
            models.Index(fields=["found_via"]),
        ]


class Lead(UuidModel):
    """Dealer follow-up to fill gaps. Not a sales pipeline stage."""

    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, related_name="leads")
    customer = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads"
    )
    property = models.ForeignKey(
        Property, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads"
    )
    property_check = models.ForeignKey(
        PropertyCheck, on_delete=models.SET_NULL, null=True, blank=True, related_name="leads"
    )
    title = models.CharField(max_length=160)
    due_at = models.DateTimeField(null=True, blank=True)
    done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "leads"
        indexes = [
            models.Index(fields=["dealer", "done", "due_at"]),
            models.Index(fields=["customer"]),
        ]


class Appointment(UuidModel):
    """Visit to see the plot, papers, or an office. Not a booking marketplace."""

    dealer = models.ForeignKey(Dealer, on_delete=models.CASCADE, related_name="appointments")
    customer = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name="appointments"
    )
    property = models.ForeignKey(
        Property, on_delete=models.SET_NULL, null=True, blank=True, related_name="appointments"
    )
    when = models.DateTimeField()
    purpose = models.CharField(max_length=16)
    done = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "appointments"
        indexes = [
            models.Index(fields=["dealer", "when"]),
            models.Index(fields=["when"]),
        ]


class AuditLog(UuidModel):
    """Append-mostly staff/API trail. No passwords, papers, or share keys."""

    ts = models.DateTimeField()
    action = models.CharField(max_length=64)
    ok = models.BooleanField()
    actor = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="audit_events"
    )
    role = models.CharField(max_length=20, blank=True, default="")
    ip = models.CharField(max_length=45, blank=True, default="")
    subject = models.CharField(max_length=80, blank=True, default="")
    detail = models.CharField(max_length=240, blank=True, default="")

    class Meta:
        db_table = "audit_logs"
        indexes = [
            models.Index(fields=["-ts"]),
            models.Index(fields=["action", "-ts"]),
            models.Index(fields=["actor", "-ts"]),
        ]


class Plan(UuidModel):
    """Configurable offer. Amount text is staff-set — never a hardcoded tariff."""

    code = models.CharField(max_length=32, unique=True)
    audience = models.CharField(max_length=20)
    interval = models.CharField(max_length=12, default="none")
    amount_text = models.CharField(max_length=40, blank=True, default="")
    currency = models.CharField(max_length=8, default="PKR")
    entitlements = models.JSONField(default=list)
    active = models.BooleanField(default=True)

    class Meta:
        db_table = "plans"
        indexes = [models.Index(fields=["audience", "active"])]


class Subscription(UuidModel):
    """Manual billing note. No card processor, no PAN. Plan amounts live on Plan."""

    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="subscriptions"
    )
    email = models.EmailField(blank=True, default="")
    plan_code = models.CharField(max_length=32, blank=True, default="")
    interval = models.CharField(max_length=12, blank=True, default="")
    plan_note = models.CharField(max_length=160, blank=True, default="")
    status = models.CharField(max_length=12, default="recorded")
    processor = models.BooleanField(default=False)
    period_end = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "subscriptions"
        indexes = [
            models.Index(fields=["user", "status"]),
            models.Index(fields=["status", "created_at"]),
            models.Index(fields=["plan_code", "status"]),
        ]


class Payment(UuidModel):
    """Recorded amount note. No card number, CVV, or bank secret."""

    subscription = models.ForeignKey(
        Subscription, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments"
    )
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True, related_name="payments"
    )
    amount_text = models.CharField(max_length=40, blank=True, default="")
    currency = models.CharField(max_length=8, default="PKR")
    note = models.CharField(max_length=500, blank=True, default="")
    status = models.CharField(max_length=12, default="recorded")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "payments"
        indexes = [
            models.Index(fields=["subscription"]),
            models.Index(fields=["user", "created_at"]),
        ]


class Notification(UuidModel):
    """Short in-app notice. Not a WhatsApp/SMS archive."""

    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True, blank=True, related_name="notifications"
    )
    property_check = models.ForeignKey(
        PropertyCheck, on_delete=models.SET_NULL, null=True, blank=True, related_name="notifications"
    )
    kind = models.CharField(max_length=24)
    title = models.CharField(max_length=120)
    body = models.CharField(max_length=400, blank=True, default="")
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "notifications"
        indexes = [
            models.Index(fields=["user", "read_at", "-created_at"]),
            models.Index(fields=["kind", "-created_at"]),
        ]


class SharedCheck(models.Model):
    """JSON envelope the PWA still reads. Photos are stripped before write."""

    id = models.CharField(primary_key=True, max_length=32)
    payload = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "shared_checks"
        indexes = [models.Index(fields=["-created_at"])]
