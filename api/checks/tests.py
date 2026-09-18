from django.core.exceptions import ValidationError
from django.db import models
from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from checks.models import (
    Customer,
    Dealer,
    DocumentExtraction,
    Plan,
    Property,
    PropertyCheck,
    PropertyDocument,
    PropertyListing,
    Report,
    Subscription,
    User,
)
from checks.project import delete_normalized, ingest_shared_payload
from checks.schema_policy import (
    ALLOWED_SECRETISH,
    FORBIDDEN_FIELD_NAMES,
    FORBIDDEN_FIELD_TYPES,
    NORMALIZED_TABLES,
    concrete_models,
    field_names,
)
from checks.sensitive import looks_like_document_dump, strip_cnics
from checks.serializers import SharedCheckWriteSerializer


class SchemaPolicyTests(SimpleTestCase):
    def test_every_requested_table_exists(self):
        names = {m._meta.db_table for m in concrete_models()}
        self.assertEqual(names, set(NORMALIZED_TABLES))

    def test_primary_keys_are_uuids(self):
        for model in concrete_models():
            pk = model._meta.pk
            self.assertIsInstance(pk, models.UUIDField, model.__name__)

    def test_no_file_or_blob_columns(self):
        for model in concrete_models():
            for field in model._meta.get_fields():
                self.assertFalse(
                    isinstance(field, FORBIDDEN_FIELD_TYPES),
                    f"{model.__name__}.{getattr(field, 'name', field)} stores files",
                )

    def test_forbidden_secret_names_are_absent(self):
        for model in concrete_models():
            names = field_names(model)
            leaked = (names & FORBIDDEN_FIELD_NAMES) - ALLOWED_SECRETISH
            self.assertFalse(leaked, f"{model.__name__} has {leaked}")

    def test_share_key_and_full_cnic_are_not_columns(self):
        all_names = set()
        for model in concrete_models():
            all_names |= field_names(model)
        self.assertNotIn("share_key", all_names)
        self.assertNotIn("cnic", all_names)
        self.assertNotIn("full_cnic", all_names)
        self.assertIn("share_token_hash", all_names)
        self.assertIn("phone_last4", all_names)

    def test_listing_is_not_public_by_default(self):
        field = PropertyListing._meta.get_field("is_public")
        self.assertIs(field.default, False)

    def test_report_official_verification_defaults_false(self):
        field = Report._meta.get_field("has_official_verification")
        self.assertIs(field.default, False)
        self.assertEqual(Report._meta.get_field("provenance_verified").default, 0)

    def test_user_stores_hash_not_password(self):
        names = field_names(User)
        self.assertIn("password_hash", names)
        self.assertNotIn("password", names)

    def test_indexes_cover_lookups(self):
        check_indexed = {tuple(ix.fields) for ix in PropertyCheck._meta.indexes}
        self.assertIn(("public_id",), {(f.name,) for f in PropertyCheck._meta.fields if f.unique} | check_indexed)
        self.assertTrue(PropertyCheck._meta.get_field("public_id").unique)
        self.assertTrue(any("plot_number" in ix.fields for ix in Property._meta.indexes))
        self.assertTrue(any("khasra_number" in ix.fields for ix in Property._meta.indexes))
        self.assertTrue(any("image_print" in ix.fields for ix in PropertyDocument._meta.indexes))


class SensitiveTextTests(SimpleTestCase):
    def test_strip_cnics(self):
        self.assertIn("hidden", strip_cnics("Seller CNIC 35202-1234567-1 at gate"))
        self.assertNotIn("35202", strip_cnics("Seller CNIC 35202-1234567-1 at gate"))

    def test_document_dump_rejected(self):
        self.assertTrue(looks_like_document_dump({"photo": "data:image/jpeg;base64,xxxx"}))
        self.assertFalse(looks_like_document_dump({"id": "abc", "notes": "fard missing"}))


