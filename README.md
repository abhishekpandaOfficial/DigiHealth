# DigiHealth — Premium Family Health Platform

DigiHealth is a modern, state-of-the-art family health record management platform built with React, TypeScript, Tailwind CSS, Supabase, and Google Gemini. It allows families to track medical histories, prescriptions, medications, vaccinations, doctor visits, lab reports, expenses, growth records, and general health vitals in a single secure dashboard.

## 🚀 Key Features

- **Multi-Member Support**: Manage multiple family member profiles with details like DOB, blood group, height, weight, insurance, and medical conditions.
- **DigiBot AI (Gemini Powered)**: An AI assistant that compiles the selected family member's entire medical record history to answer queries, summarize records, and help find insights. Includes browser-based Speech-to-Text (STT) and Text-to-Speech (TTS) using a natural, clear female Indian English voice.
- **Medicine Inventory & Schedule**: Track daily medication trackers (morning, afternoon, evening, night) and get notified about expiring or low-quantity medicines.
- **Health Records**: Manage comprehensive histories of vaccinations, diseases/symptoms, doctor consultations, lab reports, growth metrics, and health expenses.
- **Row-Level Security (RLS)**: Secure data structure in Supabase PostgreSQL protecting records for authenticated and anon roles.
- **Full-Text Search**: Optimized PG search indexes (using `pg_trgm`) for fast lookups across records.

---

## 🛠️ Architecture & Tech Stack

```
                     ┌───────────────────────────────────┐
                     │          React Frontend           │
                     │  (Vite + TS + Tailwind + Lucide)  │
                     └─────────────────┬─────────────────┘
                                       │
                ┌──────────────────────┴──────────────────────┐
                ▼                                             ▼
  ┌───────────────────────────┐                 ┌───────────────────────────┐
  │      Supabase Backend     │                 │     Google Gemini API     │
  │  (PostgreSQL + Storage)   │                 │   (gemini-2.5-flash AI)   │
  └───────────────────────────┘                 └───────────────────────────┘
```

- **Frontend**: Vite, React 19, TypeScript, Tailwind CSS, Lucide React icons, Radix UI primitives.
- **Backend (Supabase)**: PostgreSQL database (16 core tables with RLS and index optimizations), Supabase Storage buckets for secure file uploads.
- **AI Integrations**: Google Gemini REST API (`gemini-2.5-flash` model), Browser Web Speech API for voice synthesis and voice recognition.

---

## 💻 Installation & Local Setup

### 1. Clone & Install Dependencies
First, clone the repository and install all npm dependencies:
```bash
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root folder and specify your connection details:
```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-publishable-key

NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-anon-publishable-key

# Base64-encoded Gemini API Key
VITE_GEMINI_API_KEY=your-base64-encoded-gemini-key
```

> [!TIP]
> To base64-encode your Gemini API key, run the following in your terminal:
> `echo -n "YOUR_API_KEY" | base64`
> Paste the output value as the `VITE_GEMINI_API_KEY` parameter.

### 3. Database Migration
Deploy the SQL schemas directly on your Supabase dashboard or via CLI:
1. Log in to the **Supabase Dashboard** and navigate to your project's **SQL Editor**.
2. Open, copy, and execute the SQL contents from:
   - `supabase/migrations/20260626061823_digihealth_core_schema.sql` (Database structures & RLS)
   - `supabase/migrations/20260626065705_storage_buckets.sql` (File upload buckets)

### 4. Run Locally
Launch the local development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser to view the application.

---

## 🎙️ DigiBot AI Voice Capabilities

DigiBot is designed to communicate naturally. It supports:
- **Listening (Speech-to-Text)**: Click the **Mic** button in the bot footer and speak. It will capture your voice, convert it to text, and automatically send your query.
- **Speaking (Text-to-Speech)**: DigiBot replies out loud using a natural, clear female Indian English voice. You can toggle audio mute/unmute at any time using the **Speaker** icon next to the input.

---

## 🔒 Security
- All database tables are configured with **Row Level Security (RLS)**.
- Sensitive API keys are encoded using **Base64** and loaded strictly from secure environment variables in runtime, keeping keys hidden in plain text source files.
