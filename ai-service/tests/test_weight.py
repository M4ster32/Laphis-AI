"""
LAPHIS — Weight Tracking Tests
"""
from datetime import date


class TestWeightCreate:
    def test_add_weight(self, client, auth_token):
        token, _ = auth_token
        resp = client.post(f"/weight?token={token}", json={
            "weight_kg": 75.5,
        })
        assert resp.status_code == 200
        assert resp.json()["weight_kg"] == 75.5

    def test_upsert_same_day(self, client, auth_token):
        token, _ = auth_token
        client.post(f"/weight?token={token}", json={"weight_kg": 75})
        resp = client.post(f"/weight?token={token}", json={"weight_kg": 74})
        assert resp.status_code == 200
        assert resp.json()["weight_kg"] == 74


class TestWeightRead:
    def test_list_empty(self, client, auth_token):
        token, _ = auth_token
        resp = client.get(f"/weight?token={token}")
        assert resp.status_code == 200
        assert resp.json() == []

    def test_list_after_add(self, client, auth_token):
        token, _ = auth_token
        client.post(f"/weight?token={token}", json={"weight_kg": 80})
        resp = client.get(f"/weight?token={token}")
        assert resp.status_code == 200
        assert len(resp.json()) >= 1

    def test_stats(self, client, auth_token):
        token, _ = auth_token
        client.post(f"/weight?token={token}", json={"weight_kg": 80})
        resp = client.get(f"/weight/stats?token={token}")
        assert resp.status_code == 200
        assert isinstance(resp.json(), dict)


class TestWeightDelete:
    def test_delete_weight(self, client, auth_token):
        token, _ = auth_token
        create = client.post(f"/weight?token={token}", json={"weight_kg": 90})
        w_id = create.json()["id"]
        resp = client.delete(f"/weight/{w_id}?token={token}")
        assert resp.status_code == 200

    def test_delete_nonexistent(self, client, auth_token):
        token, _ = auth_token
        resp = client.delete(f"/weight/99999?token={token}")
        assert resp.status_code == 404
