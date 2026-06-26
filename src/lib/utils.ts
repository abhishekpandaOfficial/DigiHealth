import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { differenceInYears, differenceInMonths, format, parseISO, isValid } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function calcAge(dob: string | null): string {
  if (!dob) return "Unknown"
  const parsed = parseISO(dob)
  if (!isValid(parsed)) return "Unknown"
  const years = differenceInYears(new Date(), parsed)
  if (years < 2) {
    const months = differenceInMonths(new Date(), parsed)
    return `${months}m`
  }
  return `${years}y`
}

export function calcBMI(height_cm: number | null, weight_kg: number | null): number | null {
  if (!height_cm || !weight_kg) return null
  const h = height_cm / 100
  return parseFloat((weight_kg / (h * h)).toFixed(1))
}

export function bmiCategory(bmi: number | null): { label: string; color: string } {
  if (!bmi) return { label: "Unknown", color: "text-muted-foreground" }
  if (bmi < 18.5) return { label: "Underweight", color: "text-blue-500" }
  if (bmi < 25) return { label: "Normal", color: "text-green-500" }
  if (bmi < 30) return { label: "Overweight", color: "text-yellow-500" }
  return { label: "Obese", color: "text-red-500" }
}

export function formatDate(date: string | null | undefined, fmt = "dd MMM yyyy"): string {
  if (!date) return "—"
  try {
    const parsed = parseISO(date)
    if (!isValid(parsed)) return "—"
    return format(parsed, fmt)
  } catch {
    return "—"
  }
}

export function formatCurrency(amount: number | null | undefined): string {
  if (amount == null) return "—"
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount)
}

export function bloodGroupColor(bg: string | null): string {
  const colors: Record<string, string> = {
    "A+": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "A-": "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300",
    "B+": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "B-": "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
    "O+": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "O-": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    "AB+": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    "AB-": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
  }
  return colors[bg ?? ""] ?? "bg-muted text-muted-foreground"
}

export function isExpiringSoon(expiryDate: string | null, days = 30): boolean {
  if (!expiryDate) return false
  const parsed = parseISO(expiryDate)
  if (!isValid(parsed)) return false
  const msLeft = parsed.getTime() - Date.now()
  return msLeft > 0 && msLeft < days * 24 * 60 * 60 * 1000
}

export function isExpired(expiryDate: string | null): boolean {
  if (!expiryDate) return false
  const parsed = parseISO(expiryDate)
  if (!isValid(parsed)) return false
  return parsed.getTime() < Date.now()
}

export const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]

export const RELATIONS = [
  "Self", "Father", "Mother", "Son", "Daughter", "Husband", "Wife",
  "Brother", "Sister", "Grandfather", "Grandmother", "Grandson",
  "Granddaughter", "Uncle", "Aunt", "Nephew", "Niece", "Guardian", "Other"
]

export const SPECIALIZATIONS = [
  "General Physician", "Cardiologist", "Neurologist", "Orthopedist",
  "Pediatrician", "Gynecologist", "Dermatologist", "Ophthalmologist",
  "ENT Specialist", "Gastroenterologist", "Pulmonologist", "Endocrinologist",
  "Urologist", "Nephrologist", "Oncologist", "Psychiatrist", "Dentist",
  "Radiologist", "Pathologist", "Surgeon", "Other"
]

export const INDIA_VACCINE_SCHEDULE = [
  { name: "BCG", age: "At birth", disease: "Tuberculosis" },
  { name: "OPV 0", age: "At birth", disease: "Polio" },
  { name: "Hepatitis B (Birth dose)", age: "At birth", disease: "Hepatitis B" },
  { name: "OPV 1", age: "6 weeks", disease: "Polio" },
  { name: "Pentavalent 1", age: "6 weeks", disease: "DPT + HepB + Hib" },
  { name: "RVV 1 (Rotavirus)", age: "6 weeks", disease: "Rotavirus diarrhea" },
  { name: "Fractional IPV 1", age: "6 weeks", disease: "Polio" },
  { name: "OPV 2", age: "10 weeks", disease: "Polio" },
  { name: "Pentavalent 2", age: "10 weeks", disease: "DPT + HepB + Hib" },
  { name: "RVV 2 (Rotavirus)", age: "10 weeks", disease: "Rotavirus diarrhea" },
  { name: "OPV 3", age: "14 weeks", disease: "Polio" },
  { name: "Pentavalent 3", age: "14 weeks", disease: "DPT + HepB + Hib" },
  { name: "RVV 3 (Rotavirus)", age: "14 weeks", disease: "Rotavirus diarrhea" },
  { name: "Fractional IPV 2", age: "14 weeks", disease: "Polio" },
  { name: "PCV Booster", age: "9 months", disease: "Pneumococcal disease" },
  { name: "Vitamin A (1st dose)", age: "9 months", disease: "Vitamin A deficiency" },
  { name: "MR 1 (Measles-Rubella)", age: "9 months", disease: "Measles + Rubella" },
  { name: "JE 1", age: "9-12 months", disease: "Japanese Encephalitis" },
  { name: "MR 2", age: "16-24 months", disease: "Measles + Rubella" },
  { name: "OPV Booster", age: "16-24 months", disease: "Polio" },
  { name: "DPT Booster 1", age: "16-24 months", disease: "Diphtheria, Pertussis, Tetanus" },
  { name: "JE 2", age: "16-24 months", disease: "Japanese Encephalitis" },
  { name: "Vitamin A (subsequent)", age: "Every 6 months till 5y", disease: "Vitamin A deficiency" },
  { name: "DPT Booster 2", age: "5-6 years", disease: "Diphtheria, Pertussis, Tetanus" },
  { name: "TT/Td (10y)", age: "10 years", disease: "Tetanus + Diphtheria" },
  { name: "TT/Td (16y)", age: "16 years", disease: "Tetanus + Diphtheria" },
]
