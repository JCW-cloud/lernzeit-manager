
// Uhrzeiten-Umrechnung

export function timeToMinutes(time: string): number {
    const parts = time.split(':');
    return Number(parts[0]) * 60 + Number(parts[1]);
}

export function minutesToTime(total: number): string {
    const inDay = total % 1440;
    const hours = Math.floor(inDay / 60);
    const minutes = inDay % 60;
    return String(hours).padStart(2, '0') + ':' + String(minutes).padStart(2, '0');
}

export function monthPrefix(year: number, month: number): string {
    return year + '-' + String(month + 1).padStart(2, '0');
}

export function longMonthLabel(year: number, month: number): string {
    return new Date(year, month, 1).toLocaleDateString('de-DE', {
        month: 'long',
        year: 'numeric',
    });
}