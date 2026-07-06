-- ============================================================
-- RH Manager - Schéma Supabase
-- Exécuter dans Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. TABLES PRINCIPALES (ordre respectant les dépendances FK)

-- Utilisateurs (Django-compatible)
CREATE TABLE IF NOT EXISTS auth_users (
    id BIGSERIAL PRIMARY KEY,
    password VARCHAR(128) NOT NULL,
    last_login TIMESTAMPTZ,
    is_superuser BOOLEAN DEFAULT FALSE,
    username VARCHAR(150) UNIQUE NOT NULL,
    first_name VARCHAR(150) DEFAULT '',
    last_name VARCHAR(150) DEFAULT '',
    email VARCHAR(254) DEFAULT '',
    is_staff BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    date_joined TIMESTAMPTZ DEFAULT NOW(),
    role VARCHAR(10) NOT NULL DEFAULT 'RH' CHECK (role IN ('ADMIN', 'RH', 'MANAGER')),
    phone VARCHAR(20) DEFAULT '',
    avatar TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Départements
CREATE TABLE IF NOT EXISTS employees_department (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services
CREATE TABLE IF NOT EXISTS employees_service (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    department_id BIGINT REFERENCES employees_department(id) ON DELETE CASCADE,
    description TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(name, department_id)
);

-- Employés
CREATE TABLE IF NOT EXISTS employees_employee (
    id BIGSERIAL PRIMARY KEY,
    photo TEXT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    sexe VARCHAR(1) NOT NULL CHECK (sexe IN ('M', 'F')),
    matricule VARCHAR(20) UNIQUE NOT NULL,
    department_id BIGINT REFERENCES employees_department(id),
    service_id BIGINT REFERENCES employees_service(id),
    fonction VARCHAR(200) NOT NULL,
    telephone VARCHAR(20) NOT NULL,
    email VARCHAR(254) DEFAULT '',
    date_embauche DATE NOT NULL,
    statut VARCHAR(10) NOT NULL DEFAULT 'ACTIF' CHECK (statut IN ('ACTIF', 'INACTIF', 'CONGE', 'SUSPENDU')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id BIGINT REFERENCES auth_users(id)
);

-- Horaires
CREATE TABLE IF NOT EXISTS schedules_schedule (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    entry_time TIME NOT NULL,
    exit_time TIME NOT NULL,
    break_start TIME,
    break_end TIME,
    tolerance_minutes INTEGER DEFAULT 15,
    is_default BOOLEAN DEFAULT FALSE,
    days_of_week JSONB DEFAULT '[0,1,2,3,4]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignations horaires
CREATE TABLE IF NOT EXISTS schedules_employeeschedule (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees_employee(id) ON DELETE CASCADE,
    schedule_id BIGINT REFERENCES schedules_schedule(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pointages
CREATE TABLE IF NOT EXISTS attendance_attendance (
    id BIGSERIAL PRIMARY KEY,
    employee_id BIGINT REFERENCES employees_employee(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    status VARCHAR(15) NOT NULL DEFAULT 'PRESENT' CHECK (status IN ('PRESENT','ABSENT','LATE','EARLY_LEAVE','HOLIDAY')),
    gps_latitude DECIMAL(9,6),
    gps_longitude DECIMAL(9,6),
    device_info VARCHAR(255) DEFAULT '',
    ip_address INET,
    check_in_method VARCHAR(20) DEFAULT 'QR_CODE' CHECK (check_in_method IN ('QR_CODE','MANUAL','FACE')),
    notes TEXT DEFAULT '',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(employee_id, date)
);

-- Journal pointages
CREATE TABLE IF NOT EXISTS attendance_attendancelog (
    id BIGSERIAL PRIMARY KEY,
    attendance_id BIGINT REFERENCES attendance_attendance(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    details JSONB DEFAULT '{}'::jsonb
);

-- Sessions QR
CREATE TABLE IF NOT EXISTS qrcode_app_qrsession (
    id BIGSERIAL PRIMARY KEY,
    token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
    generated_by_id BIGINT REFERENCES auth_users(id) ON DELETE CASCADE,
    valid_from TIMESTAMPTZ DEFAULT NOW(),
    valid_until TIMESTAMPTZ NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    signature TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Paramètres entreprise
CREATE TABLE IF NOT EXISTS settings_app_companysettings (
    id BIGSERIAL PRIMARY KEY,
    company_name VARCHAR(200) NOT NULL DEFAULT 'Mon Entreprise',
    address TEXT DEFAULT '',
    logo TEXT,
    primary_color VARCHAR(7) DEFAULT '#2563eb',
    secondary_color VARCHAR(7) DEFAULT '#1e40af',
    accent_color VARCHAR(7) DEFAULT '#0ea5e9',
    notification_email VARCHAR(254) DEFAULT '',
    notification_sms BOOLEAN DEFAULT FALSE,
    auto_generate_qr BOOLEAN DEFAULT TRUE,
    qr_duration_seconds INTEGER DEFAULT 30,
    enable_gps BOOLEAN DEFAULT FALSE,
    enable_face_recognition BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. INDEX
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance_attendance(employee_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance_attendance(status);
CREATE INDEX IF NOT EXISTS idx_employee_department ON employees_employee(department_id);
CREATE INDEX IF NOT EXISTS idx_employee_statut ON employees_employee(statut);
CREATE INDEX IF NOT EXISTS idx_employee_matricule ON employees_employee(matricule);
CREATE INDEX IF NOT EXISTS idx_qr_token ON qrcode_app_qrsession(token);
CREATE INDEX IF NOT EXISTS idx_qr_active ON qrcode_app_qrsession(is_active, valid_until);
CREATE INDEX IF NOT EXISTS idx_logs_attendance ON attendance_attendancelog(attendance_id);

-- 3. ROW LEVEL SECURITY
ALTER TABLE employees_employee ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees_department ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees_service ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedules_employeeschedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_attendancelog ENABLE ROW LEVEL SECURITY;
ALTER TABLE qrcode_app_qrsession ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings_app_companysettings ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;

-- Politiques RLS (service_role a accès full, anon = rien)
CREATE POLICY "service_role full access" ON employees_employee FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role full access" ON employees_department FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role full access" ON employees_service FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role full access" ON schedules_schedule FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role full access" ON schedules_employeeschedule FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role full access" ON attendance_attendance FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role full access" ON attendance_attendancelog FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role full access" ON qrcode_app_qrsession FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role full access" ON settings_app_companysettings FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');
CREATE POLICY "service_role full access" ON auth_users FOR ALL USING (auth.jwt()->>'role' = 'service_role') WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- 4. BUCKET STORAGE
-- Créer les buckets (via Supabase Dashboard > Storage)
-- - employees : photos des employés (public)
-- - company : logo entreprise (public)
-- - avatars : photos de profil (public)

-- 5. TRIGGER updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_employee_updated_at BEFORE UPDATE ON employees_employee
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER schedules_schedule_updated_at BEFORE UPDATE ON schedules_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER attendance_attendance_updated_at BEFORE UPDATE ON attendance_attendance
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
