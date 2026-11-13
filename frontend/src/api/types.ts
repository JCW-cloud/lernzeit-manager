
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

// ------------Lernziele/Zwischenziele----------
export interface LearningGoal {
    id: string;
    courseId: string;
    title: string;
    description: string | null;  // im Frontend nicht verwendet
    startDate: string;           // schickt "heute"
    targetDate: string;          // Zieldatum des Zwischenziels
    targetHours: number | null;  // Aufwand in STUNDEN
    isCompleted: boolean;        // abgehakt?
    completedAtUtc: string | null;
}

export interface LearningGoalInput {
    title: string;
    description: string | null;
    startDate: string;
    targetDate: string;
    targetHours: number | null;
}

// ------------ Lernzeiten (gelernt) ------------
export type StudySessionType = 'Timer' | 'Manual';
export type StudySessionStatus = 'Running' | 'Paused' | 'Completed';

export interface StudySession {
    id: string;
    courseId: string;
    type: StudySessionType;
    status: StudySessionStatus;
    createdAtUtc: string;
    startedAtUtc: string | null;            // nur beim Timer
    currentRunStartedAtUtc: string | null;
    accumulatedSeconds: number;
    endedAtUtc: string | null;
    elapsedSeconds: number;
}


// ------------------- Auth --------------------
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