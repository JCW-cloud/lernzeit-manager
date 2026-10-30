# Lernzielverwaltung

## Überblick

Die Lernzielverwaltung ermöglicht angemeldeten Nutzern, Lernziele innerhalb ihrer eigenen Kurse anzulegen, einzusehen, zu bearbeiten, als abgeschlossen zu markieren, wieder zu öffnen und zu löschen. Beispiele sind „Kapitel 1 lernen“, „Projektarbeit abgeben“ oder „Prüfung absolvieren“.

Die Anwendung verwendet bewusst **keine separate Meilenstein-Entität**: Lernziele übernehmen zugleich die Funktion von Zwischenzielen und nachverfolgbaren Meilensteinen. Das entspricht der im Frontend vorgesehenen einfachen Übersicht aus Kursen und zugehörigen Zielen.

## Datenmodell

Die Zuordnung lautet:

```text
ApplicationUser (1) ── (n) Course (1) ── (n) LearningGoal
```

Ein Lernziel gehört genau einem Kurs. Die Zuordnung zum Nutzer erfolgt über den Kurs.

| Feld | Typ | Bedeutung |
| --- | --- | --- |
| `Id` | `Guid` | Eindeutige Kennung |
| `CourseId` | `Guid` | Zugehöriger Kurs (Fremdschlüssel) |
| `Title` | `string` | Bezeichnung des Lernziels |
| `Description` | `string?` | Optionale Beschreibung |
| `StartDate` | `DateOnly` | Beginn des Zielzeitraums |
| `TargetDate` | `DateOnly` | Geplantes Zieldatum |
| `TargetHours` | `decimal?` | Optionale geplante Stunden für das Ziel |
| `IsCompleted` | `bool` | Gibt an, ob das Ziel abgeschlossen ist |
| `CompletedAtUtc` | `DateTime?` | UTC-Zeitpunkt des Abschlusses, sonst `null` |

Die Daten werden mit Entity Framework Core in MariaDB gespeichert. `TargetHours` besitzt eine konfigurierte Genauigkeit von `decimal(7,2)`.

## API-Endpunkte

Alle Endpunkte sind mit `[Authorize]` geschützt und verwenden die Basisroute:

`/api/courses/{courseId}/goals`

| Methode | Endpunkt | Funktion | Erfolgsstatus |
| --- | --- | --- | --- |
| `GET` | `/api/courses/{courseId}/goals` | Alle Lernziele eines Kurses abrufen | `200 OK` |
| `GET` | `/api/courses/{courseId}/goals/{goalId}` | Einzelnes Lernziel abrufen | `200 OK` |
| `POST` | `/api/courses/{courseId}/goals` | Lernziel anlegen | `201 Created` |
| `PUT` | `/api/courses/{courseId}/goals/{goalId}` | Lernziel bearbeiten | `200 OK` |
| `PATCH` | `/api/courses/{courseId}/goals/{goalId}/completion` | Abschlussstatus ändern | `200 OK` |
| `DELETE` | `/api/courses/{courseId}/goals/{goalId}` | Lernziel löschen | `204 No Content` |

### Lernziel erstellen

**Anfrage:**

```http
POST /api/courses/{courseId}/goals
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{
  "title": "Kapitel 1 lernen",
  "description": "Grundlagen durcharbeiten",
  "startDate": "2026-11-01",
  "targetDate": "2026-11-15",
  "targetHours": 5.5
}
```

Bei Erfolg antwortet die API mit `201 Created`, den Daten des neuen Lernziels und einem `Location`-Header zum Einzelabruf.

### Beispiel einer Lernzielantwort

Die IDs sind beispielhaft.

```json
{
  "id": "12345678-1234-1234-1234-123456789abc",
  "courseId": "87654321-4321-4321-4321-cba987654321",
  "title": "Kapitel 1 lernen",
  "description": "Grundlagen durcharbeiten",
  "startDate": "2026-11-01",
  "targetDate": "2026-11-15",
  "targetHours": 5.5,
  "isCompleted": false,
  "completedAtUtc": null
}
```

### Lernziel abschließen oder wieder öffnen

**Abschließen:**

```http
PATCH /api/courses/{courseId}/goals/{goalId}/completion
Authorization: Bearer <access-token>
Content-Type: application/json
```

```json
{ "isCompleted": true }
```

Beim erstmaligen Abschließen wird `IsCompleted` auf `true` gesetzt und `CompletedAtUtc` mit der aktuellen UTC-Zeit befüllt. Wird ein bereits abgeschlossenes Ziel erneut als abgeschlossen markiert, bleibt der ursprüngliche Zeitstempel erhalten.

