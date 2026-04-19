"""
LAPHIS — Logs (Workouts + Meals) Tests
"""


class TestLogCreate:
    def test_create_workout_log(self, client, auth_with_profile):
        token, _, profile_id = auth_with_profile
        resp = client.post(f"/logs?token={token}", json={
            "log_type": "treino",
            "description": "Supino, Flexões",
            "duration_min": 45,
            "calories": 300,
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["log_type"] == "treino"
        assert data["description"] == "Supino, Flexões"

    def test_create_meal_log(self, client, auth_with_profile):
        token, _, profile_id = auth_with_profile
        resp = client.post(f"/logs?token={token}", json={
            "log_type": "refeicao",
            "meal_type": "almoço",
            "foods": "Frango grelhado com arroz",
            "calories": 500,
        })
        assert resp.status_code == 200
        assert resp.json()["log_type"] == "refeicao"


class TestLogRead:
    def test_list_logs_empty(self, client, auth_with_profile):
        token, _, _ = auth_with_profile
        resp = client.get(f"/logs?token={token}")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_logs_after_create(self, client, auth_with_profile):
        token, _, _ = auth_with_profile
        client.post(f"/logs?token={token}", json={
            "log_type": "treino",
            "description": "Run",
        })
        resp = client.get(f"/logs?token={token}")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_filter_by_log_type(self, client, auth_with_profile):
        token, _, _ = auth_with_profile
        client.post(f"/logs?token={token}", json={
            "log_type": "treino",
            "description": "Run",
        })
        client.post(f"/logs?token={token}", json={
            "log_type": "refeicao",
            "foods": "Lunch",
        })
        resp = client.get(f"/logs?token={token}&log_type=treino")
        assert resp.status_code == 200
        logs = resp.json()
        assert all(l["log_type"] == "treino" for l in logs)


class TestLogUpdate:
    def test_update_workout(self, client, auth_with_profile):
        token, _, _ = auth_with_profile
        create = client.post(f"/logs?token={token}", json={
            "log_type": "treino",
            "description": "Old description",
        })
        log_id = create.json()["id"]
        resp = client.put(f"/logs/{log_id}?token={token}", json={
            "log_type": "treino",
            "description": "New description",
        })
        assert resp.status_code == 200
        assert resp.json()["description"] == "New description"


class TestLogDelete:
    def test_delete_log(self, client, auth_with_profile):
        token, _, _ = auth_with_profile
        create = client.post(f"/logs?token={token}", json={
            "log_type": "treino",
            "description": "ToDelete",
        })
        log_id = create.json()["id"]
        resp = client.delete(f"/logs/{log_id}?token={token}&log_type=treino")
        assert resp.status_code == 200

        # Confirm deleted
        logs = client.get(f"/logs?token={token}").json()
        assert all(l["id"] != log_id for l in logs)

    def test_delete_nonexistent_log(self, client, auth_with_profile):
        token, _, _ = auth_with_profile
        resp = client.delete(f"/logs/99999?token={token}&log_type=treino")
        assert resp.status_code == 404
