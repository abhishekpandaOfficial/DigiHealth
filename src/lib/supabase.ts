import { createClient } from "@supabase/supabase-js"

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface FamilyMember {
  id: string
  name: string
  dob: string | null
  gender: "male" | "female" | "other" | null
  blood_group: string | null
  height_cm: number | null
  weight_kg: number | null
  relation: string
  photo_url: string | null
  aadhaar: string | null
  abha_id: string | null
  uhid: string | null
  phone: string | null
  email: string | null
  emergency_contact: string | null
  emergency_phone: string | null
  is_organ_donor: boolean
  allergies: Json
  lifestyle: Json
  insurance: Json
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Disease {
  id: string
  member_id: string
  name: string
  icd_code: string | null
  start_date: string | null
  recovered_date: string | null
  severity: "mild" | "moderate" | "severe" | "critical" | null
  status: "active" | "recovered" | "chronic" | "recurring"
  symptoms: string[] | null
  doctor: string | null
  hospital: string | null
  diagnosis: string | null
  medicines: Json
  tests: Json
  images: string[] | null
  notes: string | null
  ai_summary: string | null
  created_at: string
  updated_at: string
}

export interface Prescription {
  id: string
  member_id: string
  file_url: string | null
  ocr_text: string | null
  extracted_json: Json
  doctor: string | null
  hospital: string | null
  prescription_date: string | null
  diagnosis: string | null
  next_visit: string | null
  medicines: Json
  tests: Json
  advice: string | null
  warnings: string | null
  ai_summary: string | null
  status: "active" | "completed" | "archived"
  created_at: string
  updated_at: string
}

export interface Medicine {
  id: string
  member_id: string
  name: string
  generic_name: string | null
  brand_name: string | null
  composition: string | null
  category: string | null
  strength: string | null
  form: string | null
  manufacturer: string | null
  mrp: number | null
  purchase_price: number | null
  batch_number: string | null
  expiry_date: string | null
  manufacturing_date: string | null
  barcode: string | null
  quantity_total: number
  quantity_remaining: number
  minimum_quantity: number
  shelf_location: string | null
  open_date: string | null
  dispose_date: string | null
  dispose_reason: string | null
  image_url: string | null
  prescription_id: string | null
  is_active: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MedicationSchedule {
  id: string
  member_id: string
  medicine_id: string | null
  medicine_name: string
  dosage: string | null
  frequency: string | null
  morning: boolean
  afternoon: boolean
  evening: boolean
  night: boolean
  before_food: boolean
  after_food: boolean
  start_date: string | null
  end_date: string | null
  duration_days: number | null
  status: "active" | "completed" | "paused" | "stopped"
  prescription_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Vaccination {
  id: string
  member_id: string
  vaccine_name: string
  disease_protected: string | null
  scheduled_date: string | null
  administered_date: string | null
  next_due_date: string | null
  dose_number: number
  total_doses: number
  batch_number: string | null
  administered_by: string | null
  hospital: string | null
  status: "scheduled" | "completed" | "missed" | "overdue"
  certificate_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface DoctorVisit {
  id: string
  member_id: string
  doctor_name: string
  specialization: string | null
  hospital: string | null
  clinic: string | null
  visit_date: string
  reason: string | null
  diagnosis: string | null
  prescription_id: string | null
  fees: number | null
  follow_up_date: string | null
  location: string | null
  bill_url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LabReport {
  id: string
  member_id: string
  report_name: string
  category: string | null
  lab_name: string | null
  ordered_by: string | null
  report_date: string | null
  file_url: string | null
  results: Json
  abnormal_flags: Json
  ai_summary: string | null
  ocr_text: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface HealthVital {
  id: string
  member_id: string
  recorded_at: string
  metric_type: string
  value: number | null
  unit: string | null
  secondary_value: number | null
  notes: string | null
  created_at: string
}

export interface HealthExpense {
  id: string
  member_id: string
  category: "medicine" | "doctor" | "hospital" | "lab" | "insurance" | "equipment" | "other" | null
  amount: number
  description: string | null
  vendor: string | null
  expense_date: string | null
  bill_url: string | null
  reimbursed: boolean
  insurance_claimed: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Allergy {
  id: string
  member_id: string
  allergen: string
  category: "food" | "medicine" | "environmental" | "other" | null
  severity: "mild" | "moderate" | "severe" | "life-threatening" | null
  reaction: string | null
  diagnosed_date: string | null
  notes: string | null
  created_at: string
}

export interface GrowthRecord {
  id: string
  member_id: string
  recorded_date: string
  age_months: number | null
  height_cm: number | null
  weight_kg: number | null
  head_circumference_cm: number | null
  bmi: number | null
  notes: string | null
  created_at: string
}

export interface HealthbotConversation {
  id: string
  member_id: string | null
  messages: Json
  title: string | null
  created_at: string
  updated_at: string
}
