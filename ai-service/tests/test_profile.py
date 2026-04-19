"""
LAPHIS — Profile Tests
"""


class TestProfileCreate:
    def test_create_profile(self, client, auth_token):
        token, user_id = auth_token
        resp = client.post(f"/profile?token={token}", json={
            "name": "João",
            "age": 25,
            "sex": "masculino",
            "height_cm": 175,
            "weight_kg": 70,
            "goal": "perder_gordura",
            "level": "intermedio",
            "days_per_week": 4,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["name"] == "João"
        assert data["age"] == 25

    def test_create_profile_minimal(self, client, auth_token):
        token, _ = auth_token
        resp = client.post(f"/profile?token={token}", json={
            "name": "A",
            "age": 20,
            "sex": "masculino",
            "height_cm": 170,
            "weight_kg": 70,
            "goal": "manter",
            "level": "iniciante",
            "days_per_week": 3,
        })
        assert resp.status_code == 200

    def test_upsert_profile(self, client, auth_with_profile):
        token, user_id, _ = auth_with_profile
        resp = client.post(f"/profile?token={token}", json={
            "name": "Updated",
            "age": 30,
            "sex": "feminino",
            "height_cm": 165,
            "weight_kg": 60,
            "goal": "ganhar_massa",
            "level": "avancado",
            "days_per_week": 5,
        })
        assert resp.status_code == 200
        assert resp.json()["name"] == "Updated"


class TestProfileRead:
    def test_get_my_profile(self, client, auth_with_profile):
        token, _, profile_id = auth_with_profile
        resp = client.get(f"/profile/me?token={token}")
        assert resp.status_code == 200
        assert resp.json()["id"] == profile_id

    def test_get_profile_by_id(self, client, auth_with_profile):
        token, _, profile_id = auth_with_profile
        resp = client.get(f"/profile/{profile_id}?token={token}")
        assert resp.status_code == 200
        assert resp.json()["id"] == profile_id

    def test_get_nonexistent_profile(self, client, auth_token):
        token, _ = auth_token
        resp = client.get(f"/profile/me?token={token}")
        assert resp.status_code == 404

    def test_get_profile_by_bad_id(self, client, auth_with_profile):
        token, _, _ = auth_with_profile
        resp = client.get(f"/profile/99999?token={token}")
        assert resp.status_code == 404


class TestProfileValidation:
    def test_age_too_low(self, client, auth_token):
        token, _ = auth_token
        resp = client.post(f"/profile?token={token}", json={
            "name": "Kid",
            "age": 5,
            "sex": "masculino",
            "height_cm": 170,
            "weight_kg": 70,
            "goal": "manter",
            "level": "iniciante",
            "days_per_week": 3,
        })
        assert resp.status_code == 422

    def test_age_too_high(self, client, auth_token):
        token, _ = auth_token
        resp = client.post(f"/profile?token={token}", json={
            "name": "Old",
            "age": 150,
            "sex": "masculino",
            "height_cm": 170,
            "weight_kg": 70,
            "goal": "manter",
            "level": "iniciante",
            "days_per_week": 3,
        })
        assert resp.status_code == 422

    def test_invalid_goal(self, client, auth_token):
        token, _ = auth_token
        resp = client.post(f"/profile?token={token}", json={
            "name": "Test",
            "age": 25,
            "sex": "masculino",
            "height_cm": 170,
            "weight_kg": 70,
            "goal": "voar",
            "level": "iniciante",
            "days_per_week": 3,
        })
        assert resp.status_code == 422
