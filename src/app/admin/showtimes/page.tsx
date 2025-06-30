'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import Link from 'next/link';

type Showtime = {
  id: string;
  movie_id: string;
  theater_id: string;
  date: string;
  time: string;
  price: number;
  created_at: string;
  updated_at: string;
  movie: {
    title: string;
    poster: string;
  };
  theater: {
    name: string;
    city: string;
  };
};

export default function AdminShowtimesPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showtimes, setShowtimes] = useState<Showtime[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const router = useRouter();

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdminAndLoadShowtimes = async () => {
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

        // Fetch showtimes with movie and theater details
        const { data: showtimesData, error: showtimesError } = await supabase
          .from('showtimes')
          .select(`
            *,
            movie:movie_id(title, poster),
            theater:theater_id(name, city)
          `)
          .order('date', { ascending: false });

        if (showtimesError) throw showtimesError;
        setShowtimes(showtimesData || []);
      } catch (err) {
        console.error('Error loading admin showtimes page:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadShowtimes();
  }, [user, router]);

  const handleDeleteShowtime = async (id: string) => {
    if (!confirm('Are you sure you want to delete this showtime? This action cannot be undone.')) {
      return;
    }

    try {
      // Check if showtime has any bookings
      const { count, error: countError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('showtime_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        alert(`Cannot delete this showtime because it has ${count} bookings. Cancel the bookings first.`);
        return;
      }

      // Delete the showtime
      const { error } = await supabase
        .from('showtimes')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update the showtimes list
      setShowtimes(showtimes.filter(showtime => showtime.id !== id));
      alert('Showtime deleted successfully');
    } catch (err) {
      console.error('Error deleting showtime:', err);
      alert('Failed to delete showtime. Please try again.');
    }
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const formatPrice = (price: number) => {
    return `IDR ${price.toLocaleString()}`;
  };

  const filteredShowtimes = showtimes.filter(showtime => {
    const matchesSearch = 
      showtime.movie?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      showtime.theater?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      showtime.theater?.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDate = dateFilter ? showtime.date === dateFilter : true;
    
    return matchesSearch && matchesDate;
  });

  // Get unique dates for filter
  const uniqueDates = Array.from(new Set(showtimes.map(s => s.date))).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
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
            <h1 className="text-2xl font-bold">Manage Showtimes</h1>
            <Link href="/admin/showtimes/new">
              <Button>Add New Showtime</Button>
            </Link>
          </div>

          <div className="bg-card rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search by movie, theater, or city..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
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
                      {formatDate(date)}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredShowtimes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No showtimes found. Add a new showtime to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-left">Movie</th>
                      <th className="py-3 px-4 text-left">Theater</th>
                      <th className="py-3 px-4 text-left">Date</th>
                      <th className="py-3 px-4 text-left">Time</th>
                      <th className="py-3 px-4 text-left">Price</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShowtimes.map((showtime) => (
                      <tr key={showtime.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="h-10 w-8 rounded-md overflow-hidden bg-muted relative">
                              {showtime.movie?.poster && (
                                <img 
                                  src={showtime.movie.poster} 
                                  alt={showtime.movie.title}
                                  className="object-cover w-full h-full"
                                />
                              )}
                            </div>
                            <span className="font-medium">{showtime.movie?.title}</span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div>
                            <div className="font-medium">{showtime.theater?.name}</div>
                            <div className="text-sm text-muted-foreground">{showtime.theater?.city}</div>
                          </div>
                        </td>
                        <td className="py-4 px-4">{formatDate(showtime.date)}</td>
                        <td className="py-4 px-4">{formatTime(showtime.time)}</td>
                        <td className="py-4 px-4">{formatPrice(showtime.price)}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/admin/showtimes/edit/${showtime.id}`}>
                              <Button variant="outline" size="sm">Edit</Button>
                            </Link>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-500 hover:text-red-700 border-red-200 hover:border-red-300 hover:bg-red-50"
                              onClick={() => handleDeleteShowtime(showtime.id)}
                            >
                              Delete
                            </Button>
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