class SharedCheckSerializerTests(SimpleTestCase):
    def valid_body(self, **extra):
        body = {
            "id": "serializer01ab",
            "createdAt": "2026-08-28T00:00:00.000Z",
            "answers": {"intent": "buy", "notes": "ok"},
            "report": {"verdict": "wait", "score": 40},
            "shareTokenHash": "b" * 64,
        }
        body.update(extra)
        return body

    def test_accepts_shared_json_report(self):
        ser = SharedCheckWriteSerializer(data=self.valid_body())
        self.assertTrue(ser.is_valid(), ser.errors)

    def test_rejects_short_id_and_bad_verdict(self):
        bad_id = SharedCheckWriteSerializer(data=self.valid_body(id="short"))
        self.assertFalse(bad_id.is_valid())
        bad_verdict = SharedCheckWriteSerializer(
            data=self.valid_body(report={"verdict": "verified", "score": 1})
        )
        self.assertFalse(bad_verdict.is_valid())

    def test_rejects_paper_dumps(self):
        ser = SharedCheckWriteSerializer(
            data=self.valid_body(answers={"notes": "data:image/jpeg;base64,xxxx"})
        )
        self.assertFalse(ser.is_valid())
        self.assertIn("papers_stay_on_phone", str(ser.errors))


class IngestTests(TestCase):
    def payload(self, **extra):
        body = {
            "id": "schematest01ab",
            "createdAt": "2026-08-28T00:00:00.000Z",
            "shareTokenHash": "a" * 64,
            "shareKey": "should-never-land",
            "answers": {
                "intent": "buy",
                "settlement": "urban",
                "propertyKind": "plot",
                "province": "punjab",
                "city": "Lahore",
                "area": "DHA Phase 6",
                "plotNumber": "412",
                "khasraNumber": "",
                "price": "2.5 crore",
                "foundVia": "whatsapp",
                "notes": "Seller CNIC 35202-1234567-1 wants token today",
                "documents": {"fard": "have", "registry": "missing"},
                "paperReads": [
                    {
                        "photoKey": "idb-secret",
                        "kind": "fard",
                        "encrypted": True,
                        "imagePrint": "abcd1234abcd1234",
                        "fields": [
                            {"key": "ownerName", "value": "Ahmed Ali", "sensitive": False, "confirmed": True},
                            {"key": "cnicLast4", "value": "5671", "sensitive": True, "confirmed": True},
                            {"key": "plotNumber", "value": "412", "sensitive": False, "confirmed": True},
                        ],
                    }
                ],
            },
            "report": {
                "verdict": "wait",
                "score": 40,
                "createdAt": "2026-08-28T00:00:00.000Z",
                "headline": {"en": "Wait", "ur": "Wait", "roman": "Wait"},
                "summary": {"en": "Gaps", "ur": "Gaps", "roman": "Gaps"},
                "infoStatus": {"level": "verify"},
                "hasOfficialVerification": True,
                "provenance": {
                    "verified": 9,
                    "user_provided": 3,
                    "system_detected": 2,
                    "needs_verification": 4,
                    "unknown": 1,
                },
                "risks": [
                    {
                        "id": "token_rush",
                        "lane": "unverified_claims",
                        "attention": "high",
                        "source": "system_detected",
                        "title": {"en": "Rush", "ur": "Rush", "roman": "Jaldi"},
                        "why": {"en": "Token today", "ur": "Token", "roman": "Token aaj"},
                    }
                ],
                "verify": [
                    {
                        "title": {"en": "Confirm fard at Arazi", "ur": "Fard", "roman": "Fard Arazi"},
                        "officeHint": {"en": "Arazi record center", "ur": "Arazi", "roman": "Arazi"},
                    }
                ],
                "duplicates": {"matches": [{"id": "othercheck01", "score": 0.7, "label": {"en": "Maybe", "ur": "", "roman": "Shayad"}}]},
            },
        }
        body.update(extra)
        return body

    def test_ingest_normalizes_and_drops_secrets(self):
        check = ingest_shared_payload(self.payload())
        self.assertEqual(check.public_id, "schematest01ab")
        self.assertIsNone(check.user)
        self.assertEqual(check.asking_price_source, "user_provided")
        self.assertNotIn("35202", check.notes)
        self.assertEqual(check.share_token_hash, "a" * 64)
        self.assertFalse(hasattr(check, "share_key"))
        self.assertEqual(check.property.plot_number, "412")
        self.assertEqual(check.property.location.city, "Lahore")
        self.assertEqual(check.report.has_official_verification, False)
        self.assertEqual(check.report.provenance_verified, 0)
        self.assertEqual(check.report.engine, "rules")
        self.assertEqual(check.risks.count(), 1)
        self.assertEqual(check.verification_requests.get().official_source_confirmed, False)
        listing = check.listings.get()
        self.assertEqual(listing.kind, "source_card")
        self.assertFalse(listing.is_public)
        docs = list(check.documents.all())
        self.assertTrue(any(d.kind == "fard" and d.on_device_photo_ref == "" for d in docs))
        self.assertTrue(all(d.on_device_photo_ref == "" for d in docs))
        keys = list(
            DocumentExtraction.objects.filter(document__property_check=check).values_list("field_key", flat=True)
        )
        self.assertIn("ownerName", keys)
        self.assertIn("plotNumber", keys)
        self.assertNotIn("cnicLast4", keys)
        self.assertFalse(DocumentExtraction.objects.filter(value__contains="idb-secret").exists())

    def test_document_dump_is_rejected(self):
        with self.assertRaises(ValueError):
            ingest_shared_payload(self.payload(answers={"notes": "data:image/png;base64,aaa"}))

    def test_delete_removes_property_tree(self):
        ingest_shared_payload(self.payload())
        delete_normalized("schematest01ab")
        self.assertFalse(PropertyCheck.objects.filter(public_id="schematest01ab").exists())
        self.assertFalse(Property.objects.filter(plot_number="412").exists())

    def test_customer_rejects_full_phone(self):
        dealer = Dealer.objects.create(display_name="Ali")
        row = Customer(dealer=dealer, display_name="Buyer", phone_last4="03001234567")
        with self.assertRaises(ValidationError):
            row.full_clean()

    def test_user_email_is_normalized(self):
        user = User.objects.create(
            email="  Owner@Example.TEST ",
            password_hash="scrypt-not-plain",
            role="staff",
        )
        self.assertEqual(user.email, "owner@example.test")

    def test_extraction_rejects_full_cnic(self):
        prop = Property.objects.create(kind="plot")
        check = PropertyCheck.objects.create(
            public_id="cnicfail01ab", property=prop, created_at=timezone.now()
        )
        doc = PropertyDocument.objects.create(property=prop, property_check=check, kind="cnic")
        row = DocumentExtraction(document=doc, field_key="cnicLast4", value="3520212345671")
        with self.assertRaises(Exception):
            row.save()


