import requests
import psycopg2
import time

conn = psycopg2.connect("dbname=aspire_db user=aspire_user host=localhost port=5432")
cur = conn.cursor()

# Clean up any previous test state for cleanliness
cur.execute("DELETE FROM assessments;")
cur.execute("DELETE FROM skills;")
conn.commit()

# Insert skills
cur.execute("INSERT INTO skills (id, code, name, category) VALUES (1, 'T1', 'Test 1', 'Test'), (2, 'T2', 'Test 2', 'Test'), (3, 'T3', 'Test 3', 'Test'), (4, 'T4', 'Test 4', 'Test'), (5, 'T5', 'Test 5', 'Test')")

# User 1 is learner (from seed)
# Insert cases
# CASE 1: current=3.0, verified=NULL, target=5.0 -> Expected gap: 2.0
cur.execute("INSERT INTO assessments (user_id, skill_id, current_level, target_level, verified_level, updated_at) VALUES (1, 1, 3.0, 5.0, NULL, NOW());")

# CASE 2: current=3.0, verified=4.0, target=5.0 -> Expected gap: 1.0
cur.execute("INSERT INTO assessments (user_id, skill_id, current_level, target_level, verified_level, updated_at) VALUES (1, 2, 3.0, 5.0, 4.0, NOW());")

# CASE 3: current=4.5, verified=3.5, target=5.0 -> Expected gap: 1.5
cur.execute("INSERT INTO assessments (user_id, skill_id, current_level, target_level, verified_level, updated_at) VALUES (1, 3, 4.5, 5.0, 3.5, NOW());")

# CASE 4: current=4.0, verified=5.0, target=5.0 -> Expected gap: 0
cur.execute("INSERT INTO assessments (user_id, skill_id, current_level, target_level, verified_level, updated_at) VALUES (1, 4, 4.0, 5.0, 5.0, NOW());")

# CASE 5: current=4.0, verified=NULL, target=3.0 -> Expected gap: 0
cur.execute("INSERT INTO assessments (user_id, skill_id, current_level, target_level, verified_level, updated_at) VALUES (1, 5, 4.0, 3.0, NULL, NOW());")

conn.commit()
cur.close()
conn.close()

# Test APIs
learner_token = requests.post("http://localhost:8000/api/v1/auth/login", json={"email": "learner@aspireos.example.com", "password": "ChangeMe123!"}).json()["access_token"]
admin_token = requests.post("http://localhost:8000/api/v1/auth/login", json={"email": "admin@aspireos.example.com", "password": "ChangeMe123!"}).json()["access_token"]

print("--- LEARNER SKILL GAPS ---")
r = requests.get("http://localhost:8000/api/v1/skill-gaps", headers={"Authorization": f"Bearer {learner_token}"})
for g in r.json():
    print(f"{g['skill']} -> Gap: {g['gap']}")

print("\n--- ADMIN ANALYTICS ---")
r2 = requests.get("http://localhost:8000/api/v1/analytics/skill-gaps", headers={"Authorization": f"Bearer {admin_token}"})
for a in r2.json():
    print(f"{a['skill_name']} -> Gap: {a['average_gap']}")
