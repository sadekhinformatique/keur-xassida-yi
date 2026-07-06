"""
Supabase Database Service
Service de données complet utilisant supabase-py (postgrest)
Pour utilisation en production via l'API Supabase
"""
import os
import uuid
import json
import logging
from datetime import date, datetime, time, timedelta
from decimal import Decimal
from typing import Any

from supabase_config import get_supabase, get_supabase_admin

logger = logging.getLogger(__name__)

USE_SUPABASE = os.environ.get('USE_SUPABASE', 'false').lower() == 'true'

TABLE_MAP = {
    'employees': 'employees_employee',
    'departments': 'employees_department',
    'services': 'employees_service',
    'schedules': 'schedules_schedule',
    'employee_schedules': 'schedules_employeeschedule',
    'attendance': 'attendance_attendance',
    'attendance_logs': 'attendance_attendancelog',
    'qr_sessions': 'qrcode_app_qrsession',
    'company_settings': 'settings_app_companysettings',
    'users': 'auth_users',
}


def _serialize(obj):
    if isinstance(obj, (date, datetime)):
        return obj.isoformat()
    if isinstance(obj, time):
        return obj.strftime('%H:%M:%S')
    if isinstance(obj, Decimal):
        return float(obj)
    if isinstance(obj, uuid.UUID):
        return str(obj)
    return obj


def _table(name: str):
    sb = get_supabase_admin()
    return sb.table(TABLE_MAP.get(name, name))


def _execute_with_auth(method, *args, **kwargs):
    """Execute a Supabase query with service_role auth"""
    try:
        sb = get_supabase_admin()  # Uses service_role for full access
        return method(sb, *args, **kwargs)
    except Exception as e:
        logger.error(f"Supabase query error: {e}")
        raise


# ==================== EMPLOYEES ====================

def employees_list(filters: dict = None, search: str = None, page: int = 1, page_size: int = 20) -> dict:
    sb = get_supabase_admin()
    query = sb.table(TABLE_MAP['employees']).select(
        '*, departments:department_id(name), services:service_id(name)',
        count='exact'
    )

    if filters:
        for key, val in filters.items():
            if val:
                query = query.eq(key, val)
    if search:
        query = query.or_(f"nom.ilike.%{search}%,prenom.ilike.%{search}%,matricule.ilike.%{search}%")

    offset = (page - 1) * page_size
    result = query.range(offset, offset + page_size - 1).execute()

    return {
        'data': result.data,
        'count': result.count,
        'page': page,
        'page_size': page_size,
    }


def employees_get(id: int) -> dict | None:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['employees']).select(
        '*, departments:department_id(*), services:service_id(*)'
    ).eq('id', id).execute()
    return result.data[0] if result.data else None


def employees_create(data: dict) -> dict:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['employees']).insert(data).execute()
    return result.data[0] if result.data else None


def employees_update(id: int, data: dict) -> dict:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['employees']).update(data).eq('id', id).execute()
    return result.data[0] if result.data else None


def employees_delete(id: int) -> bool:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['employees']).delete().eq('id', id).execute()
    return len(result.data) > 0


def employees_count_active() -> int:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['employees']).select('id', count='exact').eq('statut', 'ACTIF').execute()
    return result.count or 0


# ==================== DEPARTMENTS ====================

def departments_list() -> list:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['departments']).select('*').order('name').execute()
    return result.data


def departments_create(data: dict) -> dict:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['departments']).insert(data).execute()
    return result.data[0]


def departments_delete(id: int) -> bool:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['departments']).delete().eq('id', id).execute()
    return len(result.data) > 0


# ==================== SERVICES ====================

def services_list(department_id: int = None) -> list:
    sb = get_supabase_admin()
    query = sb.table(TABLE_MAP['services']).select('*')
    if department_id:
        query = query.eq('department_id', department_id)
    result = query.order('name').execute()
    return result.data


