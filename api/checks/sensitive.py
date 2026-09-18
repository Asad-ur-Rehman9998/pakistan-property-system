"""Strip secrets before anything is written to PostgreSQL."""

from __future__ import annotations

import re

CNIC_RE = re.compile(r"\b\d{5}[-\s]?\d{7}[-\s]?\d\b")
CNIC_13 = re.compile(r"\b\d{13}\b")
DATA_IMAGE = re.compile(r"data:image|application/octet-stream", re.I)


def strip_cnics(text: str) -> str:
    if not text:
        return text
    return CNIC_13.sub("CNIC (hidden)", CNIC_RE.sub("CNIC (hidden)", text))


def looks_like_document_dump(payload) -> bool:
    raw = str(payload).lower()
    if DATA_IMAGE.search(raw):
        return True
    if re.search(r'"photokey"\s*:\s*"(data:|blob:)', raw):
        return True
    return False


def clip(text: str, n: int) -> str:
    return strip_cnics(str(text or ""))[:n]
