# PCEP Lernplattform

Öffentliche Web-Lernplattform für die **PCEP™ – Certified Entry-Level Python Programmer** Zertifizierung.

## Features

- **Lektion für Lektion** – Jede Lektion enthält digitale Lernkarten (Frage → Tipp → Antwort)
- **Öffentlicher Fortschritt** – Dein Lernstand ist für die Gruppe sichtbar
- **Admin-Bereich** – Lektionen und Karten freigeben, neue Inhalte anlegen
- **React + Next.js + DaisyUI** – Modernes UI mit Tailwind CSS

## Schnellstart

```bash
cd python-lernplattform
npm install
npm run dev
```

Öffne [http://localhost:3002](http://localhost:3002)

### Admin-Zugang

1. Gehe zu `/admin`
2. Standard-Passwort: `pcep-admin-2026`
3. Ändere es in `.env.local`:

```
ADMIN_PASSWORD=dein-sicheres-passwort
```

## Struktur

| Pfad | Beschreibung |
|------|-------------|
| `/` | Startseite mit Fortschritt & Lektionsübersicht |
| `/lektion/[id]` | Lernkarten einer Lektion |
| `/admin` | Lektionen freigeben, Karten verwalten |
| `data/` | JSON-Fallback für lokale Entwicklung ohne Supabase |
| `supabase/` | Datenbank-Migrationen (`pcep_*` Tabellen) |

## Lektion 1

Enthält **20 PCEP-Lernkarten** zu Python-Grundlagen (bereits freigegeben).

## Supabase (Produktion / Vercel)

Die App nutzt **Supabase**, sobald `NEXT_PUBLIC_SUPABASE_URL` und `SUPABASE_SERVICE_ROLE_KEY` gesetzt sind. Ohne diese Variablen fallen Lektionen, Karten und Fortschritt auf die JSON-Dateien in `data/` zurück (nur lokal sinnvoll).

1. Kopiere `.env.local.example` nach `.env.local`
2. Trage URL und **Service Role Key** ein (Supabase Dashboard → Project Settings → API)
3. Optional Inhalte neu laden: `npm run seed:supabase`

Tabellen haben das Präfix `pcep_` und liegen im Projekt **Website Projekt TableHeroes** (`beoxjrswwrcsubazbojy`).

### Vercel-Umgebungsvariablen

| Variable | Beschreibung |
|----------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase-Projekt-URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role (nur Server, geheim!) |
| `ADMIN_PASSWORD` | Passwort für `/admin` |

## Deployment

```bash
npm run build
npm start
```
