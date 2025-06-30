'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string, name: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Fungsi untuk menambahkan delay untuk menghindari rate limit
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Variabel untuk melacak waktu terakhir refresh session
let lastRefreshTime = 0;
const MIN_REFRESH_INTERVAL = 5000; // 5 detik

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fungsi untuk refresh session dengan rate limiting
  const refreshSession = async () => {
    try {
      const now = Date.now();
      // Cek apakah sudah cukup waktu sejak refresh terakhir
      if (now - lastRefreshTime < MIN_REFRESH_INTERVAL) {
        // Jika belum cukup waktu, tunggu sebentar
        await delay(MIN_REFRESH_INTERVAL - (now - lastRefreshTime));
      }
      
      // Update waktu refresh terakhir
      lastRefreshTime = Date.now();
      
      const { data, error } = await supabase.auth.refreshSession();
      
      if (!error && data.session) {
        setSession(data.session);
        setUser(data.session.user);
      }
      
      return { error };
    } catch (error) {
      console.error('Error refreshing session:', error);
      return { error };
    }
  };

  useEffect(() => {
    // Get session from Supabase
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error fetching session:', error);
        } else {
          setSession(session);
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Unexpected error fetching session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        
        // Jika session ada tapi akan kedaluwarsa dalam 10 menit, refresh
        if (session && session.expires_at) {
          const expiresAt = session.expires_at * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeUntilExpiry = expiresAt - now;
          
          // Jika session akan kedaluwarsa dalam 10 menit (600000 ms)
          if (timeUntilExpiry < 600000 && timeUntilExpiry > 0) {
            console.log('Session will expire soon, refreshing...');
            await refreshSession();
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { error };
    } catch (error) {
      console.error('Error during sign in:', error);
      return { error };
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      // Create auth user
      const { error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        return { error: signUpError };
      }

      // Get the newly created user
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Create user profile in users table
        const { error: profileError } = await supabase
          .from('users')
          .insert([
            {
              id: user.id,
              name,
              email,
              role: 'user', // Default role
            },
          ]);

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          return { error: profileError };
        }
      }

      return { error: null };
    } catch (error) {
      console.error('Error during sign up:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Error during sign out:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}