
// Monatsspalten
export interface MonthInfo {
    year: number;
    month: number;
    label: string;
}

export function nextMonths(count: number): MonthInfo[] {
    const result: MonthInfo[] = [];
    const now = new Date();

    for(let i = 0; i < count; i++) {
        const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
    

        result.push({
            year: date.getFullYear(),
            month: date.getMonth(),
            label: date.toLocaleDateString('de-AT', { month: 'short', year: '2-digit' }),
        });
    }  
    return result;
}

export function monthIndex(isoDate: string, start: MonthInfo): number {
    const parts = isoDate.split('-');
    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;

    return (year - start.year) * 12 + (month - start.month);
}