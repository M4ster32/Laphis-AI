"""
LAPHIS — Authentication Tests
Tests: register, login, email verification, password reset, token validation.
"""


class TestRegister:
    def test_register_success(self, client):
        resp = client.post("/auth/register", json={
            "email": "new@laphis.com",
            "password": "StrongPass1!",
            "goal": "manter",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["email"] == "new@laphis.com"
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["email_verified"] is False

    def test_register_duplicate_email(self, client):
        client.post("/auth/register", json={
            "email": "dup@laphis.com",
            "password": "Pass123!",
        })
        resp = client.post("/auth/register", json={
            "email": "dup@laphis.com",
            "password": "Pass123!",
        })
        assert resp.status_code == 400
        assert "já registado" in resp.json()["detail"]

    def test_register_invalid_email(self, client):
        resp = client.post("/auth/register", json={
            "email": "not-an-email",
            "password": "Pass123!",
        })
        assert resp.status_code == 422

    def test_register_missing_password(self, client):
        resp = client.post("/auth/register", json={
            "email": "x@laphis.com",
        })
        # password is required in RegisterIn
        assert resp.status_code == 422


class TestLogin:
    def test_login_success(self, client):
        # Register first
        client.post("/auth/register", json={
            "email": "login@laphis.com",
            "password": "MyPass123!",
        })
        resp = client.post("/auth/login", json={
            "email": "login@laphis.com",
            "password": "MyPass123!",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["email"] == "login@laphis.com"

    def test_login_wrong_password(self, client):
        client.post("/auth/register", json={
            "email": "wrong@laphis.com",
            "password": "CorrectPass1!",
        })
        resp = client.post("/auth/login", json={
            "email": "wrong@laphis.com",
            "password": "WrongPassword!",
        })
        assert resp.status_code == 401

    def test_login_nonexistent_email(self, client):
        resp = client.post("/auth/login", json={
            "email": "ghost@laphis.com",
            "password": "Pass123!",
        })
        assert resp.status_code == 401


class TestEmailVerification:
    def test_verify_email_invalid_code(self, client):
        client.post("/auth/register", json={
            "email": "verify@laphis.com",
            "password": "Pass123!",
        })
        resp = client.post("/auth/verify-email", json={
            "email": "verify@laphis.com",
            "code": "000000",
        })
        assert resp.status_code == 400

    def test_verify_email_correct_code(self, client, db_session):
        """Register, fetch code from DB, verify."""
        client.post("/auth/register", json={
            "email": "code@laphis.com",
            "password": "Pass123!",
        })
        from src.core.models import User
        user = db_session.query(User).filter(User.email == "code@laphis.com").first()
        code = user.verification_code

        resp = client.post("/auth/verify-email", json={
            "email": "code@laphis.com",
            "code": code,
        })
        assert resp.status_code == 200
        assert resp.json()["verified"] is True

    def test_resend_code(self, client):
        client.post("/auth/register", json={
            "email": "resend@laphis.com",
            "password": "Pass123!",
        })
        resp = client.post("/auth/resend-code", json={
            "email": "resend@laphis.com",
        })
        assert resp.status_code == 200


class TestPasswordReset:
    def test_forgot_password_existing_email(self, client):
        client.post("/auth/register", json={
            "email": "forgot@laphis.com",
            "password": "Pass123!",
        })
        resp = client.post("/auth/forgot-password", json={
            "email": "forgot@laphis.com",
        })
        assert resp.status_code == 200

    def test_forgot_password_nonexistent_email(self, client):
        """Should still return 200 (don't leak email existence)."""
        resp = client.post("/auth/forgot-password", json={
            "email": "nonexistent@laphis.com",
        })
        assert resp.status_code == 200

    def test_reset_password_flow(self, client, db_session):
        client.post("/auth/register", json={
            "email": "reset@laphis.com",
            "password": "OldPass123!",
        })
        client.post("/auth/forgot-password", json={
            "email": "reset@laphis.com",
        })

        from src.core.models import User
        user = db_session.query(User).filter(User.email == "reset@laphis.com").first()
        db_session.refresh(user)
        code = user.reset_code

        resp = client.post("/auth/reset-password", json={
            "email": "reset@laphis.com",
            "code": code,
            "new_password": "NewPass456!",
        })
        assert resp.status_code == 200

        # Login with new password
        resp = client.post("/auth/login", json={
            "email": "reset@laphis.com",
            "password": "NewPass456!",
        })
        assert resp.status_code == 200


class TestTokenValidation:
    def test_invalid_token_rejected(self, client):
        resp = client.get("/profile/me?token=invalid.jwt.token")
        assert resp.status_code == 401

    def test_no_token_rejected(self, client):
        resp = client.get("/profile/me")
        assert resp.status_code == 401

    def test_valid_token_works(self, client, auth_token):
        token, _ = auth_token
        # No profile yet, but token should be valid (404, not 401)
        resp = client.get(f"/profile/me?token={token}")
        assert resp.status_code == 404  # profile not found, but auth passed
