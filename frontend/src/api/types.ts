
// ------------ Kurse ----------------

// Erlaubte Prüfungsarten
export type ExamType = 
    | 'WrittenExam' // Klausur
    | 'ModuleExam'  // Modulprüfung
    | 'Workbook'    // Workbook
    | 'TermPaper'   // Hausarbeit
    | 'Thesis';     //Abschlussarbeit


export interface Course {
    id: string;
    title: string;
    description: string | null;    // Im Frontend als Kürzel
    createdAtUtc: string;
    targetDate: string | null;
    examType: ExamType | null;
    examTry: number | null;
    expectedTimeMinutes: number | null; // Aufwand in Minuten
}

export interface CourseInput {
    title: string;
    description: string | null;
    targetDate: string | null;
    examType: ExamType | null;
    examTry: number | null;
    expectedTimeMinutes: number | null;
}

// -------------- Auth ---------------
export interface LoginRequest {
    email: string;
    password: string;
}

export interface TokenResponse {
    tokenType: string;
    accessToken: string;
    expiresIn: number;      // sekunden
    refreshToken: string;
}