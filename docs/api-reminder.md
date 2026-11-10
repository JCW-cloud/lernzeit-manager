# Erinnerungen

## Überblick

Die Erinnerungsfunktion stellt dem Frontend anstehende geplante Lernzeiten und bald fällige Lernziele des angemeldeten Benutzers bereit.

Das Backend versendet dabei keine Push-Benachrichtigungen oder E-Mails selbst. Stattdessen liefert es die relevanten Daten über einen API-Endpunkt. Das Frontend kann diese Informationen anschließend als Erinnerung oder Hinweis darstellen.

Die Funktionalität dient insbesondere der Umsetzung von **FA-09 – Erinnerung an geplante Zeiten und Ziele**.

## Funktionsweise

Der Reminder-Endpunkt berücksichtigt zwei Arten von Einträgen:

- **Geplante Lernsessions**, die innerhalb der nächsten 24 Stunden beginnen.
- **Offene Lernziele**, deren Zieldatum innerhalb der nächsten 3 Tage liegt.

Bereits abgeschlossene Lernziele werden nicht als Erinnerung zurückgegeben.

Für die zeitliche Auswertung wird die Zeitzone `Europe/Berlin` verwendet.

## API-Endpunkt

Basisroute:

```text
/api/reminders
```

Der relevante Endpunkt lautet:

```http
GET /api/reminders/upcoming
```

Der Endpunkt ist durch `[Authorize]` geschützt und erfordert einen gültigen Bearer-Token.

Beispiel:

```http
GET /api/reminders/upcoming
Authorization: Bearer <token>
```

Erfolgreiche Antwort:

```http
200 OK
```

## Beispielantwort

```json
{
  "plannedSessions": [
    {
      "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      "courseId": "11111111-2222-3333-4444-555555555555",
      "courseTitle": "Software Engineering",
      "date": "2026-11-11",
      "startTime": "10:00:00",
      "plannedDurationMinutes": 90,
      "note": "Kapitel 4 lernen"
    }
  ],
  "goals": [
    {
      "id": "ffffffff-1111-2222-3333-444444444444",
      "courseId": "11111111-2222-3333-4444-555555555555",
      "courseTitle": "Software Engineering",
      "title": "Kapitel 5 abschließen",
      "targetDate": "2026-11-12"
    }
  ]
}
```

Die Antwort enthält zwei Listen:

- `plannedSessions` für anstehende geplante Lernzeiten
- `goals` für bald fällige offene Lernziele

Wenn keine passenden Einträge vorhanden sind, werden leere Listen zurückgegeben.

## Geplante Lernsessions

Eine geplante Lerneinheit wird als Erinnerung berücksichtigt, wenn ihr Startzeitpunkt:

- in der Zukunft liegt und
- höchstens 24 Stunden entfernt ist.

Dabei werden Datum und Startzeit der `PlannedStudySession` gemeinsam betrachtet.

Bereits vergangene Termine werden nicht zurückgegeben.

## Lernziele

Ein Lernziel wird als Erinnerung berücksichtigt, wenn:

- es noch nicht abgeschlossen ist,
- sein `TargetDate` nicht in der Vergangenheit liegt und
- das Zieldatum innerhalb der nächsten 3 Tage liegt.

Lernziele mit `IsCompleted = true` werden ignoriert.

## Zeitzone

Die Reminder-Auswertung verwendet die Zeitzone:

```text
Europe/Berlin
```

Die aktuelle UTC-Zeit des Servers wird zunächst in die lokale Zeit umgerechnet. Dadurch können geplante Sessions mit `DateOnly` und `TimeOnly` korrekt gegen den aktuellen lokalen Zeitpunkt geprüft werden.

## Authentifizierung und Zugriffsschutz

Der `RemindersController` ist mit `[Authorize]` geschützt.

Die Benutzer-ID wird aus dem authentifizierten Principal über `ClaimTypes.NameIdentifier` gelesen.

Bei den Datenbankabfragen werden ausschließlich Einträge berücksichtigt, deren zugehöriger Kurs dem angemeldeten Benutzer gehört.

Dadurch können keine Erinnerungsdaten anderer Benutzer abgerufen werden.

## Fehlerbehandlung

| Situation | HTTP-Status |
| --- | --- |
| Erinnerungen erfolgreich abgerufen | `200 OK` |
| Keine passenden Erinnerungen vorhanden | `200 OK` mit leeren Listen |
| Fehlende oder ungültige Authentifizierung | `401 Unauthorized` |

Da der Endpunkt keine Ressource anhand einer vom Benutzer übergebenen ID lädt, ist für den normalen Abruf kein `404 Not Found` erforderlich.

## Manuelle API-Tests

Der Reminder-Endpunkt wurde lokal mit `curl` gegen die laufende API getestet.

Beispiel:

```bash
curl -i "$BASE_URL/api/reminders/upcoming"   -H "Authorization: Bearer $TOKEN"
```

| Testfall | Erwartetes Ergebnis | Ergebnis |
| --- | --- | --- |
| Anstehende geplante Lernsession abrufen | `200 OK` und Eintrag in `plannedSessions` | Bestanden |
| Bald fälliges offenes Lernziel abrufen | `200 OK` und Eintrag in `goals` | Bestanden |
| Vergangene geplante Session wird nicht geliefert | Kein Eintrag | Bestanden |
| Abgeschlossenes Lernziel wird nicht geliefert | Kein Eintrag | Bestanden |
| Zugriff ohne gültige Authentifizierung | `401 Unauthorized` | Bestanden |

## Bezug zu FA-09

### FA-09 – Erinnerung an geplante Zeiten und Ziele

Die API ermittelt automatisch:

- geplante Lernzeiten innerhalb der nächsten 24 Stunden
- offene Lernziele mit Zieldatum innerhalb der nächsten 3 Tage

und stellt diese Informationen dem Frontend zur Verfügung.

Die eigentliche Darstellung der Benachrichtigung erfolgt im Frontend. Dadurch bleibt die Zuständigkeit klar getrennt:

```text
Backend
    └── erkennt anstehende Termine und Ziele

Frontend
    └── stellt daraus Erinnerungen für den Benutzer dar
```

Damit ist die backendseitige Grundlage für FA-09 umgesetzt.
