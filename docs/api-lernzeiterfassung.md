# Lernzeiterfassung

## Überblick

Die Lernzeiterfassung ermöglicht angemeldeten Benutzern, tatsächlich geleistete Lernzeit für ihre eigenen Kurse zu erfassen.

Dafür stehen zwei Erfassungsarten zur Verfügung:

- **Stoppuhr:** Lernzeit kann gestartet, pausiert, fortgesetzt und beendet werden.
- **Manuelle Erfassung:** Bereits absolvierte Lernzeit kann direkt als Anzahl von Minuten eingetragen werden.

Beide Erfassungsarten werden gemeinsam als `StudySession` gespeichert und können dadurch später einheitlich ausgewertet werden.

Die Funktionalität deckt insbesondere **FA-04 – Nachverfolgung der Lernzeiten mittels Stoppuhr** ab und bildet gleichzeitig die Datenbasis für die spätere Visualisierung der eingesetzten Lernzeiten nach **FA-07**.

## Datenmodell

Die Entität `StudySession` repräsentiert tatsächlich erfasste Lernzeit und gehört genau einem Kurs.

```text
ApplicationUser
    └── Course
          ├── LearningGoal
          ├── PlannedStudySession
          └── StudySession
```

Die wichtigsten Eigenschaften sind:

| Eigenschaft | Typ | Beschreibung |
| --- | --- | --- |
| `Id` | `Guid` | Eindeutige ID der Lernsession |
| `CourseId` | `Guid` | Zugehöriger Kurs |
| `Course` | `Course` | Navigation zum Kurs |
| `Type` | `StudySessionType` | Erfassungsart (`Timer` oder `Manual`) |
| `Status` | `StudySessionStatus` | Zustand der Session |
| `CreatedAtUtc` | `DateTime` | Zeitpunkt der Erstellung |
| `StartedAtUtc` | `DateTime?` | Startzeitpunkt eines Timers |
| `CurrentRunStartedAtUtc` | `DateTime?` | Beginn des aktuell laufenden Zeitabschnitts |
| `AccumulatedSeconds` | `int` | Bereits gespeicherte aktive Lernzeit in Sekunden |
| `EndedAtUtc` | `DateTime?` | Zeitpunkt, zu dem ein Timer beendet wurde |

Beim Löschen eines Kurses werden die zugehörigen Lernsessions über die Fremdschlüsselbeziehung ebenfalls entfernt.

## Enums

### `StudySessionType`

```text
Timer
Manual
```

### `StudySessionStatus`

```text
Running
Paused
Completed
```

Die Enum-Werte werden in der Datenbank als Integer gespeichert und über die API als Strings ausgegeben.

## Timer-Logik

Beim Start eines Timers werden folgende Werte gesetzt:

```text
Type = Timer
Status = Running
StartedAtUtc = aktueller UTC-Zeitpunkt
CurrentRunStartedAtUtc = aktueller UTC-Zeitpunkt
AccumulatedSeconds = 0
EndedAtUtc = null
```

Beim Pausieren wird die seit `CurrentRunStartedAtUtc` vergangene Zeit zu `AccumulatedSeconds` addiert. Anschließend wird der Status auf `Paused` gesetzt.

Beim Fortsetzen erhält `CurrentRunStartedAtUtc` den aktuellen UTC-Zeitpunkt und der Status wird wieder auf `Running` gesetzt.

Beim Stoppen wird ein gegebenenfalls noch laufender Zeitabschnitt zu `AccumulatedSeconds` addiert. Anschließend wird der Status auf `Completed` gesetzt und `EndedAtUtc` gespeichert.

Dadurch werden Pausenzeiten nicht als Lernzeit gezählt.

Für einen Kurs darf höchstens ein nicht abgeschlossener Timer gleichzeitig existieren.

## Manuelle Lernzeiterfassung

Bei der manuellen Erfassung wählt der Benutzer einen Kurs und trägt die absolvierte Lernzeit in Minuten ein.

Beispiel:

```json
{
  "minutes": 45
}
```

Intern wird die Dauer in Sekunden gespeichert:

```text
45 Minuten = 2700 Sekunden
```

Eine manuelle Lernsession wird direkt mit `Type = Manual`, `Status = Completed` und der berechneten Dauer gespeichert.

## API-Endpunkte

Basisroute:

```text
/api/courses/{courseId}/study-sessions
```

Alle Endpunkte erfordern eine gültige Authentifizierung.

| Methode | Route | Beschreibung |
| --- | --- | --- |
| `GET` | `/api/courses/{courseId}/study-sessions` | Alle tatsächlich erfassten Lernzeiten eines Kurses abrufen |
| `POST` | `/api/courses/{courseId}/study-sessions/manual` | Lernzeit manuell erfassen |
| `POST` | `/api/courses/{courseId}/study-sessions/timer/start` | Timer starten |
| `PATCH` | `/api/courses/{courseId}/study-sessions/{id}/pause` | Timer pausieren |
| `PATCH` | `/api/courses/{courseId}/study-sessions/{id}/resume` | Timer fortsetzen |
| `PATCH` | `/api/courses/{courseId}/study-sessions/{id}/stop` | Timer stoppen |

## Lernzeiten abrufen

```http
GET /api/courses/{courseId}/study-sessions
Authorization: Bearer <token>
```

Erfolgreiche Antwort:

```http
200 OK
```

Die Antwort enthält sowohl manuell erfasste als auch über den Timer erfasste Sessions.

