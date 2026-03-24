

# Icebreaker-Prompt an deinen Stil anpassen

## Dein Stil
- **Tonfall**: Respektvoll-anerkennend, auf Augenhöhe
- **Länge**: 2-3 Sätze erlaubt
- **Wörter**: Umgangssprache (stark, Respekt, nice, mega)
- **Muster**: Direkte Anerkennung — erst Fakt aus dem Profil, dann Respekt/Wertschätzung

## Änderung

**Datei**: `supabase/functions/analyze-profile/index.ts`

Den `systemPrompt` anpassen:

1. **Längenvorgabe** von "MAX 1-2 Sätze" auf "2-3 Sätze" ändern
2. **Stil-Beschreibung** auf direkte Anerkennung mit Umgangssprache ausrichten
3. **Beispiele** komplett ersetzen durch Beispiele mit deinem Stil:
   - Respektvolle Anerkennung als Kern
   - Umgangssprachliche Wörter wie "stark", "Respekt", "nice", "mega"
   - 2-3 Sätze, erst konkreter Fakt, dann Anerkennung

**Neue Beispiele** (Richtung):
- "Mega, 35 Jahre GF in der Baubranche mitten in Stuttgart. Das ist echt beeindruckend - da steckt richtig viel Erfahrung drin. Respekt!"
- "Seit 2018 in der Logistik selbstständig in Hamburg. Den Schritt zu machen braucht Mut - und bei dir scheint es richtig zu laufen. Stark!"
- "IT-Beratung und GF seit über 10 Jahren in München. So einen Weg hinzulegen verdient Anerkennung, nice!"

4. **Schlechte Beispiele** bleiben wie sie sind (Fragen, Angebote, Floskeln weiterhin verboten)

## Deployment
Edge Function wird nach der Änderung automatisch neu deployed.

