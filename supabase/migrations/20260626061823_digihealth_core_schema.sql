
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- FAMILY MEMBERS
-- ============================================================
CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  dob DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  blood_group TEXT,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  relation TEXT NOT NULL,
  photo_url TEXT,
  aadhaar TEXT,
  abha_id TEXT,
  uhid TEXT,
  phone TEXT,
  email TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  is_organ_donor BOOLEAN DEFAULT FALSE,
  allergies JSONB DEFAULT '[]',
  lifestyle JSONB DEFAULT '{}',
  insurance JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_family_members" ON family_members FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_family_members" ON family_members FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_family_members" ON family_members FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_family_members" ON family_members FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- DISEASES / CONDITIONS
-- ============================================================
CREATE TABLE diseases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  icd_code TEXT,
  start_date DATE,
  recovered_date DATE,
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
  status TEXT CHECK (status IN ('active', 'recovered', 'chronic', 'recurring')) DEFAULT 'active',
  symptoms TEXT[],
  doctor TEXT,
  hospital TEXT,
  diagnosis TEXT,
  medicines JSONB DEFAULT '[]',
  tests JSONB DEFAULT '[]',
  images TEXT[],
  notes TEXT,
  ai_summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE diseases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_diseases" ON diseases FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_diseases" ON diseases FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_diseases" ON diseases FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_diseases" ON diseases FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- PRESCRIPTIONS
