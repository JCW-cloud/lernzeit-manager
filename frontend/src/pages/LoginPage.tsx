import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { login, errorText} from '../api/client';
import { saveToken, isLoggedIn } from '../lib/auth';
import '../features/auth/auth.css';


export default function LoginPage() {

    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [busy, setBusy] = useState(false);

    if(isLoggedIn()){
        return <Navigate to="/" replace />
    }

    async function handleSubmit(event: React.FormEvent) {

        event.preventDefault();

        setError(null);
        setBusy(true);

        try {
            const result = await login({ email: email, password: password });
            saveToken(result.accessToken);
            navigate('/', { replace: true });
        } catch (err) {
            setError(errorText(err));
        } finally {
            setBusy(false);
        }

    }

    // Anzeige

    return(
        <div className="auth-page">
            <form className="auth-card" onSubmit={handleSubmit}>

                <h1>Anmelden</h1>

                <label>
                    Email
                    <input 
                        type="email"
                        value={email}
                        required
                        onChange={event => setEmail(event.target.value)}
                    />
                </label>

                <label>
                    Passwort
                    <input 
                        type="password"
                        value={password}
                        required
                        onChange={event => setPassword(event.target.value)}
                    />
                </label>

                {error !== null && <p className="auth-error">{error}</p>}

                <button type="submit" disabled={busy}>
                    {busy ? 'Anmelden...' : 'Anmelden'}
                </button>
            </form>
        </div>
    );
}