'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import Link from 'next/link';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [movieCount, setMovieCount] = useState(0);
  const [theaterCount, setTheaterCount] = useState(0);
  const [showtimeCount, setShowtimeCount] = useState(0);
  const [bookingCount, setBookingCount] = useState(0);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdminStatus = async () => {
      try {
        setLoading(true);
        
        // Check if user is an admin
        const { data, error } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        
        if (!data || data.role !== 'admin') {
          // Not an admin, redirect to home
          router.push('/');
          return;
        }

        setIsAdmin(true);

        // Fetch dashboard stats
        const fetchStats = async () => {
          // Count movies
          const { count: movies, error: moviesError } = await supabase
            .from('movies')
            .select('*', { count: 'exact', head: true });
          
          if (moviesError) throw moviesError;
          setMovieCount(movies || 0);

          // Count theaters
          const { count: theaters, error: theatersError } = await supabase
            .from('theaters')
            .select('*', { count: 'exact', head: true });
          
          if (theatersError) throw theatersError;
          setTheaterCount(theaters || 0);

          // Count showtimes
          const { count: showtimes, error: showtimesError } = await supabase
            .from('showtimes')
            .select('*', { count: 'exact', head: true });
          
          if (showtimesError) throw showtimesError;
          setShowtimeCount(showtimes || 0);

          // Count bookings
          const { count: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('*', { count: 'exact', head: true });
          
          if (bookingsError) throw bookingsError;
          setBookingCount(bookings || 0);
        };

        await fetchStats();
      } catch (err) {
        console.error('Error checking admin status:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminStatus();
  }, [user, router]);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="bg-card rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-2xl font-bold mb-2">Admin Dashboard</h1>
            <p className="text-muted-foreground mb-6">Manage your cinema system</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-lg font-medium">Movies</h3>
                <p className="text-3xl font-bold mt-2">{movieCount}</p>
                <div className="mt-4">
                  <Link href="/admin/movies">
                    <Button className="w-full">Manage Movies</Button>
                  </Link>
                </div>
              </div>
              
              <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-lg font-medium">Theaters</h3>
                <p className="text-3xl font-bold mt-2">{theaterCount}</p>
                <div className="mt-4">
                  <Link href="/admin/theaters">
                    <Button className="w-full">Manage Theaters</Button>
                  </Link>
                </div>
              </div>
              
              <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-lg font-medium">Showtimes</h3>
                <p className="text-3xl font-bold mt-2">{showtimeCount}</p>
                <div className="mt-4">
                  <Link href="/admin/showtimes">
                    <Button className="w-full">Manage Showtimes</Button>
                  </Link>
                </div>
              </div>
              
              <div className="bg-background p-6 rounded-lg border border-border">
                <h3 className="text-lg font-medium">Bookings</h3>
                <p className="text-3xl font-bold mt-2">{bookingCount}</p>
                <div className="mt-4">
                  <Link href="/admin/bookings">
                    <Button className="w-full">View Bookings</Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
              <div className="space-y-4">
                <Link href="/admin/movies/new">
                  <Button className="w-full">Add New Movie</Button>
                </Link>
                <Link href="/admin/theaters/new">
                  <Button className="w-full">Add New Theater</Button>
                </Link>
                <Link href="/admin/showtimes/new">
                  <Button className="w-full">Schedule New Showtime</Button>
                </Link>
              </div>
            </div>
            
            <div className="bg-card rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">System Information</h2>
              <div className="space-y-2">
                <p><span className="font-medium">Admin:</span> {user?.user_metadata?.full_name}</p>
                <p><span className="font-medium">Email:</span> {user?.email}</p>
                <p><span className="font-medium">Last Login:</span> {new Date(user?.last_sign_in_at || '').toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}