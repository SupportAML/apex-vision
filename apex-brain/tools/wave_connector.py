#!/usr/bin/env python3
"""Wave Apps GraphQL connector with provider abstraction layer.

Pulls invoices, expenses, and payments from Wave's GraphQL API.
Normalizes output for use by other providers (Zoho, QuickBooks) via the same interface.
"""

import argparse
import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timedelta

WAVE_GQL_URL = "https://gql.waveapps.com/graphql/public"


def wave_request(query: str, variables: dict = None) -> dict:
    """Execute a Wave GraphQL query."""
    token = os.environ.get("WAVEAPPS_API_TOKEN")
    if not token:
        return {"status": "error", "message": "WAVEAPPS_API_TOKEN not set"}

    payload = {"query": query}
    if variables:
        payload["variables"] = variables

    body = json.dumps(payload).encode()
    req = urllib.request.Request(WAVE_GQL_URL, data=body, headers={
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    })
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        return {"status": "error", "code": e.code, "message": e.read().decode()}


def get_businesses() -> list:
    """List all businesses in the Wave account."""
    query = """
    query {
      businesses(page: 1, pageSize: 50) {
        edges {
          node {
            id
            name
            currency { code }
            isPersonal
          }
        }
      }
    }
    """
    result = wave_request(query)
    if "errors" in result or "status" in result:
        return [result]
    edges = result.get("data", {}).get("businesses", {}).get("edges", [])
    return [{"id": e["node"]["id"], "name": e["node"]["name"],
             "currency": e["node"]["currency"]["code"],
             "is_personal": e["node"]["isPersonal"]} for e in edges]


def get_invoices(business_id: str, days: int = 30) -> list:
    """Pull recent invoices for a business."""
    query = """
    query($businessId: ID!, $page: Int!) {
      business(id: $businessId) {
        invoices(page: $page, pageSize: 50) {
          edges {
            node {
              id
              invoiceNumber
              status
              invoiceDate
              dueDate
              amountDue { value currency { code } }
              amountPaid { value currency { code } }
              total { value currency { code } }
              customer { name email }
              memo
            }
          }
        }
      }
    }
    """
    result = wave_request(query, {"businessId": business_id, "page": 1})
    if "errors" in result or "status" in result:
        return [result]

    edges = result.get("data", {}).get("business", {}).get("invoices", {}).get("edges", [])
    cutoff = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

    invoices = []
    for e in edges:
        node = e["node"]
        if node["invoiceDate"] and node["invoiceDate"] >= cutoff:
            invoices.append(normalize_invoice(node))
    return invoices


def normalize_invoice(node: dict) -> dict:
    """Normalize a Wave invoice into the unified format."""
    return {
        "provider": "wave",
        "id": node["id"],
        "number": node.get("invoiceNumber", ""),
        "status": node.get("status", "UNKNOWN").lower(),
        "date": node.get("invoiceDate", ""),
        "due_date": node.get("dueDate", ""),
        "total": float(node.get("total", {}).get("value", 0)),
        "amount_due": float(node.get("amountDue", {}).get("value", 0)),
        "amount_paid": float(node.get("amountPaid", {}).get("value", 0)),
        "currency": node.get("total", {}).get("currency", {}).get("code", "USD"),
        "customer": node.get("customer", {}).get("name", "") if node.get("customer") else "",
        "memo": node.get("memo", ""),
    }


def get_expenses(business_id: str, days: int = 30) -> list:
    """Pull recent expenses (transactions) for a business."""
    query = """
    query($businessId: ID!, $page: Int!) {
      business(id: $businessId) {
        transactions(page: $page, pageSize: 100) {
          edges {
            node {
              id
              description
              date
              amount { value currency { code } }
              account { name type { value } }
            }
          }
        }
      }
    }
    """
    result = wave_request(query, {"businessId": business_id, "page": 1})
    if "errors" in result or "status" in result:
        return [result]

    edges = result.get("data", {}).get("business", {}).get("transactions", {}).get("edges", [])
    cutoff = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")

    expenses = []
    for e in edges:
        node = e["node"]
        if node.get("date") and node["date"] >= cutoff:
            account_type = node.get("account", {}).get("type", {}).get("value", "")
            if account_type in ("EXPENSE", "COST_OF_GOODS_SOLD"):
                expenses.append(normalize_expense(node))
    return expenses


