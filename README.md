# Chronyx — Premium Family Health Platform

Chronyx is a modern, state-of-the-art family health record management platform designed and developed by **Abhishek Panda** of **OriginX Labs**. Built with React, TypeScript, Tailwind CSS, Supabase, and Google Gemini, it allows families to track medical histories, prescriptions, medications, vaccinations, doctor visits, lab reports, expenses, growth records, and general health vitals in a single secure, premium dashboard.

## 🚀 Key Features

- **Multi-Member Support**: Manage multiple family member profiles with details like DOB, blood group, height, weight, insurance, and medical conditions.
- **Chronyx AI (Gemini + Sarvam AI Powered)**: An AI assistant that compiles the selected family member's entire medical record history to answer queries, summarize records, and help find insights. Includes browser-based Speech-to-Text (STT) and natural human-like voice synthesis (TTS) using Sarvam AI (supporting English, Hindi, and Odia native vocal accents).
- **Interactive ECG Visualizer**: Real-time canvas-drawn audio waveform/ECG heart monitor sweeps that bounce and pulse based on user microphone and bot voice output.
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
   │      Supabase Backend     │                 │   Gemini & Sarvam APIs    │
   │  (PostgreSQL + Storage)   │                 │   (Content Gen & Voice)   │
   └───────────────────────────┘                 └───────────────────────────┘
```

- **Frontend**: React 19, Vite, Tailwind CSS, Recharts (Vitals graphing)
- **Database / Backend**: Supabase (PostgreSQL with RLS + Storage Buckets)
- **AI Intelligence**: Gemini 2.5 Flash API (REST client)
- **AI Vocal Accents**: Sarvam AI Text-to-Speech REST API (REST client + Web Audio Context)

---

## 🚀 Quick Setup & Installation

### 1. Clone the Project & Install Dependencies
```bash
git clone https://github.com/abhishekpandaOfficial/DigiHealth.git
cd DigiHealth
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the project root:
```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_base64_encoded_gemini_key
VITE_SARVAM_API_KEY=your_base64_encoded_sarvam_key
```

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

## 🎙️ Chronyx AI Voice & Visualizer Capabilities

Chronyx AI is designed to communicate naturally. It supports:
- **Listening (Speech-to-Text)**: Click the **Mic** button in the bot footer and speak. It will capture your voice, convert it to text, and automatically send your query.
- **Speaking (Text-to-Speech)**: Replies out loud using premium, human-like Indian accent native voices via Sarvam AI. Select between **Female (Shreya)** and **Male (Shubh)** voices from the dropdown next to the language selector.
- **Microphone Waveform**: Real-time canvas ECG line sweeps respond to user speech volume and frequencies.
- **Audio Output Waveform**: Glowing double-sine waves animate relative to the bot's speaking frequencies and pitch.

---

## 🔒 Security & Branding
- **Developed By**: Abhishek Panda
- **Product Of**: OriginX Labs
- All database tables are configured with **Row Level Security (RLS)**.
- Sensitive API keys are encoded using **Base64** and loaded strictly from secure environment variables in runtime, keeping keys hidden in plain text source files.

---

## 🌐 Deploying to Vercel

To deploy Chronyx to Vercel and ensure it works automatically on every push, you must configure the environment variables in your Vercel Project Settings:

1. In your **Vercel Dashboard**, select your **Chronyx** project.
2. Go to **Settings** -> **Environment Variables**.
3. Add the following key-value pairs (ensure the checkbox for all environments: *Production*, *Preview*, and *Development* is selected):

| Key | Value | Description |
| :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | `https://snjviycvsssyfgvbmbba.supabase.co` | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `sb_publishable_npHeWvKyTVNH4JtwtM-UPA_ILyPjzK9` | Your Supabase publishable anon key |
| `VITE_GEMINI_API_KEY` | `QVEuQWI4Uk42TEZpM2dZaEZtLW51VzV5SV9lc09obWQ0aVhncG1kMG5TRlE5dG5aQnVTYmc=` | Base64-encoded Gemini API key |
| `VITE_SARVAM_API_KEY` | `c2tfZnh4N2JvbXZfRm5PQlJKYmg4QVlGcjEyTWpIMmlxVkhC` | Base64-encoded Sarvam AI key |

4. After saving the variables, trigger a redeployment in **Deployments** -> click the three dots on the latest deployment -> select **Redeploy**.
5. Once complete, your project will load data successfully. Any subsequent pushes to GitHub will automatically trigger new builds that work out-of-the-box!

