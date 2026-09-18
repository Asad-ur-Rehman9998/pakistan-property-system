from django.db import migrations, models
import uuid


def seed_plans(apps, schema_editor):
    Plan = apps.get_model("checks", "Plan")
    rows = [
        ("free", "customer", "none", ["basic_check"]),
        ("premium", "customer", "month", ["basic_check", "detailed_report"]),
        ("dealer", "dealer", "month", ["basic_check", "detailed_report", "dealer_pages"]),
        ("professional", "professional", "month", ["basic_check", "detailed_report", "receive_review_requests"]),
    ]
    for code, audience, interval, entitlements in rows:
        Plan.objects.get_or_create(
            code=code,
            defaults={
                "audience": audience,
                "interval": interval,
                "amount_text": "",
                "currency": "PKR",
                "entitlements": entitlements,
                "active": True,
            },
        )


class Migration(migrations.Migration):
    dependencies = [
        ("checks", "0002_normalized_models"),
    ]

    operations = [
        migrations.CreateModel(
            name="Plan",
            fields=[
                ("id", models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, serialize=False)),
                ("code", models.CharField(max_length=32, unique=True)),
                ("audience", models.CharField(max_length=20)),
                ("interval", models.CharField(default="none", max_length=12)),
                ("amount_text", models.CharField(blank=True, default="", max_length=40)),
                ("currency", models.CharField(default="PKR", max_length=8)),
                ("entitlements", models.JSONField(default=list)),
                ("active", models.BooleanField(default=True)),
            ],
            options={"db_table": "plans"},
        ),
        migrations.AddIndex(
            model_name="plan",
            index=models.Index(fields=["audience", "active"], name="plans_audien_idx"),
        ),
        migrations.AddField(
            model_name="subscription",
            name="plan_code",
            field=models.CharField(blank=True, default="", max_length=32),
        ),
        migrations.AddField(
            model_name="subscription",
            name="interval",
            field=models.CharField(blank=True, default="", max_length=12),
        ),
        migrations.AddField(
            model_name="subscription",
            name="period_end",
            field=models.DateTimeField(blank=True, null=True),
        ),
        migrations.AddIndex(
            model_name="subscription",
            index=models.Index(fields=["plan_code", "status"], name="subscript_plan_st_idx"),
        ),
        migrations.RunPython(seed_plans, migrations.RunPython.noop),
    ]
