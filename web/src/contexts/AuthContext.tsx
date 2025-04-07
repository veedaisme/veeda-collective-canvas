import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
    session: Session | null;
    user: User | null;
    loading: boolean;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth state changes
        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                console.log("[Auth Listener] Event:", _event, "Session:", session);
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false); // Update loading state on change too
            }
        );

        // Cleanup listener on unmount
        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        setLoading(true); // Optional: indicate loading during sign out
        try {
            await supabase.auth.signOut();
            // Auth listener will handle setting session/user to null
        } catch (error: any) { // Type error as any
             console.error("Sign out error:", error.message);
        } finally {
             setLoading(false); // Reset loading state
        }
    };

    const value = {
        session,
        user,
        loading,
        signOut: handleSignOut,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 