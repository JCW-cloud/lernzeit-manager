
// ------------ Kurse ----------------
export interface Course {
    id: number;
    listId: number;
    courseTitle: string;
    courseShortName: string;
    creationDate: string;
    examType: string;
    examPassed: boolean;
    examTry: string;
    grade: number | null;
}

export type CourseInput = Pick<
    Course,
    'courseTitle' | 'courseShortName' | 'examType' | 'examTry'
>;

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