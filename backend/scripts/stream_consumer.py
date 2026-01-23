#!/usr/bin/env python3
"""Consume the /evaluate/stream SSE endpoint and pretty-print events."""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Consume Medidex SSE stream.")
    parser.add_argument(
        "--url",
        default="http://localhost:8001/evaluate/stream",
        help="Streaming endpoint URL.",
    )
    parser.add_argument(
        "--mock",
        action="store_true",
        help="Use the backend mock report/studies as the request payload.",
    )
    parser.add_argument(
        "--payload",
        help="Path to JSON payload file for the request body (optional).",
    )
    return parser.parse_args()


def load_payload(args: argparse.Namespace) -> dict:
    if args.mock:
        return {}

    if not args.payload:
        print("Provide --payload PATH or use --mock.", file=sys.stderr)
        sys.exit(1)

    try:
        with open(args.payload, "r", encoding="utf-8") as handle:
            return json.load(handle)
    except FileNotFoundError:
        print(f"Payload file not found: {args.payload}", file=sys.stderr)
        sys.exit(1)
    except json.JSONDecodeError as exc:
        print(f"Invalid JSON in payload file: {exc}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    args = parse_args()
    payload = load_payload(args)

    url = args.url
    if args.mock:
        url = url.rstrip("/") + "/mock"
        request = urllib.request.Request(url, method="GET")
    else:
        data = json.dumps(payload).encode("utf-8")
        request = urllib.request.Request(
            url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST",
        )

    try:
        with urllib.request.urlopen(request) as response:
            for raw_line in response:
                line = raw_line.decode("utf-8").strip()
                if not line or not line.startswith("data:"):
                    continue
                content = line.removeprefix("data:").strip()
                try:
                    event = json.loads(content)
                    if isinstance(event, dict) and "message" in event:
                        print(event["message"])
                        print()
                    else:
                        print(json.dumps(event, indent=2, ensure_ascii=False))
                except json.JSONDecodeError:
                    continue
    except urllib.error.URLError as exc:
        print(f"Request failed: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    from pathlib import Path

    main()
