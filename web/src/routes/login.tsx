import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient'; // Assuming client is here
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import styles from './auth.module.css'; // Create this CSS module

// Define the Route configuration
export const Route = createFileRoute('/login')({
  component: LoginPage, // Associate the component
});

export function LoginPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setLoading(true);
        try {
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: email,
                password: password,
            });
            if (signInError) {
                throw signInError;
            }
            console.log('Login successful');
            // Navigate to dashboard or home page after login
            navigate({ to: '/' });
        } catch (err: any) {
            console.error('Login error:', err.message);
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <h2>Login</h2>
            <form onSubmit={handleLogin} className={styles.authForm}>
                <div>
                    <label htmlFor="email">Email</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <div>
                    <label htmlFor="password">Password</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </button>
                {error && <p className={styles.errorMessage}>{error}</p>}
            </form>
             <p>
                Don't have an account? {' '}
                <a href="/signup">Sign Up</a>
            </p>
        </div>
    );
} 