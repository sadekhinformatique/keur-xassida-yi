#!/usr/bin/env python
"""
Script de configuration complète Supabase :
1. Exécute le schéma SQL (tables, index, RLS)
2. Crée les buckets Storage
3. Configure Realtime
4. Crée le superadmin initial
"""
import os
import sys
import json
import requests
from pathlib import Path

# Load .env
env_path = Path(__file__).parent / '.env'
if env_path.exists():
    for line in env_path.read_text().splitlines():
        if '=' in line and not line.startswith('#'):
            k, v = line.split('=', 1)
            os.environ[k.strip()] = v.strip()

SUPABASE_URL = os.environ.get('SUPABASE_URL', 'https://jfutcdemqkleebjicxpb.supabase.co')
SUPABASE_SERVICE_ROLE = os.environ.get('SUPABASE_SERVICE_ROLE')
PROJECT_REF = SUPABASE_URL.split('https://')[1].split('.')[0]
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}"

HEADERS = {
    'Authorization': f"Bearer {SUPABASE_SERVICE_ROLE}",
    'Content-Type': 'application/json',
}

print(f"*** Configuration Supabase - Projet: {PROJECT_REF}")


def step(msg):
    print(f"\n{'='*60}")
    print(f"  {msg}")
    print(f"{'='*60}")


def execute_sql(sql: str):
    """Execute SQL via Supabase Management API"""
    url = f"{API_URL}/database/query"
    payload = {"query": sql}
    try:
        r = requests.post(url, headers=HEADERS, json=payload, timeout=30)
        if r.status_code == 200:
            print(f"  * SQL exécuté")
            return True
        else:
            print(f"  *️  {r.text[:200]}")
            return False
    except Exception as e:
        print(f"  * Erreur: {e}")
        return False


def create_bucket(name: str, public: bool = True):
    """Create Storage bucket"""
    url = f"{API_URL}/storage/buckets"
    payload = {
        "id": name,
        "name": name,
        "public": public,
        "file_size_limit": 5242880,  # 5MB
        "allowed_mime_types": ["image/jpeg", "image/png", "image/webp", "image/gif"],
    }
    try:
        r = requests.post(url, headers=HEADERS, json=payload, timeout=15)
        if r.status_code in (200, 201):
            print(f"  * Bucket '{name}' créé")
        elif r.status_code == 409:
            print(f"  ℹ️  Bucket '{name}' existe déjà")
        else:
            print(f"  *️  {r.text[:200]}")
    except Exception as e:
        print(f"  * {e}")


def enable_realtime(table: str):
    """Enable Realtime for a table"""
    url = f"{API_URL}/realtime"
    payload = {"table": table}
    try:
        r = requests.post(url, headers=HEADERS, json=payload, timeout=15)
        if r.status_code in (200, 201):
            print(f"  * Realtime activé pour '{table}'")
        else:
            print(f"  *️  {r.text[:200]}")
    except Exception as e:
        print(f"  * {e}")


def create_admin_user():
    """Create initial admin user directly via Supabase Auth"""
    url = f"{SUPABASE_URL}/auth/v1/admin/users"
    headers = {
        'apikey': os.environ.get('SUPABASE_KEY'),
        'Authorization': f"Bearer {SUPABASE_SERVICE_ROLE}",
        'Content-Type': 'application/json',
    }
    payload = {
        "email": "admin@rh.com",
        "password": "admin123",
        "email_confirm": True,
        "user_metadata": {
            "first_name": "Admin",
            "last_name": "RH",
            "role": "ADMIN",
        }
    }
    try:
        r = requests.post(url, headers=headers, json=payload, timeout=15)
        if r.status_code in (200, 201):
            data = r.json()
            uid = data.get('id', '')
            print(f"  * Admin créé (ID: {uid})")
            print(f"     Email: admin@rh.com / Password: admin123")

            # Also insert into auth_users table
            execute_sql(f"""
                INSERT INTO auth_users (id, username, email, password, first_name, last_name, role, is_superuser, is_staff, is_active)
                VALUES ('{uid}', 'admin', 'admin@rh.com',
                        '$2b$10$placeholder', 'Admin', 'RH', 'ADMIN', true, true, true)
                ON CONFLICT (id) DO NOTHING;
            """)
        elif r.status_code == 409:
            print(f"  ℹ️  Admin existe déjà")
        else:
            print(f"  *️  {r.text[:200]}")
    except Exception as e:
        print(f"  * {e}")


def main():
    if not SUPABASE_SERVICE_ROLE:
        print("* SUPABASE_SERVICE_ROLE non défini dans .env")
        sys.exit(1)

    # 1. Schema SQL
    step("1/5 - Création des tables et index")
    schema_path = Path(__file__).parent / 'supabase_schema.sql'
    if schema_path.exists():
        sql = schema_path.read_text()
        # Split by semicolons and execute each statement
        statements = [s.strip() for s in sql.split(';') if s.strip()]
        for stmt in statements:
            execute_sql(stmt + ';')
    else:
        print("  * supabase_schema.sql non trouvé")

    # 2. Storage buckets
    step("2/5 - Création des buckets Storage")
    for bucket in ['employees', 'company', 'avatars']:
        create_bucket(bucket, public=True)

    # 3. Realtime
    step("3/5 - Activation Realtime")
    for table in ['attendance_attendance', 'attendance_attendancelog']:
        enable_realtime(table)

    # 4. Admin user
    step("4/5 - Création utilisateur admin")
    create_admin_user()

    # 5. Company settings
    step("5/5 - Configuration initiale")
    print("  * Projet prêt !")
    
    print(f"\n{'='*60}")
    print(f"  * RÉCAPITULATIF")
    print(f"{'='*60}")
    print(f"  URL:           {SUPABASE_URL}")
    print(f"  Dashboard:     https://supabase.com/dashboard/project/{PROJECT_REF}")
    print(f"  Admin email:   admin@rh.com")
    print(f"  Admin password: admin123")
    print(f"\n  Prochaine étape : exécuter le script depuis le dossier backend :")
    print(f"  .venv\\Scripts\\python setup_supabase.py")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