**Wieder öffnen:**

```json
{ "isCompleted": false }
```

Dadurch werden `IsCompleted` auf `false` und `CompletedAtUtc` auf `null` gesetzt. Ein fehlendes Feld `isCompleted` wird als ungültige Anfrage behandelt.

## Validierung und Fehlerbehandlung

- `Title` ist erforderlich, darf nicht nur aus Leerzeichen bestehen und hat maximal 150 Zeichen.
- `Description` ist optional und hat maximal 1.000 Zeichen.
- `StartDate` und `TargetDate` müssen gültig angegeben werden; das Zieldatum darf nicht vor dem Startdatum liegen.
- `TargetHours` ist optional; falls angegeben, muss der Wert positiv sein und innerhalb der definierten Grenzen liegen.
- JSON-Zahlen werden mit Punkt als Dezimaltrennzeichen übergeben. Für die Grenzen des `Range`-Attributs wird `ParseLimitsInInvariantCulture = true` verwendet.

| Status | Bedeutung |
| --- | --- |
| `400 Bad Request` | Ungültige Eingaben oder fehlende Pflichtfelder |
| `401 Unauthorized` | Keine gültige Anmeldung vorhanden |
| `404 Not Found` | Kurs oder Lernziel nicht vorhanden oder nicht dem angemeldeten Nutzer zugeordnet |

## Authentifizierung und Zugriffsschutz

Die API verwendet die bestehende ASP.NET-Core-Identity-Authentifizierung mit Bearer-Token. Vor jeder Operation prüft der Controller, ob der angemeldete Nutzer Eigentümer des übergeordneten Kurses ist. Zusätzlich werden Lernziele stets über ihre `goalId` **und** `courseId` abgefragt.

Ein Nutzer kann daher weder Lernziele fremder Kurse abrufen noch bearbeiten, abschließen oder löschen. Für solche Anfragen wird `404 Not Found` zurückgegeben.

## Durchgeführte Tests

Die Endpunkte wurden manuell mit `curl` gegen die lokale API getestet.

| Testfall | Erwartetes Ergebnis | Ergebnis |
| --- | --- | --- |
| Lernziel erstellen | `201 Created` | Bestanden |
| Lernziele eines Kurses abrufen | `200 OK` | Bestanden |
| Einzelnes Lernziel abrufen | `200 OK` | Bestanden |
| Lernziel aktualisieren | `200 OK` | Bestanden |
| Lernziel löschen | `204 No Content` | Bestanden |
| Ungültiger Datumsbereich | `400 Bad Request` | Bestanden |
| Ungültige Zielstunden | `400 Bad Request` | Bestanden |
| Nicht vorhandenes Lernziel | `404 Not Found` | Bestanden |
| Zugriff ohne Anmeldung | `401 Unauthorized` | Bestanden |
| Zugriff auf fremde Lernziele | `404 Not Found` | Bestanden |
| Lernziel abschließen | `200 OK`, Abschlussstatus und Zeitstempel gesetzt | Bestanden |
| Lernziel wieder öffnen | `200 OK`, Zeitstempel zurückgesetzt | Bestanden |
| Abschlussstatus ohne `isCompleted` | `400 Bad Request` | Bestanden |
| PATCH ohne Anmeldung | `401 Unauthorized` | Bestanden |
| PATCH mit fremdem Benutzer | `404 Not Found` | Bestanden |

## Bezug zu den Anforderungen

- **FA-01:** Lernziele innerhalb eines Kurses festlegen.
- **FA-05:** Einzelne Ziele als planbare Zwischenziele anlegen, bearbeiten und abschließen.
- **FA-06:** Erreichte Studienmeilensteine als abgeschlossene Ziele nachverfolgen.
- **QA-02 bis QA-05:** Definierte API-Antworten, Eingabevalidierung, kontrollierte Fehlerbehandlung und Zugriffsschutz.

**Abgrenzung:** Die grafische Fortschrittsanzeige nach FA-08 und die nachvollziehbare Fortschrittsberechnung nach QA-08 sind damit noch nicht implementiert. Die Abschlussdaten schaffen dafür die Grundlage. Auch die Lernzeitplanung und -erfassung sind separate Funktionsbereiche.

## Technische Hinweise

Die separate Tabelle `Milestones` wurde durch eine EF-Core-Migration entfernt. `LearningGoals` erhielt die Spalten `IsCompleted` (Standardwert `false`) und `CompletedAtUtc` (nullable). Vorhandene Kurse und Lernziele bleiben dabei erhalten; etwaige Daten aus der entfernten Tabelle `Milestones` werden jedoch gelöscht.
