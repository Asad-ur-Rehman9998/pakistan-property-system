from rest_framework.response import Response
from rest_framework.views import APIView

from intelligence.classify import classify_paper
from intelligence.explain import INSUFFICIENT, explain_question, invents_evidence


class ClassifyView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request):
        text = str(request.data.get("text") or "")
        kind, confidence = classify_paper(text)
        return Response({"kind": kind, "confidence": confidence, "llm": False, "engine": "rules"})


class ExplainView(APIView):
    authentication_classes: list = []
    permission_classes: list = []

    def post(self, request):
        question = str(request.data.get("question") or "")
        draft = str(request.data.get("text") or "")
        if draft and invents_evidence(draft):
            return Response(
                {"text": INSUFFICIENT, "llm": False, "engine": "rules", "rejected": "invented_evidence"}
            )
        return Response(
            {
                "text": explain_question(question),
                "llm": False,
                "llmRequired": False,
                "engine": "rules",
                "insufficient": INSUFFICIENT,
            }
        )
