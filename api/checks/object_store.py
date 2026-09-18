import json
import os


def put_check_object(check_id: str, payload: dict) -> None:
    """AWS-compatible object storage (MinIO/S3). Photos stay on the phone."""
    endpoint = os.environ.get("AWS_S3_ENDPOINT_URL")
    bucket = os.environ.get("AWS_STORAGE_BUCKET_NAME")
    key_id = os.environ.get("AWS_ACCESS_KEY_ID")
    secret = os.environ.get("AWS_SECRET_ACCESS_KEY")
    if not endpoint or not bucket or not key_id or not secret:
        return
    try:
        import boto3
        from botocore.config import Config

        client = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=key_id,
            aws_secret_access_key=secret,
            config=Config(signature_version="s3v4"),
            region_name=os.environ.get("AWS_REGION", "us-east-1"),
        )
        client.put_object(
            Bucket=bucket,
            Key=f"checks/{check_id}.json",
            Body=json.dumps(payload).encode("utf-8"),
            ContentType="application/json",
        )
    except Exception:
        return
