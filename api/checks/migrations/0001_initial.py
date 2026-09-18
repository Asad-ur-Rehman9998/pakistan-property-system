from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True
    dependencies = []
    operations = [
        migrations.CreateModel(
            name="SharedCheck",
            fields=[
                ("id", models.CharField(max_length=32, primary_key=True, serialize=False)),
                ("payload", models.JSONField()),
                ("created_at", models.DateTimeField(auto_now_add=True)),
            ],
            options={"db_table": "shared_checks"},
        ),
    ]