class PlanCatalogTests(TestCase):
    def test_seeded_plans_have_blank_prices(self):
        codes = set(Plan.objects.values_list("code", flat=True))
        self.assertEqual(codes, {"free", "premium", "dealer", "professional"})
        for plan in Plan.objects.exclude(code="free"):
            self.assertEqual(plan.amount_text, "")
        dealer = Plan.objects.get(code="dealer")
        self.assertEqual(dealer.interval, "month")
        self.assertIn("dealer_pages", dealer.entitlements)
        pro = Plan.objects.get(code="professional")
        self.assertIn("receive_review_requests", pro.entitlements)

    def test_plans_api_exposes_config_not_a_tariff(self):
        res = self.client.get("/v1/billing/plans/")
        self.assertEqual(res.status_code, 200)
        body = res.json()
        self.assertFalse(body["processor"])
        codes = {p["id"] for p in body["plans"]}
        self.assertEqual(codes, {"free", "premium", "dealer", "professional"})
        premium = next(p for p in body["plans"] if p["id"] == "premium")
        self.assertIsNone(premium["amountText"])
        dealer = next(p for p in body["plans"] if p["id"] == "dealer")
        self.assertEqual(dealer["interval"], "month")

    def test_subscription_is_not_a_card_processor(self):
        field = Subscription._meta.get_field("processor")
        self.assertIs(field.default, False)

