
// Banner: Fragt nach Erlaubnis für Erinnerungen + erledigt die Erinnerungen falls keine Erlaubnis vorliegt

import type { Reminders } from './useReminders';
import './reminders.css';

interface ReminderBannerProps {
    reminders: Reminders;
}

export default function ReminderBanner({ reminders }: ReminderBannerProps) {
    const showAsk = reminders.permission === 'default' && !reminders.askHidden;

    if (!showAsk && reminders.inApp.length === 0) {
        return null;
    }

    return (
        <div className="reminder-area">
            {showAsk && (
                <div className="reminder-banner reminder-ask">
                    <span>Erinnerungen an geplante Lernzeiten aktivieren?</span>
                    <button className="reminder-primary" onClick={reminders.requestPermission}>
                        Aktivieren
                    </button>
                    <button className="reminder-secondary" onClick={reminders.hideAsk}>
                        Später
                    </button>
                </div>
            )}

            {reminders.inApp.map(item => (
                <div key={item.id} className="reminder-banner">
                    <span>{item.text}</span>
                    <button
                        className="reminder-close"
                        title="Schließen"
                        onClick={() => reminders.dismiss(item.id)}
                    >
                        ×
                    </button>
                </div>
            ))}
        </div>
    );

}