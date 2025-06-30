'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';

type Booking = {
  id: string;
  created_at: string;
  movie_title: string;
  theater_name: string;
  showtime: string;
  seats: string[];
  total_amount: number;
  status: string;
};

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }
    
    // Check for payment success message in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment') === 'success') {
      setSuccessMessage('Payment completed successfully! Your tickets are confirmed.');
      
      // Remove the query parameter from the URL without refreshing the page
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
    
    const fetchBookings = async () => {
      try {
        setLoading(true);
        
        // Fetch bookings from Supabase
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            created_at,
            total_price,
            status,
            showtimes!inner(time, date, theaters!inner(name), movies!inner(title))
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Fetch seats for each booking
        const bookingsWithSeats = await Promise.all(
          data.map(async (booking) => {
            const { data: seatData, error: seatError } = await supabase
              .from('booking_seats')
              .select('seats(row, number)')
              .eq('booking_id', booking.id);

            if (seatError) throw seatError;

            const seatLabels = seatData.map(item => `${item.seats.row}${item.seats.number}`);

            // Format the showtime date and time
            const formattedShowtime = `${booking.showtimes.date} at ${booking.showtimes.time}`;
            
            return {
              id: booking.id,
              created_at: booking.created_at,
              movie_title: booking.showtimes.movies.title,
              theater_name: booking.showtimes.theaters.name,
              showtime: formattedShowtime,
              seats: seatLabels,
              total_amount: booking.total_price, // Map total_price to total_amount for UI
              status: booking.status
            };
          })
        );

        setBookings(bookingsWithSeats);
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load booking history');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, router]);

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        {successMessage && (
          <div className="max-w-4xl mx-auto mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{successMessage}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setSuccessMessage(null)}>
              <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </span>
          </div>
        )}
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-md p-6 mb-8">
            <h1 className="text-2xl font-bold mb-6">My Profile</h1>
            
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-medium">Account Information</h2>
                <div className="mt-2 p-4 bg-background rounded border border-border">
                  <p><span className="font-medium">Name:</span> {user.user_metadata?.full_name}</p>
                  <p><span className="font-medium">Email:</span> {user.email}</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <Button onClick={handleSignOut} variant="destructive">
                  Sign Out
                </Button>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold mb-6">Booking History</h2>
            
            {loading ? (
              <div className="text-center py-8">
                <p>Loading your bookings...</p>
              </div>
            ) : error ? (
              <div className="text-center py-8 text-red-500">
                <p>{error}</p>
              </div>
            ) : bookings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>You haven't made any bookings yet.</p>
                <Button 
                  className="mt-4" 
                  onClick={() => router.push('/movies')}
                >
                  Browse Movies
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {bookings.map((booking) => (
                  <div key={booking.id} className="border border-border rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-lg">{booking.movie_title}</h3>
                        <p className="text-muted-foreground">
                          {booking.showtime}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          booking.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                        </span>
                      </div>
                    </div>
                    
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium">Theater</p>
                        <p>{booking.theater_name}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Seats</p>
                        <p>{booking.seats.join(', ')}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Booking Date</p>
                        <p>{new Date(booking.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Total Amount</p>
                        <p>IDR {booking.total_amount.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}