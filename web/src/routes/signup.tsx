import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Define the Route configuration
export const Route = createFileRoute('/signup')({
  component: SignupPage, // Associate the component
});

export function SignupPage() {
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
                 options: {
                   // Redirect user to the app after email confirmation
                   emailRedirectTo: window.location.origin + '/login',
                 }
            });
            if (signUpError) {
                throw signUpError;
            }
            setMessage('Signup successful! Please check your email to confirm your account.');
            // Clear form on success
            setEmail('');
            setPassword('');
            // Don't redirect immediately, wait for confirmation
            // navigate({ to: '/login' });
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('Signup error:', err.message);
                setError(err.message);
            } else if (typeof err === 'object' && err !== null && 'error_description' in err && typeof (err as any).error_description === 'string') {
                setError((err as any).error_description);
            } else {
                console.error('Signup error:', err);
                setError(String(err));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background">
            <Card className="w-full max-w-sm">
                <CardHeader>
                    <CardTitle className="text-xl">Sign Up</CardTitle>
                    <CardDescription>
                        Enter your information to create an account
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSignup}>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6} // Keep Supabase minimum requirement visible
                                disabled={loading}
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                        {message && (
                            <p className="text-sm text-green-600">{message}</p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Creating account...' : 'Create account'}
                        </Button>
                         <div className="text-center text-sm">
                            Already have an account?{" "}
                            <Link to="/login" className="underline">
                                Sign in
                            </Link>
                        </div>
                    </CardFooter>
                 </form>
            </Card>
        </div>
    );
}
