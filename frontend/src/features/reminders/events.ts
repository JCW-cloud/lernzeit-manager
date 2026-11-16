
// Signal

export const PLANNED_CHANGED_EVENT = 'planned-sessions-changed';

export function announcePlannedChange(): void {
    window.dispatchEvent(new Event(PLANNED_CHANGED_EVENT));
}