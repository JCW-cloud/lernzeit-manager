# API-Dokumentation – Benutzerverwaltung

## 1. Allgemeines

Die Backend-API basiert auf ASP.NET Core Web API und verwendet ASP.NET Core Identity zur Benutzerverwaltung.

- **Datenformat:** JSON
- **Authentifizierung:** Bearer-Token
- **Basis-URL:** `http://localhost:5000`
- **Zeichensatz:** UTF-8

Der tatsächliche Port ist der Konsolenausgabe der laufenden API zu entnehmen.

## 2. Registrierung

**Endpunkt:** `POST /api/auth/register`

Keine vorherige Anmeldung erforderlich.

Request:

```json
{
  "email": "test@example.com",
  "password": "TestPasswort123"
}
```

Die E-Mail-Adresse muss eindeutig sein. Das Passwort muss die konfigurierte Identity-Passwortregel erfüllen.

## 3. Anmeldung

**Endpunkt:** `POST /api/auth/login?useCookies=false`

Request:

```json
{
  "email": "test@example.com",
  "password": "TestPasswort123"
}
```

Bei erfolgreicher Anmeldung liefert die API ein Zugriffstoken. Dieses wird bei geschützten Anfragen im Authorization-Header übermittelt.

## 4. Eigenes Profil abrufen

**Endpunkt:** `GET /api/users/me`

Authentifizierung erforderlich.

Erfolgreiche Response (`200 OK`), beispielhaft:

```json
{
  "id": "BENUTZER-ID",
  "email": "test@example.com",
  "displayName": "Kevin",
  "createdAtUtc": "2026-10-26T09:00:00Z"
}
```

Die Werte sind beispielhaft. Die tatsächlichen Daten stammen aus dem Benutzerkonto.

## 5. Anzeigenamen ändern

**Endpunkt:** `PUT /api/users/me`

Authentifizierung erforderlich.

Request:

```json
{
  "displayName": "Kevin"
}
```

Der Anzeigename muss zwischen 2 und 80 Zeichen lang sein. Bei Erfolg gibt die API das aktualisierte Profil mit `200 OK` zurück.

## 6. Passwort ändern

**Endpunkt:** `POST /api/users/me/change-password`

Authentifizierung erforderlich.

Request:

```json
{
  "currentPassword": "BisherigesTestPasswort123",
  "newPassword": "NeuesTestPasswort123"
}
```

Das bisherige Passwort muss korrekt sein. Das neue Passwort muss die konfigurierte Identity-Passwortregel erfüllen.

Bei Erfolg antwortet die API mit `204 No Content`.

## 7. Eigenes Konto löschen

**Endpunkt:** `DELETE /api/users/me`

Authentifizierung erforderlich.

Es wird kein Request-Body benötigt. Die API bestimmt das zu löschende Konto anhand des authentifizierten Benutzers.

Bei Erfolg antwortet die API mit `204 No Content`. Das Löschen ist eine dauerhafte Aktion.

## 8. Wichtige HTTP-Statuscodes

| Statuscode | Bedeutung |
|---|---|
| `200 OK` | Anfrage erfolgreich, Antwort enthält Daten |
| `204 No Content` | Anfrage erfolgreich, keine Antwortdaten |
| `400 Bad Request` | Eingabedaten ungültig oder Anfrage fehlerhaft |
| `401 Unauthorized` | Anmeldung fehlt oder ist ungültig |
| `404 Not Found` | Angeforderte Ressource wurde nicht gefunden |

Die tatsächlichen Statuscodes und Antwortformate sind im Rahmen der API-Tests zu überprüfen und gegebenenfalls zu ergänzen.

## 9. Durchgeführte API-Tests

| Test | Ergebnis | Info |
| --- | --- | --- |
| Login ohne User-Konto | HTTP/1.1 401 Unauthorized | |
|Ungültigen Anzeigenamen setzen (weniger als 2 Zeichen)| HTTP/1.1 400 Bad Request |The field DisplayName must be a string with a minimum length of 2 and a maximum length of 80.|
|Falsches Passwort bei Änderung|HTTP/1.1 400 Bad Request|"PasswordMismatch":["Incorrect password."]|
|Anmeldung mit falschem Passwort|HTTP/1.1 401 Unauthorized| "detail":"Failed"|
|Doppelte Registrierung|HTTP/1.1 400 Bad Request|"DuplicateUserName":["Username 'test@example.com' is already taken."|