# ==================== ATTENDANCE ====================

def attendance_list(filters: dict = None, page: int = 1, page_size: int = 50) -> dict:
    sb = get_supabase_admin()
    query = sb.table(TABLE_MAP['attendance']).select(
        '*, employees:employee_id(nom, prenom, matricule, photo, departments:department_id(name))',
        count='exact'
    )
    if filters:
        for key, val in filters.items():
            if val:
                query = query.eq(key, val)

    offset = (page - 1) * page_size
    result = query.range(offset, offset + page_size - 1).order('date', desc=True).order('check_in', desc=True).execute()
    return {'data': result.data, 'count': result.count}


def attendance_today() -> list:
    today = date.today().isoformat()
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['attendance']).select(
        '*, employees:employee_id(nom, prenom, matricule, photo, departments:department_id(name))'
    ).eq('date', today).order('check_in', desc=True).execute()
    return result.data


def attendance_check_in(employee_id: int, data: dict) -> dict:
    sb = get_supabase_admin()
    now = datetime.utcnow().isoformat()
    today = date.today().isoformat()

    # Check for duplicate
    existing = sb.table(TABLE_MAP['attendance']).select('id').eq('employee_id', employee_id).eq('date', today).execute()
    if existing.data:
        raise ValueError("Pointage déjà effectué aujourd'hui")

    record = {
        'employee_id': employee_id,
        'date': today,
        'check_in': now,
        'status': data.get('status', 'PRESENT'),
        'gps_latitude': data.get('gps_latitude'),
        'gps_longitude': data.get('gps_longitude'),
        'device_info': data.get('device_info', ''),
        'ip_address': data.get('ip_address'),
        'check_in_method': 'QR_CODE',
    }
    result = sb.table(TABLE_MAP['attendance']).insert(record).execute()
    att = result.data[0]

    log = sb.table(TABLE_MAP['attendance_logs']).insert({
        'attendance_id': att['id'],
        'action': 'CHECK_IN',
        'details': json.dumps({'method': 'QR_CODE'}),
    }).execute()

    return att


def attendance_check_out(attendance_id: int, data: dict) -> dict:
    sb = get_supabase_admin()
    now = datetime.utcnow().isoformat()
    update = {'check_out': now}
    if data.get('gps_latitude'):
        update['gps_latitude'] = data['gps_latitude']
    if data.get('gps_longitude'):
        update['gps_longitude'] = data['gps_longitude']

    result = sb.table(TABLE_MAP['attendance']).update(update).eq('id', attendance_id).execute()

    sb.table(TABLE_MAP['attendance_logs']).insert({
        'attendance_id': attendance_id,
        'action': 'CHECK_OUT',
        'details': json.dumps({'time': now}),
    }).execute()

    return result.data[0] if result.data else None


def attendance_dashboard() -> dict:
    sb = get_supabase_admin()
    today = date.today().isoformat()

    total = employees_count_active()

    today_att = sb.table(TABLE_MAP['attendance']).select('status').eq('date', today).execute()
    present = sum(1 for a in today_att.data if a['status'] == 'PRESENT')
    late = sum(1 for a in today_att.data if a['status'] == 'LATE')
    early = sum(1 for a in today_att.data if a['status'] == 'EARLY_LEAVE')
    absent = max(0, total - present - late - early)

    # Live
    live = sb.table(TABLE_MAP['attendance']).select(
        '*, employees:employee_id(nom, prenom, matricule, photo, departments:department_id(name))'
    ).eq('date', today).is_('check_out', 'null').order('check_in', desc=True).limit(10).execute()

    # Weekly
    week_data = []
    from datetime import timedelta
    for i in range(7):
        day = (date.today() - timedelta(days=6 - i)).isoformat()
        count = sb.table(TABLE_MAP['attendance']).select('id', count='exact').eq('date', day).execute()
        week_data.append({'date': day, 'count': count.count or 0})

    return {
        'total_employees': total,
        'present': present,
        'absent': absent,
        'late': late,
        'early_leaves': early,
        'live_pointages': live.data,
        'weekly_data': week_data,
    }


