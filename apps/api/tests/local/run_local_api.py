from __future__ import annotations

import json
import os
from dataclasses import dataclass
from typing import Any
from uuid import uuid4

import httpx


BASE_URL = os.getenv("BASE_URL", "http://localhost:8000").rstrip("/")
TIMEOUT_SECONDS = float(os.getenv("LOCAL_TEST_TIMEOUT_SECONDS", "15"))

RUN_SONG_SEARCH = os.getenv("RUN_SONG_SEARCH", "1").lower() not in {
    "0",
    "false",
    "no",
}
RUN_GOOGLE_STUB = os.getenv("RUN_GOOGLE_STUB", "0").lower() in {
    "1",
    "true",
    "yes",
}

DEFAULT_EMAIL = f"local-debug-{uuid4().hex[:10]}@example.com"

EMAIL = os.getenv("LOCAL_TEST_EMAIL", DEFAULT_EMAIL)
PASSWORD = os.getenv("LOCAL_TEST_PASSWORD", "CampfireLocal123!")
INSTRUMENT = os.getenv("LOCAL_TEST_INSTRUMENT", "guitar")
SEARCH_QUERY = os.getenv("LOCAL_TEST_SEARCH_QUERY", "come together")
GOOGLE_STUB_INTENT = os.getenv("LOCAL_TEST_GOOGLE_STUB_INTENT", "sign-in")


class LocalFlowError(RuntimeError):
    """Raised when the local API flow cannot continue safely."""


@dataclass(frozen=True)
class StepResult:
    response: httpx.Response
    body: Any


def pretty(value: Any) -> str:
    if value is None:
        return "<empty>"

    try:
        return json.dumps(value, indent=2, ensure_ascii=False, sort_keys=True)
    except TypeError:
        return str(value)


def response_body(response: httpx.Response) -> Any:
    if response.status_code == 204 or not response.content:
        return None

    content_type = response.headers.get("content-type", "")

    if "application/json" in content_type:
        try:
            return response.json()
        except ValueError:
            return response.text

    return response.text


def log_request(
    method: str,
    path: str,
    payload: Any | None,
    params: dict[str, Any] | None,
) -> None:
    print("\n" + "=" * 88)
    print(f"{method.upper()} {path}")

    if params:
        print("Query params:")
        print(pretty(params))

    if payload is not None:
        print("Payload:")
        print(pretty(payload))


def log_response(
    response: httpx.Response,
    body: Any,
    expected: tuple[int, ...],
) -> None:
    print(f"Status: {response.status_code} | expected: {expected}")

    repertoire_action = response.headers.get("X-Repertoire-Action")
    if repertoire_action:
        print(f"X-Repertoire-Action: {repertoire_action}")

    print("Response body:")
    print(pretty(body))


def call(
    client: httpx.Client,
    method: str,
    path: str,
    *,
    expected: int | tuple[int, ...] = 200,
    payload: dict[str, Any] | None = None,
    params: dict[str, Any] | None = None,
    token: str | None = None,
    stop_on_unexpected: bool = True,
) -> StepResult | None:
    expected_codes = (expected,) if isinstance(expected, int) else expected
    headers = {"Authorization": f"Bearer {token}"} if token else None

    log_request(method, path, payload, params)

    try:
        response = client.request(
            method,
            f"{BASE_URL}{path}",
            json=payload,
            params=params,
            headers=headers,
        )
    except httpx.ConnectError:
        print(f"Could not connect to {BASE_URL}. Is the FastAPI app running?")
        return None
    except httpx.RequestError as exc:
        print(f"Request failed: {exc}")
        return None

    body = response_body(response)
    log_response(response, body, expected_codes)

    if response.status_code not in expected_codes:
        message = (
            f"Unexpected status for {method.upper()} {path}: "
            f"{response.status_code}"
        )

        if stop_on_unexpected:
            raise LocalFlowError(message)

        print(f"WARNING: {message}")
        return None

    return StepResult(response=response, body=body)


def require_body(result: StepResult | None, step_name: str) -> dict[str, Any]:
    if result is None or not isinstance(result.body, dict):
        raise LocalFlowError(f"{step_name} did not return a JSON object.")

    return result.body


def auth_token(body: dict[str, Any]) -> str:
    token = body.get("accessToken")

    if not isinstance(token, str) or not token:
        raise LocalFlowError("Response did not include a valid accessToken.")

    return token