`elapsedSeconds` enthält die tatsächlich anzurechnende Lernzeit. Pausenzeiten werden nicht mitgezählt.

Bei einem aktuell laufenden Timer berücksichtigt die API zusätzlich den seit `CurrentRunStartedAtUtc` laufenden Zeitabschnitt.

## Manuelle Lernzeit erfassen

```http
POST /api/courses/{courseId}/study-sessions/manual
Authorization: Bearer <token>
Content-Type: application/json
```

Beispiel:

```json
{
  "minutes": 45
}
```

Erfolgreiche Antwort:

```http
201 Created
```

Die Lernzeit muss zwischen `1` und `1440` Minuten liegen.

## Timer starten

```http
POST /api/courses/{courseId}/study-sessions/timer/start
Authorization: Bearer <token>
```

Erfolgreiche Antwort:

```http
201 Created
```

Existiert für den Kurs bereits ein laufender oder pausierter Timer, wird der Start eines weiteren Timers mit `409 Conflict` abgelehnt.

## Timer pausieren

```http
PATCH /api/courses/{courseId}/study-sessions/{id}/pause
Authorization: Bearer <token>
```

Erfolgreiche Antwort:

```http
200 OK
```

Ein Timer, der nicht läuft, kann nicht pausiert werden. In diesem Fall wird `409 Conflict` zurückgegeben.

## Timer fortsetzen

```http
PATCH /api/courses/{courseId}/study-sessions/{id}/resume
Authorization: Bearer <token>
```

Erfolgreiche Antwort:

```http
200 OK
```

Nur ein pausierter Timer kann fortgesetzt werden. Andere Zustände führen zu `409 Conflict`.

## Timer stoppen

```http
PATCH /api/courses/{courseId}/study-sessions/{id}/stop
Authorization: Bearer <token>
```

Erfolgreiche Antwort:

```http
200 OK
```

Ein bereits abgeschlossener Timer kann nicht erneut gestoppt werden und führt zu `409 Conflict`.

## Validierung

Für die manuelle Erfassung gilt:

- Die Lernzeit muss mindestens `1` Minute betragen.
- Die Lernzeit darf maximal `1440` Minuten betragen.

Ungültige Eingaben werden mit `400 Bad Request` abgewiesen.

Die Timer-Endpunkte prüfen zusätzlich, ob der aktuelle Session-Zustand die gewünschte Aktion erlaubt.

## Authentifizierung und Zugriffsschutz

Der `StudySessionsController` ist mit `[Authorize]` geschützt.

Bei jeder Operation wird geprüft, ob der angemeldete Benutzer Eigentümer des angegebenen Kurses ist. Dadurch können Benutzer weder Lernzeiten fremder Kurse abrufen noch deren Timer verändern.

Für fremde oder nicht vorhandene Kurse wird `404 Not Found` zurückgegeben.

## Fehlerbehandlung

| Situation | HTTP-Status |
| --- | --- |
| Lernzeiten erfolgreich abgerufen | `200 OK` |
| Manuelle Session erfolgreich erstellt | `201 Created` |
| Timer erfolgreich gestartet | `201 Created` |
| Pause, Fortsetzen oder Stop erfolgreich | `200 OK` |
| Ungültige manuelle Dauer | `400 Bad Request` |
| Fehlende oder ungültige Authentifizierung | `401 Unauthorized` |
| Kurs oder Timer nicht vorhanden beziehungsweise fremd | `404 Not Found` |
| Ungültiger Timer-Zustand | `409 Conflict` |
| Zweiter aktiver Timer für denselben Kurs | `409 Conflict` |

## Manuelle API-Tests

Die Endpunkte wurden lokal mit `curl` gegen die laufende API getestet.

| Testfall | Erwartetes Ergebnis | Ergebnis |
| --- | --- | --- |
| Lernzeit manuell erfassen | `201 Created` | Bestanden |
| Timer starten | `201 Created` | Bestanden |
| Timer pausieren | `200 OK` | Bestanden |
| Timer fortsetzen | `200 OK` | Bestanden |
| Timer stoppen | `200 OK` | Bestanden |
| Gespeicherte Sessions abrufen | `200 OK` | Bestanden |
| Zweiten aktiven Timer starten | `409 Conflict` | Bestanden |
| Bereits pausierten Timer erneut pausieren | `409 Conflict` | Bestanden |
| Laufenden Timer erneut fortsetzen | `409 Conflict` | Bestanden |
| Bereits abgeschlossenen Timer erneut stoppen | `409 Conflict` | Bestanden |
| Zugriff ohne Token | `401 Unauthorized` | Bestanden |
| Zugriff auf fremden Kurs | `404 Not Found` | Bestanden |

## Bezug zu den Anforderungen

### FA-04 – Nachverfolgung der Lernzeiten mittels Stoppuhr

Die Stoppuhr kann gestartet, pausiert, fortgesetzt und gestoppt werden. Die tatsächlich aktive Lernzeit wird dauerhaft gespeichert; Pausenzeiten werden nicht berücksichtigt.

Zusätzlich kann absolvierte Lernzeit manuell eingetragen werden.

Damit ist die tatsächliche Lernzeiterfassung backendseitig umgesetzt.

### Vorbereitung für FA-07

Da Timer- und manuell erfasste Lernzeiten gemeinsam als `StudySession` gespeichert werden, können die tatsächlich eingesetzten Lernzeiten später nach Kurs oder Zeitraum aggregiert und dem Frontend für eine grafische Darstellung bereitgestellt werden.