# ==================== QR SESSIONS ====================

def qr_create(duration_seconds: int = 30, generated_by_id: int = None) -> dict:
    sb = get_supabase_admin()
    now = datetime.utcnow()
    valid_until = (now + timedelta(seconds=duration_seconds)).isoformat()

    # Deactivate old active sessions
    sb.table(TABLE_MAP['qr_sessions']).update({'is_active': False}).eq('generated_by_id', generated_by_id).eq('is_active', True).execute()

    token = str(uuid.uuid4())
    from cryptography.fernet import Fernet
    import hashlib, base64
    from django.conf import settings
    key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
    f = Fernet(base64.urlsafe_b64encode(key))
    signature = f.encrypt(json.dumps({'token': token, 'date': now.isoformat(), 'valid_until': valid_until}).encode()).decode()

    result = sb.table(TABLE_MAP['qr_sessions']).insert({
        'token': token,
        'generated_by_id': generated_by_id,
        'valid_from': now.isoformat(),
        'valid_until': valid_until,
        'is_active': True,
        'signature': signature,
    }).execute()

    session = result.data[0]
    session['qr_data'] = {'token': token, 'date': now.isoformat(), 'signature': signature}
    return session


def qr_verify(token: str, signature: str, date_str: str) -> bool:
    import hashlib, base64, json
    from cryptography.fernet import Fernet
    from django.conf import settings
    try:
        key = hashlib.sha256(settings.SECRET_KEY.encode()).digest()
        f = Fernet(base64.urlsafe_b64encode(key))
        decrypted = json.loads(f.decrypt(signature.encode()).decode())
        if decrypted['token'] != token or decrypted['date'] != date_str:
            return False
    except Exception:
        return False
    return True


# ==================== SCHEDULES ====================

def schedules_list() -> list:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['schedules']).select('*').order('name').execute()
    return result.data


def schedules_create(data: dict) -> dict:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['schedules']).insert(data).execute()
    return result.data[0]


def schedules_update(id: int, data: dict) -> dict:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['schedules']).update(data).eq('id', id).execute()
    return result.data[0]


def schedules_delete(id: int) -> bool:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['schedules']).delete().eq('id', id).execute()
    return len(result.data) > 0


# ==================== COMPANY SETTINGS ====================

def settings_get() -> dict:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['company_settings']).select('*').limit(1).execute()
    if result.data:
        return result.data[0]
    # Create default
    result = sb.table(TABLE_MAP['company_settings']).insert({'company_name': 'Mon Entreprise'}).execute()
    return result.data[0]


def settings_update(data: dict) -> dict:
    sb = get_supabase_admin()
    settings = settings_get()
    result = sb.table(TABLE_MAP['company_settings']).update(data).eq('id', settings['id']).execute()
    return result.data[0]


# ==================== USERS (AUTH) ====================

def users_list() -> list:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['users']).select('id, username, email, first_name, last_name, role, phone, avatar, is_active').execute()
    return result.data


def users_get(id: int) -> dict | None:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['users']).select('*').eq('id', id).execute()
    return result.data[0] if result.data else None


def users_create(data: dict) -> dict:
    sb = get_supabase_admin()
    from django.contrib.auth.hashers import make_password
    data['password'] = make_password(data.pop('password'))
    result = sb.table(TABLE_MAP['users']).insert(data).execute()
    return result.data[0]


# ==================== ATTENDANCE LOGS ====================

def attendance_logs(limit: int = 50) -> list:
    sb = get_supabase_admin()
    result = sb.table(TABLE_MAP['attendance_logs']).select(
        '*, attendance:attendance_id(employee_id)'
    ).order('timestamp', desc=True).limit(limit).execute()
    return result.data