def build_song_payload(search_body: dict[str, Any] | None = None) -> dict[str, Any]:
    first_result = None

    if search_body:
        results = search_body.get("results")
        if isinstance(results, list) and results:
            first_result = results[0]

    if isinstance(first_result, dict):
        return {
            "songExternalId": first_result["externalId"],
            "songTitle": first_result["title"],
            "songArtist": first_result["artist"],
            "songAlbum": first_result.get("album"),
            "songReleaseYear": first_result.get("releaseYear"),
            "songCoverArtUrl": first_result.get("coverArtUrl"),
            "instrument": INSTRUMENT,
            "proficiency": "learning",
        }

    return {
        "songExternalId": f"local-debug-{uuid4().hex[:12]}",
        "songTitle": "Come Together",
        "songArtist": "The Beatles",
        "songAlbum": "Abbey Road",
        "songReleaseYear": 1969,
        "songCoverArtUrl": None,
        "instrument": INSTRUMENT,
        "proficiency": "learning",
    }


def main() -> int:
    print(f"Using BASE_URL={BASE_URL}")
    print(f"Using LOCAL_TEST_EMAIL={EMAIL}")
    print(f"Using LOCAL_TEST_INSTRUMENT={INSTRUMENT}")

    try:
        with httpx.Client(timeout=TIMEOUT_SECONDS) as client:
            if call(client, "GET", "/healthz", expected=200) is None:
                return 2

            if call(client, "GET", "/readyz", expected=200) is None:
                return 2

            register_payload = {
                "email": EMAIL,
                "password": PASSWORD,
            }

            call(
                client,
                "POST",
                "/auth/register",
                expected=201,
                payload=register_payload,
            )

            login = call(
                client,
                "POST",
                "/auth/login",
                expected=200,
                payload=register_payload,
            )
            access_token = auth_token(require_body(login, "login"))

            call(
                client,
                "GET",
                "/me",
                expected=200,
                token=access_token,
            )

            preferences_payload = {
                "instruments": [INSTRUMENT],
                "genres": ["rock", "mpb"],
                "context": "Local API debugging flow",
                "goals": [
                    "understand backend behavior",
                    "exercise main endpo"
                    "ints",
                ],
                "experience": "intermediate",
            }

            call(
                client,
                "PATCH",
                "/me/preferences",
                expected=200,
                payload=preferences_payload,
                token=access_token,
            )

            refreshed = call(
                client,
                "POST",
                "/auth/refresh",
                expected=200,
            )
            access_token = auth_token(require_body(refreshed, "refresh"))

            call(
                client,
                "GET",
                "/repertoire/entries",
                expected=200,
                token=access_token,
            )

            search_body = None

            if RUN_SONG_SEARCH:
                search = call(
                    client,
                    "GET",
                    "/repertoire/songs/search",
                    expected=200,
                    params={
                        "q": SEARCH_QUERY,
                        "page": 1,
                    },
                    token=access_token,
                    stop_on_unexpected=False,
                )

                if search and isinstance(search.body, dict):
                    search_body = search.body

            song_payload = build_song_payload(search_body)

            created = call(
                client,
                "POST",
                "/repertoire/entries",
                expected=(200, 201),
                payload=song_payload,
                token=access_token,
            )
            created_body = require_body(created, "create repertoire entry")

            entry_id = created_body.get("id")
            if not isinstance(entry_id, str) or not entry_id:
                raise LocalFlowError(
                    "Created repertoire entry did not include an id."
                )

            call(
                client,
                "PATCH",
                f"/repertoire/entries/{entry_id}",
                expected=200,
                payload={"proficiency": "practicing"},
                token=access_token,
            )

            call(
                client,
                "GET",
                "/repertoire/entries",
                expected=200,
                token=access_token,
            )

            call(
                client,
                "DELETE",
                f"/repertoire/entries/{entry_id}",
                expected=204,
                token=access_token,
            )

            call(
                client,
                "GET",
                "/repertoire/entries",
                expected=200,
                token=access_token,
            )

            call(
                client,
                "POST",
                "/auth/logout",
                expected=204,
                token=access_token,
            )

            call(
                client,
                "GET",
                "/me",
                expected=401,
                token=access_token,
                stop_on_unexpected=False,
            )

            if RUN_GOOGLE_STUB:
                google = call(
                    client,
                    "POST",
                    "/auth/google-stub",
                    expected=200,
                    payload={"intent": GOOGLE_STUB_INTENT},
                    stop_on_unexpected=False,
                )

                if google:
                    google_token = auth_token(require_body(google, "google stub"))

                    call(
                        client,
                        "GET",
                        "/me",
                        expected=200,
                        token=google_token,
                    )

                    call(
                        client,
                        "POST",
                        "/auth/logout",
                        expected=204,
                        token=google_token,
                    )

    except LocalFlowError as exc:
        print(f"\nFAILED: {exc}")
        return 1

    print("\nLocal API flow completed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
