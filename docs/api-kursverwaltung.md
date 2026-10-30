# Kursverwaltung

## Überblick

Die Kursverwaltung ermöglicht angemeldeten Benutzern, eigene Kurse anzulegen, abzurufen, zu bearbeiten und zu löschen. Kurse dienen als organisatorische Grundlage für die später angebundenen Lernziele und Lernsitzungen.

Die Implementierung erfolgt im Backend über ASP.NET Core Web API mit Entity Framework Core und MariaDB. Alle Endpunkte sind durch ASP.NET Core Identity geschützt.

## Datenmodell

Die Entität `Course` besitzt folgende Eigenschaften:

| Eigenschaft | Typ | Beschreibung |
| --- | --- | --- |
| `Id` | `Guid` | Eindeutige Kurs-ID |
| `Title` | `string` | Kurstitel |
| `Description` | `string?` | Optionale Beschreibung |
| `CreatedAtUtc` | `DateTime` | Erstellungszeitpunkt in UTC |
| `UserId` | `string` | ID des zugehörigen Benutzers |
| `User` | `ApplicationUser` | Navigation zum Besitzer |
| `LearningGoals` | `ICollection<LearningGoal>` | Zugeordnete Lernziele |

Ein `ApplicationUser` kann mehrere Kurse besitzen; jeder Kurs gehört genau einem Benutzer. Die Beziehung wird im `ApplicationDbContext` verwaltet. Die Datenbankstruktur wurde über eine EF-Core-Migration angelegt.

Kurse haben selbst kein Start- oder Enddatum. Zeitliche Vorgaben werden auf Ebene der Lernziele modelliert.

## API-Endpunkte

Basisroute: `/api/courses`

Alle Endpunkte erfordern einen gültigen Bearer-Access-Token im Header `Authorization: Bearer <token>`.

| Methode | Route | Beschreibung | Erfolgsstatus |
| --- | --- | --- | --- |
| `GET` | `/api/courses` | Eigene Kurse alphabetisch nach Titel abrufen | `200 OK` |
| `GET` | `/api/courses/{id}` | Eigenen Kurs anhand seiner ID abrufen | `200 OK` |
| `POST` | `/api/courses` | Neuen Kurs erstellen | `201 Created` |
| `PUT` | `/api/courses/{id}` | Eigenen Kurs aktualisieren | `200 OK` |
| `DELETE` | `/api/courses/{id}` | Eigenen Kurs löschen | `204 No Content` |

### Kurs erstellen

**Anfrage:**

```http
POST /api/courses
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "title": "Software Engineering",
  "description": "Vorbereitung auf die Prüfung"
}
```

**Beispielantwort (`201 Created`):**

```json
{
  "id": "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
  "title": "Software Engineering",
  "description": "Vorbereitung auf die Prüfung",
  "createdAtUtc": "2026-10-30T09:00:00Z"
}
```

Die tatsächlichen Werte für `id` und `createdAtUtc` werden serverseitig bestimmt. Die Antwort enthält außerdem einen `Location`-Header für den neu angelegten Kurs.

### Kurs aktualisieren

```http
PUT /api/courses/{id}
Authorization: Bearer <token>
Content-Type: application/json
```

```json
{
  "title": "Software Engineering – aktualisiert",
  "description": "Überarbeitete Beschreibung"
}
```

Die Antwort enthält die aktualisierte Kursrepräsentation.

### Kurse abrufen und löschen

`GET /api/courses` liefert eine JSON-Liste ausschließlich der Kurse des angemeldeten Benutzers. `GET /api/courses/{id}` liefert einen einzelnen eigenen Kurs. `DELETE /api/courses/{id}` entfernt einen eigenen Kurs und liefert bei Erfolg keinen Response-Body.

## Validierung

- `Title` ist erforderlich und darf nicht leer oder ausschließlich aus Leerzeichen bestehen.
- `Title` ist auf maximal 150 Zeichen begrenzt.
- `Description` ist optional und auf maximal 1.000 Zeichen begrenzt.
- Bei Erstellung und Aktualisierung werden führende und nachfolgende Leerzeichen aus Titel und Beschreibung entfernt.
- Ungültige Eingaben werden mit `400 Bad Request` zurückgewiesen.

Die Validierung erfolgt über Data Annotations in den Request-DTOs sowie eine zusätzliche Prüfung auf Leer- beziehungsweise Whitespace-Titel im Controller.

## Authentifizierung und Zugriffsschutz

Der `CoursesController` ist mit `[Authorize]` geschützt. Die Benutzer-ID wird aus dem authentifizierten Principal über `ClaimTypes.NameIdentifier` gelesen.

Datenbankabfragen nach einzelnen Kursen berücksichtigen sowohl die Kurs-ID als auch die Benutzer-ID. Dadurch können Benutzer keine Kurse anderer Benutzer abrufen, verändern oder löschen. Auch die Kursliste ist auf die eigenen Kurse beschränkt.

Für nicht angemeldete Zugriffe wird `401 Unauthorized` zurückgegeben. Ein nicht vorhandener oder fremder Kurs führt bei Einzelabfragen beziehungsweise Änderungs- und Löschoperationen zu `404 Not Found`; damit werden fremde Kurs-IDs nicht als zugänglich offengelegt.

## Fehlerbehandlung

| Situation | HTTP-Status |
| --- | --- |
| Kurs erfolgreich erstellt | `201 Created` |
| Abruf oder Aktualisierung erfolgreich | `200 OK` |
| Kurs erfolgreich gelöscht | `204 No Content` |
| Ungültige Eingabedaten | `400 Bad Request` |
| Fehlende oder ungültige Authentifizierung | `401 Unauthorized` |
| Kurs nicht vorhanden oder nicht im Besitz des Benutzers | `404 Not Found` |
| Fehlender oder nicht unterstützter JSON-Content-Type bei Body-Bindung | `415 Unsupported Media Type` |

Bei `POST` und `PUT` mit JSON-Body muss `Content-Type: application/json` gesetzt sein.

## Manuelle API-Tests

Die Endpunkte wurden lokal über `curl` gegen die laufende API getestet.

| Testfall | Erwartetes Ergebnis | Ergebnis |
| --- | --- | --- |
| Eigene Kursliste abrufen | `200 OK` | Bestanden |
| Kurs erstellen | `201 Created` | Bestanden |
| Einzelnen eigenen Kurs abrufen | `200 OK` | Bestanden |
| Kurs aktualisieren | `200 OK` | Bestanden |
| Leeren Kurstitel übermitteln | `400 Bad Request` | Bestanden |
| Nicht vorhandene Kurs-ID abrufen | `404 Not Found` | Bestanden |
| Ohne Token zugreifen | `401 Unauthorized` | Bestanden |
| Eigenen Kurs löschen | `204 No Content` | Bestanden |
