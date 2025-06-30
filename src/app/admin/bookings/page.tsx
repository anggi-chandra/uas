'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import Link from 'next/link';

type Booking = {
  id: string;
  created_at: string;
  user_id: string;
  showtime_id: string;
  total_price: number;
  status: string;
  user: {
    email: string;
    full_name: string;
  };
  showtime: {
    date: string;
    time: string;
    movie: {
      title: string;
    };
    theater: {
      name: string;
      city: string;
    };
  };
  seats: string[];
};

export default function AdminBookingsPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdminAndLoadBookings = async () => {
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

        // Fetch bookings with related data
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select(`
            id,
            created_at,
            user_id,
            showtime_id,
            total_price,
            status,
            user:user_id(email, full_name),
            showtime:showtime_id(date, time, movie:movie_id(title), theater:theater_id(name, city))
          `)
          .order('created_at', { ascending: false });

        if (bookingsError) throw bookingsError;

        // Fetch seats for each booking
        const bookingsWithSeats = await Promise.all(
          bookingsData.map(async (booking) => {
            const { data: seatData, error: seatError } = await supabase
              .from('booking_seats')
              .select('seats(row, number)')
              .eq('booking_id', booking.id);

            if (seatError) throw seatError;

            const seatLabels = seatData.map(item => `${item.seats.row}${item.seats.number}`);
            
            return {
              ...booking,
              seats: seatLabels
            };
          })
        );

        setBookings(bookingsWithSeats);
      } catch (err) {
        console.error('Error loading admin bookings page:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadBookings();
  }, [user, router]);

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatPrice = (price: number) => {
    return `IDR ${price.toLocaleString()}`;
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      // Update the bookings list
      setBookings(bookings.map(booking => 
        booking.id === id ? { ...booking, status: newStatus } : booking
      ));

      alert(`Booking status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating booking status:', err);
      alert('Failed to update booking status. Please try again.');
    }
  };

  // Get unique dates for filter
  const uniqueDates = Array.from(new Set(bookings.map(b => {
    const date = new Date(b.created_at);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  }))).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.showtime?.movie?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.showtime?.theater?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter ? booking.status === statusFilter : true;
    
    const matchesDate = dateFilter ? new Date(booking.created_at).toISOString().split('T')[0] === dateFilter : true;
    
    return matchesSearch && matchesStatus && matchesDate;
  });

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
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manage Bookings</h1>
          </div>

          <div className="bg-card rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search by user, email, movie, or theater..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="w-full md:w-auto px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">All Dates</option>
                  {uniqueDates.map(date => (
                    <option key={date} value={date}>
                      {new Date(date).toLocaleDateString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No bookings found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-left">ID</th>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">User</th>
                      <th className="py-3 px-4 text-left">Movie</th>
                      <th className="py-3 px-4 text-left">Theater</th>
                      <th className="py-3 px-4 text-left">Showtime</th>
                      <th className="py-3 px-4 text-left">Seats</th>
                      <th className="py-3 px-4 text-left">Price</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <span className="font-mono text-xs">{booking.id.substring(0, 8)}...</span>
                        </td>
                        <td className="py-4 px-4">{formatDate(booking.created_at)}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium">{booking.user?.full_name}</p>
                            <p className="text-xs text-muted-foreground">{booking.user?.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">{booking.showtime?.movie?.title}</td>
                        <td className="py-4 px-4">
                          <div>
                            <p>{booking.showtime?.theater?.name}</p>
                            <p className="text-xs text-muted-foreground">{booking.showtime?.theater?.city}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <p>{booking.showtime?.date}</p>
                            <p className="text-xs text-muted-foreground">{booking.showtime?.time}</p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex flex-wrap gap-1">
                            {booking.seats.map((seat, index) => (
                              <span 
                                key={index} 
                                className="inline-block px-2 py-1 text-xs rounded-full bg-muted"
                              >
                                {seat}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4 px-4">{formatPrice(booking.total_price)}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                            booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                            'bg-red-100 text-red-800'
                          }`}>
                            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            {booking.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Confirm
                              </Button>
                            )}
                            {booking.status !== 'cancelled' && (
                              <Button 
                                size="sm" 
                                variant="destructive" 
                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}