def normalize_expense(node: dict) -> dict:
    """Normalize a Wave transaction into the unified expense format."""
    return {
        "provider": "wave",
        "id": node["id"],
        "description": node.get("description", ""),
        "date": node.get("date", ""),
        "amount": abs(float(node.get("amount", {}).get("value", 0))),
        "currency": node.get("amount", {}).get("currency", {}).get("code", "USD"),
        "category": node.get("account", {}).get("name", "Uncategorized"),
    }


def build_summary(invoices: list, expenses: list) -> dict:
    """Build a financial summary from normalized invoices and expenses."""
    total_invoiced = sum(i.get("total", 0) for i in invoices if isinstance(i, dict) and "total" in i)
    total_paid = sum(i.get("amount_paid", 0) for i in invoices if isinstance(i, dict) and "amount_paid" in i)
    total_outstanding = sum(i.get("amount_due", 0) for i in invoices if isinstance(i, dict) and "amount_due" in i)
    total_expenses = sum(e.get("amount", 0) for e in expenses if isinstance(e, dict) and "amount" in e)

    overdue = [i for i in invoices if isinstance(i, dict)
               and i.get("status") in ("sent", "partial", "viewed")
               and i.get("due_date", "9999") < datetime.utcnow().strftime("%Y-%m-%d")]

    expense_by_category = {}
    for e in expenses:
        if isinstance(e, dict) and "category" in e:
            cat = e["category"]
            expense_by_category[cat] = expense_by_category.get(cat, 0) + e.get("amount", 0)

    return {
        "period": f"last query",
        "generated_at": datetime.utcnow().isoformat(),
        "revenue": {
            "total_invoiced": round(total_invoiced, 2),
            "total_collected": round(total_paid, 2),
            "total_outstanding": round(total_outstanding, 2),
            "overdue_count": len(overdue),
            "overdue_total": round(sum(i.get("amount_due", 0) for i in overdue), 2),
        },
        "expenses": {
            "total": round(total_expenses, 2),
            "by_category": {k: round(v, 2) for k, v in sorted(expense_by_category.items(), key=lambda x: -x[1])},
        },
        "net": round(total_paid - total_expenses, 2),
        "invoice_count": len([i for i in invoices if isinstance(i, dict) and "id" in i]),
        "expense_count": len([e for e in expenses if isinstance(e, dict) and "id" in e]),
    }


def main():
    parser = argparse.ArgumentParser(description="Wave Apps accounting connector")
    parser.add_argument("--action", choices=["businesses", "invoices", "expenses", "summary", "sync"],
                        default="summary", help="What to fetch")
    parser.add_argument("--business-id", default=os.environ.get("WAVEAPPS_BUSINESS_ID", ""),
                        help="Wave business ID")
    parser.add_argument("--days", type=int, default=30, help="Lookback period in days")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be fetched")
    args = parser.parse_args()

    if args.dry_run:
        print(json.dumps({
            "status": "dry_run",
            "action": args.action,
            "business_id": args.business_id or "(from env)",
            "days": args.days,
            "provider": "wave",
            "endpoint": WAVE_GQL_URL,
        }, indent=2))
        return

    if args.action == "businesses":
        print(json.dumps(get_businesses(), indent=2))
        return

    if not args.business_id:
        print(json.dumps({"status": "error", "message": "Set --business-id or WAVEAPPS_BUSINESS_ID env var"}))
        sys.exit(1)

    if args.action == "invoices":
        print(json.dumps(get_invoices(args.business_id, args.days), indent=2))
    elif args.action == "expenses":
        print(json.dumps(get_expenses(args.business_id, args.days), indent=2))
    elif args.action in ("summary", "sync"):
        invoices = get_invoices(args.business_id, args.days)
        expenses = get_expenses(args.business_id, args.days)
        summary = build_summary(invoices, expenses)
        result = {"summary": summary}
        if args.action == "sync":
            result["invoices"] = invoices
            result["expenses"] = expenses
        print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
