
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

export function formatNumber(value: number): string {
    if(Number.isInteger(value)) {
        return String(value);
    }
    return value.toFixed(1).replace('.', ',');
}

// Date -> 'YYYY-MM-DD' in lokaler Zeit (toISOString wäre UTC)
export function toIsoDate(date: Date):string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

export function addMonths(months: number):string {
    const date = new Date();
    date.setMonth(date.getMonth() + months);
    return toIsoDate(date);
}

