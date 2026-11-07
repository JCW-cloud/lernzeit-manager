import { getToken,clearToken } from "../lib/auth";
import type { LoginRequest, TokenResponse } from "./types";

const BASE = '/api';

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}



// Macht aus einer Fehlerantwort des Backends einen lesbaren Satz.
function readErrorMessage(status: number, body: unknown): string {

  // 401 = nicht angemeldet bzw. Login fehlgeschlagen
  if (status === 401) {
    return 'E-Mail oder Passwort falsch.';
  }

  // 500 und höher = Fehler im Server oder Server nicht erreichbar
  if (status >= 500) {
    return 'Server nicht erreichbar. Bitte später erneut versuchen.';
  }

  // Ist die Antwort ein Objekt, schauen wir hinein.
  if (typeof body === 'object' && body !== null) {

    const data = body as { errors?: Record<string, string[]>; detail?: string };

    // Format 1: { errors: { courseTitle: ["Titel fehlt"] } }
    const errors = data.errors;
    if (errors !== undefined) {
      const messages: string[] = [];

      for (const field of Object.keys(errors)) {
        for (const message of errors[field]) {
          messages.push(message);
        }
      }

      if (messages.length > 0) {
        return messages.join(' ');
      }
    }

    // Format 2: { detail: "..." }
    if (typeof data.detail === 'string') {
      return data.detail;
    }
  }

  // Nichts gefunden
  return 'Unerwarteter Fehler (Status ' + status + ').';
}

export function errorText(error: unknown): string { 
    if (error instanceof ApiError) {
        return error.message;
    } 
    return 'Server nicht erreichbar.';
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
    
    // header bauen
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    }

    const token = getToken();
    if (token !== null) {
        headers['Authorization'] = 'Bearer ' + token;
    }

    // Anfrage abschicken
    const response = await fetch(BASE + path, {...options, headers });

    // Antwort lesen
    const text = await response.text();

    let body: unknown = null;
    if (text !== '') {
        try{
            body = JSON.parse(text);
        } catch {
            body = null;
        }
    }

    // fehler behandeln
    if (!response.ok) {

        const isLoginCall = path.startsWith('/auth/login');
        if (response.status === 401 && !isLoginCall) {
            clearToken();
            window.location.assign('/login');
        }

        throw new ApiError(response.status, readErrorMessage(response.status, body));

    }
    
    return body as T;

}

//======================================================================
// Endpunkte
//======================================================================

// auth

export function login(data: LoginRequest): Promise<TokenResponse> {
    return request<TokenResponse>('/auth/login?useCookies=false', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}