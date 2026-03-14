
# LinkedIn Outreach Tool

## Übersicht
Minimalistische Web-App für personalisierten LinkedIn-Outreach. Ein einziger User erstellt Absender-Profile mit je einem Template, lädt LinkedIn-Screenshots hoch und bekommt KI-generierte Icebreaker + automatische Namensextraktion.

## Seiten & Layout

### Login/Signup
- Einfache Email + Passwort Authentifizierung via Supabase Auth

### Hauptansicht (nach Login)
- **Linke Sidebar**: Liste der Absender-Profile (Name + kurze Beschreibung), Button "Neues Profil erstellen"
- **Rechter Bereich**: Aktives Profil mit zwei Bereichen:

#### 1. Template-Bereich (oben)
- Editierbares Textfeld für die Nachrichtenvorlage
- Zwei Platzhalter-Variablen: `{name}` und `{icebreaker}`
- Speichern-Button, jederzeit editierbar

#### 2. Outreach-Bereich (unten)
- **Bild-Upload**: Drag & Drop oder Click für LinkedIn-Profil-Screenshot
- Nach Upload: KI analysiert das Bild → extrahiert den **Namen** automatisch und generiert **5 Icebreaker-Vorschläge**
- Icebreaker werden als auswählbare Karten angezeigt
- Optional: Textfeld für einen Custom-Prompt um die Icebreaker neu generieren zu lassen (sendet Bild + neuen Prompt erneut an KI)
- **"Neu generieren"**-Button neben dem Prompt-Feld
- Bei Klick auf einen Icebreaker: Fertige Nachricht wird angezeigt (Template mit eingesetztem Name + Icebreaker) + **Copy-Button**

## Backend & Datenbank
- **Supabase Auth** für Authentifizierung
- **Profiles-Tabelle**: id, user_id, name, description, template_message
- **Supabase Storage**: Bucket für LinkedIn-Screenshots (temporär)
- **Lovable AI** (Gemini mit Vision): Namensextraktion + Icebreaker-Generierung aus dem Screenshot
- **Edge Function**: Nimmt Bild + Template-Kontext + optionalen Prompt entgegen, gibt Name + 5 Icebreaker zurück

## Design
- Minimalistisch, clean, dunkles oder helles Theme
- Fokus auf Effizienz: So wenig Klicks wie möglich vom Upload bis zur kopierten Nachricht
