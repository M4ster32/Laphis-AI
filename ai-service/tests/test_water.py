"""
LAPHIS — Water Tracking Tests
"""


class TestWaterAdd:
    def test_add_water(self, client, auth_token):
        token, _ = auth_token
        resp = client.post(f"/water/add?token={token}", json={"glasses": 1})
        assert resp.status_code == 200
        data = resp.json()
        assert data["glasses"] == 1
        assert data["ml_total"] == 250

    def test_add_multiple_glasses(self, client, auth_token):
        token, _ = auth_token
        client.post(f"/water/add?token={token}", json={"glasses": 1})
        client.post(f"/water/add?token={token}", json={"glasses": 1})
        resp = client.post(f"/water/add?token={token}", json={"glasses": 1})
        assert resp.json()["glasses"] == 3


class TestWaterRemove:
    def test_remove_water(self, client, auth_token):
        token, _ = auth_token
        client.post(f"/water/add?token={token}", json={"glasses": 2})
        resp = client.post(f"/water/remove?token={token}")
        assert resp.status_code == 200
        assert resp.json()["glasses"] == 1

    def test_remove_below_zero(self, client, auth_token):
        token, _ = auth_token
        resp = client.post(f"/water/remove?token={token}")
        assert resp.status_code == 200
        assert resp.json()["glasses"] == 0


class TestWaterRead:
    def test_today_empty(self, client, auth_token):
        token, _ = auth_token
        resp = client.get(f"/water/today?token={token}")
        assert resp.status_code == 200
        data = resp.json()
        assert data["glasses"] == 0

    def test_history(self, client, auth_token):
        token, _ = auth_token
        client.post(f"/water/add?token={token}", json={"glasses": 1})
        resp = client.get(f"/water/history?token={token}")
        assert resp.status_code == 200
        assert isinstance(resp.json(), list)
