'use client';

import React, { useEffect, useState } from 'react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { MovieGrid } from '@/components/organisms/MovieGrid';
import { supabase } from '@/lib/supabase';

type Movie = {
  id: string;
  title: string;
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

export default function MoviesPage() {
  const [activeTab, setActiveTab] = React.useState('nowShowing');
  const [nowShowingMovies, setNowShowingMovies] = useState<Movie[]>([]);
  const [comingSoonMovies, setComingSoonMovies] = useState<Movie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        
        // Fetch now showing movies
        const { data: nowShowingData, error: nowShowingError } = await supabase
          .from('movies')
          .select('*')
          .eq('is_now_showing', true)
          .order('release_date', { ascending: false });

        if (nowShowingError) throw nowShowingError;
        
        // Fetch coming soon movies
        const { data: comingSoonData, error: comingSoonError } = await supabase
          .from('movies')
          .select('*')
          .eq('is_coming_soon', true)
          .order('release_date', { ascending: true });

        if (comingSoonError) throw comingSoonError;
        
        setNowShowingMovies(nowShowingData || []);
        setComingSoonMovies(comingSoonData || []);
      } catch (err: any) {
        console.error('Error fetching movies:', err);
        setError(err.message || 'Failed to load movies');
      } finally {
        setLoading(false);
      }
    };

    fetchMovies();
  }, []);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-secondary">Movies</h1>
        
        {/* Movie Navigation Buttons */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab('nowShowing')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'nowShowing' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Now Showing
          </button>
          <button
            onClick={() => setActiveTab('comingSoon')}
            className={`px-6 py-2 rounded-md font-medium transition-colors ${activeTab === 'comingSoon' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-800 hover:bg-gray-300'}`}
          >
            Coming Soon
          </button>
        </div>
        
        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <p>Loading movies...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Now Showing Movies */}
        {!loading && !error && activeTab === 'nowShowing' && (
          <section className="mb-12">
            {nowShowingMovies.length > 0 ? (
              <MovieGrid 
                movies={nowShowingMovies.map(movie => ({
                  id: movie.id,
                  title: movie.title,
                  poster: movie.poster,
                  rating: movie.rating.toString(),
                  duration: `${movie.duration} min`,
                  releaseDate: new Date(movie.release_date).toLocaleDateString(),
                  isNowShowing: movie.is_now_showing,
                  isComingSoon: movie.is_coming_soon
                }))} 
                title="Now Showing" 
              />
            ) : (
              <p className="text-center py-8 text-gray-500">No movies currently showing</p>
            )}
          </section>
        )}
        
        {/* Coming Soon Movies */}
        {!loading && !error && activeTab === 'comingSoon' && (
          <section className="mb-12">
            {comingSoonMovies.length > 0 ? (
              <MovieGrid 
                movies={comingSoonMovies.map(movie => ({
                  id: movie.id,
                  title: movie.title,
                  poster: movie.poster,
                  rating: movie.rating.toString(),
                  duration: `${movie.duration} min`,
                  releaseDate: new Date(movie.release_date).toLocaleDateString(),
                  isNowShowing: movie.is_now_showing,
                  isComingSoon: movie.is_coming_soon
                }))} 
                title="Coming Soon" 
              />
            ) : (
              <p className="text-center py-8 text-gray-500">No upcoming movies</p>
            )}
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}