from intelligence.classify import classify_paper


def test_empty_is_unknown():
    assert classify_paper("") == ("unknown", 0.0)


def test_fard_words():
    kind, conf = classify_paper("PUNJAB LAND RECORD FARD JAMABANDI Patwari")
    assert kind == "fard"
    assert conf > 0.3


def test_no_llm_path():
    kind, _ = classify_paper("allotment letter allottee DHA")
    assert kind == "allotment"
