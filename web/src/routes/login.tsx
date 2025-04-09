import React, { useState } from 'react';
import { supabase } from '@/lib/supabaseClient'; // Use path alias
import { useNavigate, createFileRoute, Link } from '@tanstack/react-router'; // Add Link for signup
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
            // TODO: Check for redirect search param
            navigate({ to: '/' });
        } catch (err: unknown) {
            if (err instanceof Error) {
                console.error('Login error:', err.message);
                setError(err.message);
            } else if (typeof err === 'object' && err !== null && 'error_description' in err && typeof (err as any).error_description === 'string') {
                setError((err as any).error_description);
            } else {
                console.error('Login error:', err);
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
                    <CardTitle className="text-2xl">Login</CardTitle>
                    <CardDescription>
                        Enter your email below to login to your account.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleLogin}>
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
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                            />
                        </div>
                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                    </CardContent>
                    <CardFooter className="flex flex-col gap-4">
                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? 'Logging in...' : 'Sign in'}
                        </Button>
                        <div className="text-center text-sm">
                            Don't have an account?{" "}
                            <Link to="/signup" className="underline">
                                Sign up
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
