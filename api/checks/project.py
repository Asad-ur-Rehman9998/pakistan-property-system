"""Project a sanitized shared-check JSON payload into normalized rows."""

from __future__ import annotations

from decimal import Decimal, InvalidOperation

from django.utils.dateparse import parse_datetime
from django.utils import timezone

from checks.models import (
    DocumentExtraction,
    EvidenceSource,
    Property,
    PropertyCheck,
    PropertyComparison,
    PropertyDocument,
    PropertyListing,
    PropertyLocation,
    Report,
    RiskIndicator,
    VerificationRequest,
)
from checks.sensitive import clip, looks_like_document_dump, strip_cnics

SKIP_FIELDS = {"cnicLast4", "cnic", "photoKey"}


def _dt(raw):
    parsed = parse_datetime(str(raw or ""))
    if parsed is not None:
        return parsed
    return timezone.now()


def _dec(raw):
    try:
        if raw in (None, ""):
            return None
        return Decimal(str(raw))
    except (InvalidOperation, ValueError):
        return None


def ingest_shared_payload(payload: dict) -> PropertyCheck:
    if not isinstance(payload, dict):
        raise ValueError("invalid")
    if looks_like_document_dump(payload):
        raise ValueError("papers_stay_on_phone")
    payload = dict(payload)
    payload.pop("shareKey", None)
    public_id = str(payload.get("id") or "")
    if not public_id:
        raise ValueError("invalid")
    answers = payload.get("answers") if isinstance(payload.get("answers"), dict) else {}
    report = payload.get("report") if isinstance(payload.get("report"), dict) else {}

    existing = PropertyCheck.objects.filter(public_id=public_id).select_related("property").first()
    if existing:
        prop = existing.property
        _fill_property(prop, answers)
        prop.save()
        loc, _ = PropertyLocation.objects.get_or_create(property=prop)
        _fill_location(loc, answers)
        loc.save()
        check = existing
        _fill_check(check, payload, answers)
        check.save()
        check.documents.all().delete()
        PropertyListing.objects.filter(property_check=check).delete()
        VerificationRequest.objects.filter(property_check=check).delete()
        RiskIndicator.objects.filter(property_check=check).delete()
        PropertyComparison.objects.filter(property_check=check).delete()
        Report.objects.filter(property_check=check).delete()
    else:
        prop = Property()
        _fill_property(prop, answers)
        prop.save()
        loc = PropertyLocation(property=prop)
        _fill_location(loc, answers)
        loc.save()
        check = PropertyCheck(public_id=public_id, property=prop)
        _fill_check(check, payload, answers)
        check.save()

    _ingest_papers(prop, check, answers)
    _ingest_listing(prop, check, answers)
    sheet = _ingest_report(check, report)
    _ingest_risks(check, sheet, report)
    _ingest_comparisons(check, report)
    _ingest_verify(prop, check, report)
    return check


def _fill_property(prop: Property, answers: dict) -> None:
    prop.kind = clip(answers.get("propertyKind") or "", 16)
    prop.settlement = clip(answers.get("settlement") or "", 8)
    prop.is_society_file = answers.get("isSocietyFile")
    if prop.is_society_file not in (True, False, None):
        prop.is_society_file = None
    prop.plot_number = clip(answers.get("plotNumber") or "", 64)
    prop.khasra_number = clip(answers.get("khasraNumber") or "", 64)
    prop.society_name = clip(answers.get("societyName") or "", 120)
    prop.developer_name = clip(answers.get("developerName") or "", 120)
    prop.area_size = clip(answers.get("areaSize") or "", 32)
    prop.area_unit = clip(answers.get("areaUnit") or "", 8)


def _fill_location(loc: PropertyLocation, answers: dict) -> None:
    loc.province = clip(answers.get("province") or "", 24)
    loc.city = clip(answers.get("city") or "", 80)
    loc.district = clip(answers.get("district") or "", 80)
    loc.tehsil = clip(answers.get("tehsil") or "", 80)
    loc.village = clip(answers.get("village") or "", 80)
    loc.area = clip(answers.get("area") or "", 80)
    loc.location_label = clip(answers.get("locationLabel") or "", 160)
    loc.location_method = clip(answers.get("locationMethod") or "", 16)
    loc.lat = _dec(answers.get("lat"))
    loc.lng = _dec(answers.get("lng"))


def _fill_check(check: PropertyCheck, payload: dict, answers: dict) -> None:
    check.intent = clip(answers.get("intent") or "", 8)
    check.found_via = clip(answers.get("foundVia") or "", 24)
    check.counterparty = clip(answers.get("counterparty") or "", 16)
    check.asking_price_text = clip(answers.get("price") or "", 40)
    check.asking_price_source = EvidenceSource.USER_PROVIDED
    check.token_amount_text = clip(answers.get("tokenAmount") or "", 40)
    check.notes = clip(answers.get("notes") or "", 4000)
    check.share_token_hash = clip(payload.get("shareTokenHash") or "", 64)
    check.created_at = _dt(payload.get("createdAt"))


