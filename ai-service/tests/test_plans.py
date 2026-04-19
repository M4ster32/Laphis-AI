"""
LAPHIS — Plans Tests (CRUD only, skipping AI generation)
"""


class TestPlanSave:
    def test_save_plan(self, client, auth_with_profile):
        token, _, profile_id = auth_with_profile
        resp = client.post(f"/plans/save?token={token}", json={
            "profile_id": profile_id,
            "type": "training",
            "title": "Plano Força",
            "content_json": {"days": [{"name": "Dia 1", "exercises": []}]},
        })
        assert resp.status_code == 200
        data = resp.json()
        assert data["title"] == "Plano Força"
        assert data["type"] == "training"


class TestPlanRead:
    def _create_plan(self, client, token, profile_id, title="Test Plan"):
        return client.post(f"/plans/save?token={token}", json={
            "profile_id": profile_id,
            "type": "training",
            "title": title,
            "content_json": {"days": []},
        })

    def test_list_plans(self, client, auth_with_profile):
        token, _, profile_id = auth_with_profile
        self._create_plan(client, token, profile_id, "Plan A")
        self._create_plan(client, token, profile_id, "Plan B")
        resp = client.get(f"/plans/list/{profile_id}?token={token}")
        assert resp.status_code == 200
        assert len(resp.json()) >= 2

    def test_plan_detail(self, client, auth_with_profile):
        token, _, profile_id = auth_with_profile
        created = self._create_plan(client, token, profile_id)
        plan_id = created.json()["id"]
        resp = client.get(f"/plans/detail/{plan_id}?token={token}")
        assert resp.status_code == 200
        assert resp.json()["id"] == plan_id

    def test_detail_nonexistent(self, client, auth_with_profile):
        token, _, _ = auth_with_profile
        resp = client.get(f"/plans/detail/99999?token={token}")
        assert resp.status_code == 404


class TestPlanUpdate:
    def test_update_plan(self, client, auth_with_profile):
        token, _, profile_id = auth_with_profile
        created = client.post(f"/plans/save?token={token}", json={
            "profile_id": profile_id,
            "type": "training",
            "title": "Original",
            "content_json": {"days": []},
        })
        plan_id = created.json()["id"]
        resp = client.put(f"/plans/{plan_id}?token={token}", json={
            "title": "Updated Title",
        })
        assert resp.status_code == 200
        assert resp.json()["title"] == "Updated Title"


class TestPlanDuplicate:
    def test_duplicate_plan(self, client, auth_with_profile):
        token, _, profile_id = auth_with_profile
        created = client.post(f"/plans/save?token={token}", json={
            "profile_id": profile_id,
            "type": "nutrition",
            "title": "Dieta Base",
            "content_json": {"meals": []},
        })
        plan_id = created.json()["id"]
        resp = client.post(f"/plans/{plan_id}/duplicate?token={token}")
        assert resp.status_code == 200
        dup = resp.json()
        assert dup["id"] != plan_id
        assert "Dieta Base" in dup["title"]


class TestPlanDelete:
    def test_delete_plan(self, client, auth_with_profile):
        token, _, profile_id = auth_with_profile
        created = client.post(f"/plans/save?token={token}", json={
            "profile_id": profile_id,
            "type": "training",
            "title": "ToDelete",
            "content_json": {},
        })
        plan_id = created.json()["id"]
        resp = client.delete(f"/plans/{plan_id}?token={token}")
        assert resp.status_code == 200

    def test_delete_nonexistent(self, client, auth_with_profile):
        token, _, _ = auth_with_profile
        resp = client.delete(f"/plans/99999?token={token}")
        assert resp.status_code == 404
