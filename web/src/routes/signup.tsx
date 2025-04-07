import React, { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate, createFileRoute } from '@tanstack/react-router';
import styles from './auth.module.css'; // Re-use the same CSS module

// Define the Route configuration
export const Route = createFileRoute('/signup')({
  component: SignupPage, // Associate the component
});

export function SignupPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const handleSignup = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError(null);
        setMessage(null);
        setLoading(true);
        try {
            const { error: signUpError } = await supabase.auth.signUp({
                email: email,
                password: password,
                // Add options like email confirmation if desired
                // options: {
                //   emailRedirectTo: 'http://localhost:5173/login',
                // }
            });
            if (signUpError) {
                throw signUpError;
            }
            setMessage('Signup successful! Please check your email to confirm your account if required, then log in.');
            // Optionally redirect immediately or wait for confirmation
            // navigate({ to: '/login' });
        } catch (err: any) {
            console.error('Signup error:', err.message);
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authContainer}>
            <h2>Sign Up</h2>
            <form onSubmit={handleSignup} className={styles.authForm}>
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
                        minLength={6} // Supabase default minimum
                        disabled={loading}
                    />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Signing up...' : 'Sign Up'}
                </button>
                {error && <p className={styles.errorMessage}>{error}</p>}
                {message && <p className={styles.successMessage}>{message}</p>}
            </form>
             <p>
                Already have an account? {' '}
                <a href="/login">Login</a>
            </p>
        </div>
    );
} 