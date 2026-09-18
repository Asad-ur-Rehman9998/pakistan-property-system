"""Rule-based paper type. No LLM."""

RULES = [
    ("cnic", 6, ["nadra", "national identity", "cnic", "شناختی کارڈ", "computerized national"]),
    ("fard", 5, ["fard", "jamabandi", "فرد", "جمبندی", "patwari"]),
    ("khasra", 4, ["khasra", "khewat", "khatooni", "khatauni", "خسرہ", "کھتونی", "کھیوت"]),
    ("aks_shajra", 5, ["aks shajra", "shajra", "عکس شجرہ", "شجرہ"]),
    ("mutation", 5, ["intiqal", "mutation", "انتقال", "fard badar"]),
    ("registry", 5, ["registry", "sale deed", "registrar", "sub registrar", "رجسٹری", "wasika", "وثیقہ"]),
    ("allotment", 4, ["allotment", "allottee", "الاٹمنٹ"]),
    ("original_file", 4, ["open file", "file number", "allocation file", "فائل نمبر"]),
    ("noc", 4, ["noc", "no objection", "transfer letter", "این او سی"]),
    ("bayana", 4, ["bayana", "token money", "earnest", "بیعانہ", "agreement to sell"]),
    ("utility_bills", 4, ["lesco", "k-electric", "ssgc", "sui gas", "wapda", "electricity bill"]),
    ("approved_plan", 4, ["building plan", "completion certificate", "approved plan"]),
    ("warasat", 4, ["warasat", "heir", "succession", "وراثت", "ورثاء", "legal heir"]),
    ("rent_agreement", 4, ["rent agreement", "tenancy", "kiraya nama", "کرایہ نامہ"]),
]


def classify_paper(ocr_text: str) -> tuple[str, float]:
    text = (ocr_text or "").lower()
    if not text.strip():
        return "unknown", 0.0
    scores: dict[str, int] = {}
    for kind, weight, needles in RULES:
        hits = sum(1 for n in needles if n.lower() in text)
        if hits:
            scores[kind] = scores.get(kind, 0) + hits * weight
    if not scores:
        return "unknown", 0.0
    best, best_score = max(scores.items(), key=lambda kv: kv[1])
    if best_score < 4:
        return "unknown", best_score / 12
    return best, min(0.95, 0.35 + best_score / 20)
