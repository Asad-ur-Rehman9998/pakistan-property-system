INSUFFICIENT = "I don't have enough information to determine this."

INVENTED = (
    "fraud",
    "scam",
    "legally verified",
    "legally safe",
    "officially verified",
    "market average",
    "sold for",
)


def invents_evidence(text: str) -> bool:
    raw = (text or "").lower()
    return any(n in raw for n in INVENTED)


def explain_question(question: str) -> str:
    q = (question or "").lower()
    if not q.strip():
        return INSUFFICIENT
    if any(n in q for n in ("fraud", "verified", "legally", "market", "worth", "sold for")):
        return INSUFFICIENT
    return INSUFFICIENT