def _ingest_papers(prop: Property, check: PropertyCheck, answers: dict) -> None:
    docs = answers.get("documents") if isinstance(answers.get("documents"), dict) else {}
    for kind, state in docs.items():
        PropertyDocument.objects.create(
            property=prop,
            property_check=check,
            kind=clip(kind, 24),
            state=clip(state or "unsure", 12),
            on_device_photo_ref="",
            encrypted_on_device=True,
        )
    reads = answers.get("paperReads") if isinstance(answers.get("paperReads"), list) else []
    for read in reads:
        if not isinstance(read, dict):
            continue
        doc = PropertyDocument.objects.create(
            property=prop,
            property_check=check,
            kind=clip(read.get("kind") or "unknown", 24),
            state="have",
            on_device_photo_ref="",
            image_print=clip(read.get("imagePrint") or "", 16),
            encrypted_on_device=bool(read.get("encrypted", True)),
        )
        fields = read.get("fields") if isinstance(read.get("fields"), list) else []
        for field in fields:
            if not isinstance(field, dict):
                continue
            key = str(field.get("key") or "")
            if key in SKIP_FIELDS:
                continue
            raw = strip_cnics(str(field.get("value") or ""))[:200]
            if not raw:
                continue
            DocumentExtraction.objects.create(
                document=doc,
                field_key=clip(key, 32),
                value=raw,
                sensitive=False,
                confirmed=field.get("confirmed") if field.get("confirmed") in (True, False, None) else None,
                source=EvidenceSource.SYSTEM_DETECTED,
            )


def _ingest_listing(prop: Property, check: PropertyCheck, answers: dict) -> None:
    found = clip(answers.get("foundVia") or "", 24)
    if not found:
        return
    PropertyListing.objects.create(
        property=prop,
        property_check=check,
        kind="source_card",
        found_via=found,
        asking_price_text=clip(answers.get("price") or "", 40),
        is_public=False,
    )


def _ingest_report(check: PropertyCheck, report: dict) -> Report:
    prov = report.get("provenance") if isinstance(report.get("provenance"), dict) else {}
    info = report.get("infoStatus") if isinstance(report.get("infoStatus"), dict) else {}
    return Report.objects.create(
        property_check=check,
        verdict=clip(report.get("verdict") or "wait", 8),
        score=int(report.get("score") or 0),
        info_status=clip(info.get("level") or "insufficient", 16),
        engine="rules",
        has_official_verification=False,
        provenance_verified=0,
        provenance_user_provided=int(prov.get("user_provided") or 0),
        provenance_system_detected=int(prov.get("system_detected") or 0),
        provenance_needs_verification=int(prov.get("needs_verification") or 0),
        provenance_unknown=int(prov.get("unknown") or 0),
        headline=report.get("headline") if isinstance(report.get("headline"), dict) else {},
        summary=report.get("summary") if isinstance(report.get("summary"), dict) else {},
        created_at=_dt(report.get("createdAt") or check.created_at),
    )


def _ingest_risks(check: PropertyCheck, sheet: Report, report: dict) -> None:
    risks = report.get("risks") if isinstance(report.get("risks"), list) else []
    for item in risks[:40]:
        if not isinstance(item, dict):
            continue
        RiskIndicator.objects.create(
            property_check=check,
            report=sheet,
            code=clip(item.get("id") or "", 48),
            lane=clip(item.get("lane") or "", 32),
            attention=clip(item.get("attention") or "low", 8),
            source=clip(item.get("source") or EvidenceSource.SYSTEM_DETECTED, 24),
            title=item.get("title") if isinstance(item.get("title"), dict) else {},
            why=item.get("why") if isinstance(item.get("why"), dict) else {},
        )


def _ingest_comparisons(check: PropertyCheck, report: dict) -> None:
    dup = report.get("duplicates") if isinstance(report.get("duplicates"), dict) else {}
    matches = dup.get("matches") if isinstance(dup.get("matches"), list) else []
    for match in matches[:20]:
        if not isinstance(match, dict):
            continue
        other_id = str(match.get("id") or "")
        other = PropertyCheck.objects.filter(public_id=other_id).first() if other_id else None
        PropertyComparison.objects.create(
            property_check=check,
            other_check=other,
            score=_dec(match.get("score")) or Decimal("0"),
            signals=match.get("signals") if isinstance(match.get("signals"), list) else [],
            label=match.get("label") if isinstance(match.get("label"), dict) else {},
        )


def _ingest_verify(prop: Property, check: PropertyCheck, report: dict) -> None:
    items = report.get("verify") if isinstance(report.get("verify"), list) else []
    for item in items[:20]:
        if not isinstance(item, dict):
            continue
        title = item.get("title") if isinstance(item.get("title"), dict) else {}
        what = clip(title.get("en") or title.get("roman") or "", 400)
        if not what:
            continue
        hint = item.get("officeHint") if isinstance(item.get("officeHint"), dict) else {}
        VerificationRequest.objects.create(
            property=prop,
            property_check=check,
            what=what,
            office_hint=clip(hint.get("en") or hint.get("roman") or "", 240),
            status="open",
            official_source_confirmed=False,
        )


def delete_normalized(public_id: str) -> None:
    row = PropertyCheck.objects.filter(public_id=public_id).select_related("property").first()
    if row:
        row.property.delete()
