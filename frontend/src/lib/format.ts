
// Volles Datum
export function formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-AT');
}

// Kurzes Datum
export function formatShortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('de-AT', {
        day: '2-digit',
        month: '2-digit',
    });
}

// Minuten zu Stunden
export function formatHours(minutes: number): string {
    const hours = minutes / 60;
    
    if(Number.isInteger(hours)) {
        return hours + ' h';
    }
    // Bei Komma Deutsches Komma
    return hours.toFixed(1).replace('.',',') + ' h';
}

