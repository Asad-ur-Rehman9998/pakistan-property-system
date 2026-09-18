from rest_framework import serializers

from checks.sensitive import looks_like_document_dump

CHECK_ID = r"^[A-Za-z0-9_-]{8,32}$"
SHARE_HASH = r"^[a-f0-9]{64}$"


class SharedCheckWriteSerializer(serializers.Serializer):
    """Shared JSON report only — never paper photos or raw share keys."""

    id = serializers.RegexField(regex=CHECK_ID)
    createdAt = serializers.CharField(max_length=48)
    answers = serializers.JSONField()
    report = serializers.DictField()
    shareTokenHash = serializers.RegexField(regex=SHARE_HASH, required=False, allow_null=True)

    def validate_report(self, value):
        if not isinstance(value, dict):
            raise serializers.ValidationError("invalid")
        verdict = value.get("verdict")
        if verdict not in ("stop", "wait", "careful"):
            raise serializers.ValidationError("invalid")
        return value

    def validate(self, attrs):
        data = dict(attrs)
        if looks_like_document_dump(data):
            raise serializers.ValidationError("papers_stay_on_phone")
        notes = None
        answers = data.get("answers")
        if isinstance(answers, dict):
            notes = answers.get("notes")
        if isinstance(notes, str) and len(notes) > 4000:
            raise serializers.ValidationError("too_long")
        return attrs


class SharedCheckIdSerializer(serializers.Serializer):
    check_id = serializers.RegexField(regex=CHECK_ID)
