// Übersetzung der Namen aus dem Backend

import type { ExamType } from "../../api/types";

export const EXAM_TYPE_LABELS: Record<ExamType, string> = {
    WrittenExam: 'Klausur',
    ModuleExam: 'Modulprüfung',
    Workbook: 'Workbook',
    TermPaper: 'Hausarbeit',
    Thesis: 'Abschlussarbeit',
};

export const EXAM_TYPES: ExamType[] = [
  'WrittenExam',
  'ModuleExam',
  'Workbook',
  'TermPaper',
  'Thesis',
];
