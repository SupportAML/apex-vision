#!/usr/bin/env python3
"""Send email via SMTP (Gmail app password) or Gmail API."""

import argparse
import json
import os
import smtplib
import sys
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText


def send_smtp(to: str, subject: str, body: str, html: bool = False, dry_run: bool = False) -> dict:
    sender = os.environ.get("SMTP_FROM", os.environ.get("SMTP_USER"))
    user = os.environ.get("SMTP_USER")
    password = os.environ.get("SMTP_PASSWORD")
    host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    port = int(os.environ.get("SMTP_PORT", "587"))

    if not all([sender, user, password]):
        return {"status": "error", "message": "Set SMTP_USER, SMTP_PASSWORD (and optionally SMTP_FROM, SMTP_HOST, SMTP_PORT)"}

    msg = MIMEMultipart("alternative")
    msg["From"] = sender
    msg["To"] = to
    msg["Subject"] = subject
    msg.attach(MIMEText(body, "html" if html else "plain"))

    if dry_run:
        return {"status": "dry_run", "to": to, "subject": subject, "from": sender, "body_preview": body[:200]}

    try:
        with smtplib.SMTP(host, port) as server:
            server.starttls()
            server.login(user, password)
            server.send_message(msg)
        return {"status": "sent", "to": to, "subject": subject}
    except smtplib.SMTPException as e:
        return {"status": "error", "message": str(e)}


def main():
    parser = argparse.ArgumentParser(description="Send email via SMTP")
    parser.add_argument("--to", required=True, help="Recipient email")
    parser.add_argument("--subject", required=True)
    parser.add_argument("--body", required=True, help="Email body text")
    parser.add_argument("--html", action="store_true", help="Treat body as HTML")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    result = send_smtp(args.to, args.subject, args.body, args.html, args.dry_run)
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
