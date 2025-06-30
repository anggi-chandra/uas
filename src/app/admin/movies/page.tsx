'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { Button } from '@/components/atoms/Button';
import { supabase } from '@/lib/supabase';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import Link from 'next/link';
import Image from 'next/image';

type Movie = {
  id: string;
  title: string;
  description: string;
  poster: string;
  backdrop: string;
  duration: number;
  release_date: string;
  genre: string[];
  rating: number;
  director: string;
  cast: string[];
  is_now_showing: boolean;
  is_coming_soon: boolean;
};

export default function AdminMoviesPage() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalMovies, setTotalMovies] = useState(0);
  const moviesPerPage = 10;
  const router = useRouter();

  // Fungsi untuk mengambil jumlah total film
  const fetchTotalMovies = async () => {
    try {
      const { count, error } = await supabase
        .from('movies')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      setTotalMovies(count || 0);
    } catch (err) {
      console.error('Error fetching total movies count:', err);
    }
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login');
      return;
    }

    const checkAdminAndLoadMovies = async () => {
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

        // Ambil jumlah total film untuk pagination
        await fetchTotalMovies();

        // Optimasi: Fetch movies dengan pagination dan hanya kolom yang diperlukan
        const from = (currentPage - 1) * moviesPerPage;
        const to = from + moviesPerPage - 1;

        const { data: moviesData, error: moviesError } = await supabase
          .from('movies')
          .select('id, title, poster, duration, release_date, genre, rating, is_now_showing, is_coming_soon')
          .order('release_date', { ascending: false })
          .range(from, to);

        if (moviesError) throw moviesError;
        setMovies(moviesData || []);
      } catch (err) {
        console.error('Error loading admin movies page:', err);
      } finally {
        setLoading(false);
      }
    };

    checkAdminAndLoadMovies();
  }, [user, router, currentPage]);

  const handleDeleteMovie = async (id: string) => {
    if (!confirm('Are you sure you want to delete this movie? This action cannot be undone.')) {
      return;
    }

    try {
      // Check if movie has any showtimes
      const { count, error: countError } = await supabase
        .from('showtimes')
        .select('*', { count: 'exact', head: true })
        .eq('movie_id', id);

      if (countError) throw countError;

      if (count && count > 0) {
        alert(`Cannot delete this movie because it has ${count} showtimes scheduled. Remove the showtimes first.`);
        return;
      }

      // Delete the movie
      const { error } = await supabase
        .from('movies')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update the movies list
      setMovies(movies.filter(movie => movie.id !== id));
      alert('Movie deleted successfully');
      
      // Refresh total count
      fetchTotalMovies();
    } catch (err) {
      console.error('Error deleting movie:', err);
      alert('Failed to delete movie. Please try again.');
    }
  };

  // Fungsi untuk menangani pencarian
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset ke halaman pertama saat pencarian
  };

  // Fungsi untuk menangani filter status
  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    setCurrentPage(1); // Reset ke halaman pertama saat filter berubah
  };

  const filteredMovies = movies.filter(movie => {
    const matchesSearch = movie.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (Array.isArray(movie.genre) && movie.genre.some(g => g.toLowerCase().includes(searchTerm.toLowerCase())));
    
    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'now_showing' && movie.is_now_showing) || 
      (statusFilter === 'coming_soon' && movie.is_coming_soon) || 
      (statusFilter === 'archived' && !movie.is_now_showing && !movie.is_coming_soon);
    
    return matchesSearch && matchesStatus;
  });

  // Hitung jumlah halaman
  const totalPages = Math.ceil(totalMovies / moviesPerPage);

  if (loading || !isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Manage Movies</h1>
            <Link href="/admin/movies/new">
              <Button>Add New Movie</Button>
            </Link>
          </div>

          <div className="bg-card rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-grow">
                <input
                  type="text"
                  placeholder="Search by title or genre..."
                  value={searchTerm}
                  onChange={handleSearch}
                  className="w-full px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={handleStatusFilter}
                  className="w-full md:w-auto px-4 py-2 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="all">All Status</option>
                  <option value="now_showing">Now Showing</option>
                  <option value="coming_soon">Coming Soon</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>

            {filteredMovies.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No movies found. Add a new movie to get started.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="py-3 px-4 text-left">Movie</th>
                      <th className="py-3 px-4 text-left">Genre</th>
                      <th className="py-3 px-4 text-left">Duration</th>
                      <th className="py-3 px-4 text-left">Release Date</th>
                      <th className="py-3 px-4 text-left">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMovies.map((movie) => (
                      <tr key={movie.id} className="border-b border-border hover:bg-muted/50">
                        <td className="py-4 px-4">
                          <div className="flex items-center space-x-3">
                            <div className="relative w-12 h-16 overflow-hidden rounded">
                              {movie.poster ? (
                                <Image 
                                  src={movie.poster} 
                                  alt={movie.title}
                                  fill
                                  className="object-cover"
                                  loading="lazy"
                                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                              ) : (
                                <div className="w-full h-full bg-muted flex items-center justify-center">
                                  <span className="text-xs">No image</span>
                                </div>
                              )}
                            </div>
                            <div>
                              <p className="font-medium">{movie.title}</p>
                              <p className="text-xs text-muted-foreground">{movie.rating}/10</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">{Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}</td>
                        <td className="py-4 px-4">{movie.duration} min</td>
                        <td className="py-4 px-4">{new Date(movie.release_date).toLocaleDateString()}</td>
                        <td className="py-4 px-4">
                          {movie.is_now_showing && (
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 mr-1">
                              Now Showing
                            </span>
                          )}
                          {movie.is_coming_soon && (
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-1">
                              Coming Soon
                            </span>
                          )}
                          {!movie.is_now_showing && !movie.is_coming_soon && (
                            <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Archived
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end space-x-2">
                            <Link href={`/admin/movies/edit/${movie.id}`}>
                              <Button variant="outline" size="sm">Edit</Button>
                            </Link>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteMovie(movie.id)}
                            >
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <div className="flex space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center px-4">
                        <span className="text-sm">
                          Page {currentPage} of {totalPages}
                        </span>
                      </div>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}