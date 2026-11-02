
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