-- ============================================================
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  file_url TEXT,
  ocr_text TEXT,
  extracted_json JSONB DEFAULT '{}',
  doctor TEXT,
  hospital TEXT,
  prescription_date DATE,
  diagnosis TEXT,
  next_visit DATE,
  medicines JSONB DEFAULT '[]',
  tests JSONB DEFAULT '[]',
  advice TEXT,
  warnings TEXT,
  ai_summary TEXT,
  status TEXT CHECK (status IN ('active', 'completed', 'archived')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_prescriptions" ON prescriptions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_prescriptions" ON prescriptions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_prescriptions" ON prescriptions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_prescriptions" ON prescriptions FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- MEDICINES (Master DB + Inventory)
-- ============================================================
CREATE TABLE medicines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  generic_name TEXT,
  brand_name TEXT,
  composition TEXT,
  category TEXT,
  strength TEXT,
  form TEXT,
  manufacturer TEXT,
  mrp NUMERIC,
  purchase_price NUMERIC,
  batch_number TEXT,
  expiry_date DATE,
  manufacturing_date DATE,
  barcode TEXT,
  quantity_total INTEGER DEFAULT 0,
  quantity_remaining INTEGER DEFAULT 0,
  minimum_quantity INTEGER DEFAULT 5,
  shelf_location TEXT,
  open_date DATE,
  dispose_date DATE,
  dispose_reason TEXT,
  image_url TEXT,
  prescription_id UUID REFERENCES prescriptions(id),
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_medicines" ON medicines FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_medicines" ON medicines FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_medicines" ON medicines FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_medicines" ON medicines FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- MEDICATION SCHEDULES
-- ============================================================
CREATE TABLE medication_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES medicines(id) ON DELETE CASCADE,
  medicine_name TEXT NOT NULL,
  dosage TEXT,
  frequency TEXT,
  morning BOOLEAN DEFAULT FALSE,
  afternoon BOOLEAN DEFAULT FALSE,
  evening BOOLEAN DEFAULT FALSE,
  night BOOLEAN DEFAULT FALSE,
  before_food BOOLEAN DEFAULT FALSE,
  after_food BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  duration_days INTEGER,
  status TEXT CHECK (status IN ('active', 'completed', 'paused', 'stopped')) DEFAULT 'active',
  prescription_id UUID REFERENCES prescriptions(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_med_schedules" ON medication_schedules FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_med_schedules" ON medication_schedules FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_med_schedules" ON medication_schedules FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_med_schedules" ON medication_schedules FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- MEDICATION LOGS (track taken/missed)
-- ============================================================
CREATE TABLE medication_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  schedule_id UUID REFERENCES medication_schedules(id) ON DELETE CASCADE,
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  scheduled_time TIMESTAMPTZ,
  taken_at TIMESTAMPTZ,
  status TEXT CHECK (status IN ('taken', 'missed', 'skipped')) DEFAULT 'taken',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE medication_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_med_logs" ON medication_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_med_logs" ON medication_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_med_logs" ON medication_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_med_logs" ON medication_logs FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- VACCINATIONS
-- ============================================================
CREATE TABLE vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  vaccine_name TEXT NOT NULL,
  disease_protected TEXT,
  scheduled_date DATE,
  administered_date DATE,
  next_due_date DATE,
  dose_number INTEGER DEFAULT 1,
  total_doses INTEGER DEFAULT 1,
  batch_number TEXT,
  administered_by TEXT,
  hospital TEXT,
  status TEXT CHECK (status IN ('scheduled', 'completed', 'missed', 'overdue')) DEFAULT 'scheduled',
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_vaccinations" ON vaccinations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_vaccinations" ON vaccinations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_vaccinations" ON vaccinations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_vaccinations" ON vaccinations FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- DOCTOR VISITS
-- ============================================================
CREATE TABLE doctor_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  doctor_name TEXT NOT NULL,
  specialization TEXT,
  hospital TEXT,
  clinic TEXT,
  visit_date DATE NOT NULL,
  reason TEXT,
  diagnosis TEXT,
  prescription_id UUID REFERENCES prescriptions(id),
  fees NUMERIC,
  follow_up_date DATE,
  location TEXT,
  bill_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE doctor_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_doctor_visits" ON doctor_visits FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_doctor_visits" ON doctor_visits FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_doctor_visits" ON doctor_visits FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_doctor_visits" ON doctor_visits FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- LAB REPORTS
-- ============================================================
CREATE TABLE lab_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  report_name TEXT NOT NULL,
  category TEXT,
  lab_name TEXT,
  ordered_by TEXT,
  report_date DATE,
  file_url TEXT,
  results JSONB DEFAULT '[]',
  abnormal_flags JSONB DEFAULT '[]',
  ai_summary TEXT,
  ocr_text TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE lab_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_lab_reports" ON lab_reports FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_lab_reports" ON lab_reports FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_lab_reports" ON lab_reports FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_lab_reports" ON lab_reports FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- VITAL SIGNS / HEALTH METRICS
-- ============================================================
CREATE TABLE health_vitals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  metric_type TEXT NOT NULL,
  value NUMERIC,
  unit TEXT,
  secondary_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health_vitals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_vitals" ON health_vitals FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_vitals" ON health_vitals FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_vitals" ON health_vitals FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_vitals" ON health_vitals FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- EXPENSES / BILLS
-- ============================================================
CREATE TABLE health_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  category TEXT CHECK (category IN ('medicine', 'doctor', 'hospital', 'lab', 'insurance', 'equipment', 'other')),
  amount NUMERIC NOT NULL,
  description TEXT,
  vendor TEXT,
  expense_date DATE,
  bill_url TEXT,
  reimbursed BOOLEAN DEFAULT FALSE,
  insurance_claimed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE health_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_expenses" ON health_expenses FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_expenses" ON health_expenses FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_expenses" ON health_expenses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_expenses" ON health_expenses FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- GROWTH RECORDS (Children)
-- ============================================================
CREATE TABLE growth_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL,
  age_months INTEGER,
  height_cm NUMERIC,
  weight_kg NUMERIC,
  head_circumference_cm NUMERIC,
  bmi NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE growth_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_growth" ON growth_records FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_growth" ON growth_records FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_growth" ON growth_records FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_growth" ON growth_records FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name TEXT NOT NULL,
  record_id UUID,
  action TEXT CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  user_info TEXT
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_audit" ON audit_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_audit" ON audit_logs FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_audit" ON audit_logs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_audit" ON audit_logs FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- AI CHAT HISTORY (HealthBot)
-- ============================================================
CREATE TABLE healthbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE SET NULL,
  messages JSONB DEFAULT '[]',
  title TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE healthbot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_chatbot" ON healthbot_conversations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_chatbot" ON healthbot_conversations FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_chatbot" ON healthbot_conversations FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_chatbot" ON healthbot_conversations FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- ALLERGIES (detailed)
-- ============================================================
CREATE TABLE allergies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  allergen TEXT NOT NULL,
  category TEXT CHECK (category IN ('food', 'medicine', 'environmental', 'other')),
  severity TEXT CHECK (severity IN ('mild', 'moderate', 'severe', 'life-threatening')),
  reaction TEXT,
  diagnosed_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_allergies" ON allergies FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_allergies" ON allergies FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_allergies" ON allergies FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_allergies" ON allergies FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- DOCUMENTS (general storage)
-- ============================================================
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  member_id UUID REFERENCES family_members(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  ocr_text TEXT,
  ai_summary TEXT,
  tags TEXT[],
  related_id UUID,
  related_table TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "select_documents" ON documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "insert_documents" ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "update_documents" ON documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "delete_documents" ON documents FOR DELETE TO anon, authenticated USING (true);

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX idx_diseases_member_id ON diseases(member_id);
CREATE INDEX idx_prescriptions_member_id ON prescriptions(member_id);
CREATE INDEX idx_medicines_member_id ON medicines(member_id);
CREATE INDEX idx_medication_schedules_member_id ON medication_schedules(member_id);
CREATE INDEX idx_vaccinations_member_id ON vaccinations(member_id);
CREATE INDEX idx_doctor_visits_member_id ON doctor_visits(member_id);
CREATE INDEX idx_lab_reports_member_id ON lab_reports(member_id);
CREATE INDEX idx_health_vitals_member_id ON health_vitals(member_id);
CREATE INDEX idx_health_expenses_member_id ON health_expenses(member_id);
CREATE INDEX idx_growth_records_member_id ON growth_records(member_id);
CREATE INDEX idx_allergies_member_id ON allergies(member_id);
CREATE INDEX idx_documents_member_id ON documents(member_id);

-- Full text search indexes
CREATE INDEX idx_family_members_name_trgm ON family_members USING GIN (name gin_trgm_ops);
CREATE INDEX idx_prescriptions_doctor_trgm ON prescriptions USING GIN (doctor gin_trgm_ops);
CREATE INDEX idx_medicines_name_trgm ON medicines USING GIN (name gin_trgm_ops);
CREATE INDEX idx_diseases_name_trgm ON diseases USING GIN (name gin_trgm_ops);
