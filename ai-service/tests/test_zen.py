"""
LAPHIS — Zen (Mindfulness) Tests
"""


class TestZenCreate:
    def test_create_meditation(self, client, auth_token):
        token, _ = auth_token
        resp = client.post(f"/zen?token={token}", json={
            "type": "meditation",
            "duration_min": 15,
            "mood_before": "stressed",
            "mood_after": "calm",
            "notes": "Sessão matinal",
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["type"] == "meditation"
        assert data["duration_min"] == 15

    def test_create_breathing(self, client, auth_token):
        token, _ = auth_token
        resp = client.post(f"/zen?token={token}", json={
            "type": "breathing",
            "duration_min": 5,
            "mood_before": "anxious",
        })
        assert resp.status_code == 200


class TestZenRead:
    def test_list_empty(self, client, auth_token):
        token, _ = auth_token
        resp = client.get(f"/zen?token={token}")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_after_create(self, client, auth_token):
        token, _ = auth_token
        client.post(f"/zen?token={token}", json={
            "type": "meditation",
            "duration_min": 10,
            "mood_before": "neutral",
        })
        resp = client.get(f"/zen?token={token}")
        assert resp.status_code == 200
        assert len(resp.json()) == 1

    def test_stats(self, client, auth_token):
        token, _ = auth_token
        client.post(f"/zen?token={token}", json={
            "type": "meditation",
            "duration_min": 20,
            "mood_before": "happy",
        })
        resp = client.get(f"/zen/stats?token={token}")
        assert resp.status_code == 200
        assert isinstance(resp.json(), dict)


class TestZenDelete:
    def test_delete_session(self, client, auth_token):
        token, _ = auth_token
        created = client.post(f"/zen?token={token}", json={
            "type": "meditation",
            "duration_min": 10,
            "mood_before": "calm",
        })
        zen_id = created.json()["id"]
        resp = client.delete(f"/zen/{zen_id}?token={token}")
        assert resp.status_code == 200

    def test_delete_nonexistent(self, client, auth_token):
        token, _ = auth_token
        resp = client.delete(f"/zen/99999?token={token}")
        assert resp.status_code == 404
