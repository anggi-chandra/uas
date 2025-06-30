'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/atoms/Button';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import Link from 'next/link';

type Movie = {
  id: string;
  title: string;
};

type Theater = {
  id: string;
  name: string;
  city: string;
};

export default function NewShowtimePage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  // Data for dropdowns
  const [movies, setMovies] = useState<Movie[]>([]);
  const [theaters, setTheaters] = useState<Theater[]>([]);

  // Form state
  const [movieId, setMovieId] = useState('');
  const [theaterId, setTheaterId] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [price, setPrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdminAndLoadData = async () => {
      try {
        setLoading(true);
        
        // Check if user is an admin using supabaseAdmin to bypass RLS
        const { data, error } = await supabaseAdmin
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

        // Load movies using supabaseAdmin to bypass RLS
        const { data: moviesData, error: moviesError } = await supabaseAdmin
          .from('movies')
          .select('id, title')
          .order('title');

        if (moviesError) throw moviesError;
        setMovies(moviesData || []);

        // Load theaters using supabaseAdmin to bypass RLS
        const { data: theatersData, error: theatersError } = await supabaseAdmin
          .from('theaters')
          .select('id, name, city')
          .order('name');

        if (theatersError) throw theatersError;
        setTheaters(theatersData || []);

        // Set default date to today
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        setDate(formattedDate);

      } catch (err) {
        console.error('Error loading data:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadData();
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!movieId || !theaterId || !date || !time || !price) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate price is a number
    const priceNumber = parseFloat(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      setError('Price must be a positive number.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Insert the new showtime using supabaseAdmin to bypass RLS
      const now = new Date().toISOString();
      const { error } = await supabaseAdmin
        .from('showtimes')
        .insert([
          {
            movie_id: movieId,
            theater_id: theaterId,
            date,
            time,
            price: priceNumber,
            created_at: now,
            updated_at: now
          },
        ],
        { returning: 'minimal' }); // Prevent automatic SELECT after INSERT to avoid RLS issues

      if (error) throw error;

      // Redirect to showtimes management page
      router.push('/admin/showtimes');
    } catch (err: any) {
      console.error('Error creating showtime:', err);
      setError(err.message || 'An error occurred while creating the showtime.');
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold">Add New Showtime</h1>
            <Link href="/admin/showtimes">
              <Button variant="outline">Back to Showtimes</Button>
            </Link>
          </div>

          <div className="bg-card rounded-lg shadow-md p-6">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-6">
                <div>
                  <label htmlFor="movie" className="block text-sm font-medium mb-2">
                    Movie <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="movie"
                    value={movieId}
                    onChange={(e) => setMovieId(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a movie</option>
                    {movies.map((movie) => (
                      <option key={movie.id} value={movie.id}>
                        {movie.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="theater" className="block text-sm font-medium mb-2">
                    Theater <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="theater"
                    value={theaterId}
                    onChange={(e) => setTheaterId(e.target.value)}
                    className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  >
                    <option value="">Select a theater</option>
                    {theaters.map((theater) => (
                      <option key={theater.id} value={theater.id}>
                        {theater.name} - {theater.city}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="date" className="block text-sm font-medium mb-2">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="date"
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="time" className="block text-sm font-medium mb-2">
                      Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="time"
                      type="time"
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="price" className="block text-sm font-medium mb-2">
                    Price (IDR) <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="1"
                    step="1000"
                    placeholder="e.g. 50000"
                    className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                  <p className="mt-1 text-sm text-muted-foreground">
                    Enter the price in IDR without commas or dots (e.g. 50000 for IDR 50,000)
                  </p>
                </div>

                <div className="pt-4 border-t border-border flex justify-end space-x-4">
                  <Link href="/admin/showtimes">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Create Showtime'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}