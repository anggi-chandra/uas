'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Hero } from '@/components/organisms/Hero';
import { MovieGrid } from '@/components/organisms/MovieGrid';
import { MovieCard } from '@/components/molecules/MovieCard';
import { featuredMovie } from '@/data/movies';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Movie = {
  description: string;
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

export function HomePage() {
  const [showAllNowShowing, setShowAllNowShowing] = useState(false);
  const [showAllComingSoon, setShowAllComingSoon] = useState(false);
  const [nowShowingMovies, setNowShowingMovies] = useState<Movie[]>([]);
  const [comingSoonMovies, setComingSoonMovies] = useState<Movie[]>([]);
  const [featuredMovieData, setFeaturedMovieData] = useState<Movie | null>(null);
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
        
        // Set featured movie (first now showing movie or use default)
        if (nowShowingData && nowShowingData.length > 0) {
          setFeaturedMovieData(nowShowingData[0]);
        }
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
      <main className="flex-grow">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <p>Loading featured movie...</p>
          </div>
        ) : (
          <Hero movie={featuredMovieData ? {
            id: featuredMovieData.id,
            title: featuredMovieData.title,
            description: featuredMovieData.description,
            backdrop: featuredMovieData.backdrop,
            poster: featuredMovieData.poster,
            rating: featuredMovieData.rating.toString(),
            duration: `${featuredMovieData.duration} min`,
            releaseDate: new Date(featuredMovieData.release_date).toLocaleDateString(),
            isNowShowing: featuredMovieData.is_now_showing
          } : featuredMovie} />
        )}
        
        <div className="container mx-auto px-4 py-12 space-y-12">
          {/* Now Showing Movies with Slider */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary">Lagi tayang</h2>
              <button 
                onClick={() => setShowAllNowShowing(!showAllNowShowing)}
                className="text-primary text-sm font-medium hover:underline"
              >
                {showAllNowShowing ? 'Tampilkan 4 film' : 'Lihat semua >'}
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
            
            {!loading && !error && (
              showAllNowShowing ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {nowShowingMovies.length > 0 ? (
                    nowShowingMovies.map((movie, index) => (
                      <div key={movie.id} className="relative">
                        <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <MovieCard 
                          id={movie.id}
                          title={movie.title}
                          poster={movie.poster}
                          rating={movie.rating.toString()}
                          duration={`${movie.duration} min`}
                          releaseDate={new Date(movie.release_date).toLocaleDateString()}
                          isNowShowing={movie.is_now_showing}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-gray-500 col-span-4">Tidak ada film yang sedang tayang</p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {nowShowingMovies.length > 0 ? (
                    <>
                      <button 
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          const container = document.getElementById('now-showing-container');
                          if (container) {
                            // Calculate the width of 4 cards plus gaps (240px * 4 + 6px * 3)
                            const slideWidth = (240 * 4) + (6 * 3);
                            container.scrollTo({ left: container.scrollLeft - slideWidth, behavior: 'smooth' });
                          }
                        }}
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div 
                        id="now-showing-container"
                        className="flex overflow-x-auto pb-4 hide-scrollbar gap-6 px-10 justify-center"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {nowShowingMovies.slice(0, 4).map((movie, index) => (
                          <div key={movie.id} className="flex-shrink-0 relative w-[240px]">
                            <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <MovieCard 
                              id={movie.id}
                              title={movie.title}
                              poster={movie.poster}
                              rating={movie.rating.toString()}
                              duration={`${movie.duration} min`}
                              releaseDate={new Date(movie.release_date).toLocaleDateString()}
                              isNowShowing={movie.is_now_showing}
                            />
                          </div>
                        ))}
                      </div>
                      <button 
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          const container = document.getElementById('now-showing-container');
                          if (container) {
                            // Calculate the width of 4 cards plus gaps (240px * 4 + 6px * 3)
                            const slideWidth = (240 * 4) + (6 * 3);
                            container.scrollTo({ left: container.scrollLeft + slideWidth, behavior: 'smooth' });
                          }
                        }}
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  ) : (
                    <p className="text-center py-8 text-gray-500">Tidak ada film yang sedang tayang</p>
                  )}
                </div>
              )
            )}
          </div>

          {/* Coming Soon Movies with Slider */}
          <div className="relative">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-secondary">Akan datang</h2>
              <button 
                onClick={() => setShowAllComingSoon(!showAllComingSoon)}
                className="text-primary text-sm font-medium hover:underline"
              >
                {showAllComingSoon ? 'Tampilkan 4 film' : 'Lihat semua >'}
              </button>
            </div>
            
            {!loading && !error && (
              showAllComingSoon ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {comingSoonMovies.length > 0 ? (
                    comingSoonMovies.map((movie, index) => (
                      <div key={movie.id} className="relative">
                        <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                          {index + 1}
                        </div>
                        <MovieCard 
                          id={movie.id}
                          title={movie.title}
                          poster={movie.poster}
                          rating={movie.rating.toString()}
                          duration={`${movie.duration} min`}
                          releaseDate={new Date(movie.release_date).toLocaleDateString()}
                          isComingSoon={movie.is_coming_soon}
                        />
                      </div>
                    ))
                  ) : (
                    <p className="text-center py-8 text-gray-500 col-span-4">Tidak ada film yang akan datang</p>
                  )}
                </div>
              ) : (
                <div className="relative">
                  {comingSoonMovies.length > 0 ? (
                    <>
                      <button 
                        className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          const container = document.getElementById('coming-soon-container');
                          if (container) {
                            // Calculate the width of 4 cards plus gaps (240px * 4 + 6px * 3)
                            const slideWidth = (240 * 4) + (6 * 3);
                            container.scrollTo({ left: container.scrollLeft - slideWidth, behavior: 'smooth' });
                          }
                        }}
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <div 
                        id="coming-soon-container"
                        className="flex overflow-x-auto pb-4 hide-scrollbar gap-6 px-10 justify-center"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                      >
                        {comingSoonMovies.slice(0, 4).map((movie, index) => (
                          <div key={movie.id} className="flex-shrink-0 relative w-[240px]">
                            <div className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm">
                              {index + 1}
                            </div>
                            <MovieCard 
                              id={movie.id}
                              title={movie.title}
                              poster={movie.poster}
                              rating={movie.rating.toString()}
                              duration={`${movie.duration} min`}
                              releaseDate={new Date(movie.release_date).toLocaleDateString()}
                              isComingSoon={movie.is_coming_soon}
                            />
                          </div>
                        ))}
                      </div>
                      <button 
                        className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10 p-2 rounded-full bg-white shadow-md hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          const container = document.getElementById('coming-soon-container');
                          if (container) {
                            // Calculate the width of 4 cards plus gaps (240px * 4 + 6px * 3)
                            const slideWidth = (240 * 4) + (6 * 3);
                            container.scrollTo({ left: container.scrollLeft + slideWidth, behavior: 'smooth' });
                          }
                        }}
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  ) : (
                    <p className="text-center py-8 text-gray-500">Tidak ada film yang akan datang</p>
                  )}
                </div>
              )
            )}
          </div>
          
          {/* Promotions Section */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-secondary">Special Offers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gradient-to-r from-primary to-secondary text-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold mb-2">Student Discount</h3>
                <p className="mb-4">Get 20% off on all movie tickets with your student ID.</p>
                <button className="bg-white text-primary px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
                  Learn More
                </button>
              </div>
              <div className="bg-gradient-to-r from-dark to-secondary text-white rounded-lg p-6 shadow-md">
                <h3 className="text-xl font-bold mb-2">Family Package</h3>
                <p className="mb-4">Special family package for 4 persons with free popcorn and drinks.</p>
                <button className="bg-white text-secondary px-4 py-2 rounded-md font-medium hover:bg-gray-100 transition-colors">
                  Learn More
                </button>
              </div>
            </div>
          </section>
          
          {/* Theater Locations */}
          <section>
            <h2 className="text-2xl font-bold mb-6 text-secondary">Our Theaters</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { name: 'Downtown Cinema', address: '123 Main St, Downtown' },
                { name: 'Westside Mall', address: '456 West Ave, Westside Mall' },
                { name: 'Eastside Plaza', address: '789 East Blvd, Eastside Plaza' },
              ].map((theater, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <h3 className="font-bold text-lg mb-1">{theater.name}</h3>
                  <p className="text-gray-600 text-sm mb-3">{theater.address}</p>
                  <button className="text-primary text-sm font-medium hover:underline">
                    View Schedule
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}