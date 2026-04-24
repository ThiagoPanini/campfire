from __future__ import annotations

import main.handler as handler_module


def test_health_route_returns_200():
    response = handler_module.lambda_handler(
        {"rawPath": "/health", "requestContext": {"http": {"method": "GET"}}},
        None,
    )
    assert response["statusCode"] == 200


def test_unknown_route_returns_404():
    response = handler_module.lambda_handler(
        {"rawPath": "/unknown-route", "requestContext": {"http": {"method": "GET"}}},
        None,
    )
    assert response["statusCode"] == 404


def test_me_route_returns_401_without_auth():
    response = handler_module.lambda_handler(
        {"rawPath": "/me", "requestContext": {"http": {"method": "GET"}}},
        None,
    )
    assert response["statusCode"] == 401


def test_me_preferences_get_returns_401_without_auth():
    response = handler_module.lambda_handler(
        {"rawPath": "/me/preferences", "requestContext": {"http": {"method": "GET"}}},
        None,
    )
    assert response["statusCode"] == 401


def test_me_preferences_put_returns_401_without_auth():
    response = handler_module.lambda_handler(
        {"rawPath": "/me/preferences", "requestContext": {"http": {"method": "PUT"}}},
        None,
    )
    assert response["statusCode"] == 401


def test_me_onboarding_patch_returns_401_without_auth():
    response = handler_module.lambda_handler(
        {"rawPath": "/me/onboarding", "requestContext": {"http": {"method": "PATCH"}}},
        None,
    )
    assert response["statusCode"] == 401


def test_post_to_me_returns_404():
    response = handler_module.lambda_handler(
        {"rawPath": "/me", "requestContext": {"http": {"method": "POST"}}},
        None,
    )
    assert response["statusCode"] == 404
