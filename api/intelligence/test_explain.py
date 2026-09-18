from intelligence.explain import INSUFFICIENT, explain_question, invents_evidence


def test_legal_question_is_insufficient():
    assert explain_question("Is this legally verified?") == INSUFFICIENT


def test_fraud_question_is_insufficient():
    assert explain_question("Is this fraud?") == INSUFFICIENT


def test_invented_verdict_is_rejected():
    assert invents_evidence("This property is legally verified and a fraud.") is True
    assert invents_evidence("Fard is missing on this check.") is False
