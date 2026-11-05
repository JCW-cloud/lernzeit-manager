import { getToken,clearToken } from "../lib/auth";
import type { LoginRequest,RegisterRequest,TokenResponse } from "./types";

const BASE = '/api';

export class ApiError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.status = status;
    }
}

// übersetzungstabelle
const IDENTITY_MESSAGES: Record<string, string> = {
    DuplicateUserName: 'Diese E-mail-Adresse ist bereits registriert.',
    DuplicateEmail: 'Diese E-mail-Adresse ist bereits registriert.',
    InvalidEmail: 'Ungültige E-mail.',
    PasswordTooShort: 'Das Passwort benötigt mindestens 12 Zeichen.',
    PasswordRequiresDigit: 'Das Passwort muss mindestens eine Zahl enthalten.',
    PasswordRequiresUpper: 'Das Passwort muss mindestens einen Großbuchstaben enthalten.',
    PasswordRequiresLower: 'Das Passwort muss mindestens einen Kleinbuchstaben enthalten.',
};

// 401: falsche login Daten
function readErrorMessage(status: number, body: any): string {
    if (status === 401){
        return 'Email oder Passwort falsch.';
    }
    if (body !== null && body.errors !== undefined) {
        const messages: string[] = [];

        for (const key of Object.keys(body.errors)) {
            const german = IDENTITY_MESSAGES[key];

            if (german !== undefined) {
                messages.push(german);
            } else {
                messages.push(...body.errors[key]);
            }
        }
        return messages.join(' ');
    }
    if (body !== null && body.detail !== undefined) {
        return body.detail;
    }
    return 'Fehler ' + status;
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
        headers['Authorisation'] = 'Bearer' + token;
    }

    // Anfrage abschicken
    const response = await fetch(BASE + path, {...options, headers });

    // Antwort lesen
    const text = await response.text();

    let body: any = null;
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
            clearToken;
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

export function register(data: RegisterRequest): Promise<void> {
    return request<void>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
    });
}