'use client';

import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';
import { supabase } from '@/lib/supabase';

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

type Showtime = {
  id: string;
  movie_id: string;
  theater_id: string;
  theater_name: string;
  theater_city: string;
  date: string;
  time: string;
  price: number;
};

type GroupedShowtimes = {
  date: string;
  theaters: {
    id: string;
    name: string;
    times: {
      id: string;
      time: string;
      price: number;
    }[];
  }[];
};

import { use } from 'react';

export default function MovieDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const unwrappedParams = use(params);
  const [movie, setMovie] = useState<Movie | null>(null);
  const [showtimes, setShowtimes] = useState<GroupedShowtimes[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('movies')
          .select('*')
          .eq('id', unwrappedParams.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Movie not found');

        setMovie(data);

        // Fetch showtimes for this movie
        if (data.is_now_showing) {
          await fetchShowtimes(unwrappedParams.id);
        }
      } catch (err: any) {
        console.error('Error fetching movie:', err);
        setError(err.message || 'Failed to load movie');
      } finally {
        setLoading(false);
      }
    };

    fetchMovie();
  }, [unwrappedParams.id]);

  const fetchShowtimes = async (movieId: string) => {
    try {
      // Get current date in YYYY-MM-DD format
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const formattedToday = today.toISOString().split('T')[0];

      // Fetch showtimes with theater information
      const { data, error } = await supabase
        .from('showtimes')
        .select(`
          id,
          movie_id,
          theater_id,
          theaters(id, name, city),
          date,
          time,
          price
        `)
        .eq('movie_id', movieId)
        .gte('date', formattedToday) // Only get showtimes from today onwards
        .order('date')
        .order('time');

      if (error) throw error;

      // Transform the data to the format we need
      const formattedShowtimes: Showtime[] = data.map((item: any) => ({
        id: item.id,
        movie_id: item.movie_id,
        theater_id: item.theater_id,
        theater_name: item.theaters.name,
        theater_city: item.theaters.city,
        date: item.date,
        time: item.time,
        price: item.price
      }));

      // Group showtimes by date and theater
      const groupedByDate: { [key: string]: Showtime[] } = {};
      
      formattedShowtimes.forEach(showtime => {
        if (!groupedByDate[showtime.date]) {
          groupedByDate[showtime.date] = [];
        }
        groupedByDate[showtime.date].push(showtime);
      });

      // Format the grouped data for display
      const groupedShowtimes: GroupedShowtimes[] = Object.keys(groupedByDate).map(date => {
        const showtimesForDate = groupedByDate[date];
        
        // Group by theater
        const theaterMap: { [key: string]: {
          id: string;
          name: string;
          times: { id: string; time: string; price: number }[];
        }} = {};
        
        showtimesForDate.forEach(showtime => {
          if (!theaterMap[showtime.theater_id]) {
            theaterMap[showtime.theater_id] = {
              id: showtime.theater_id,
              name: `${showtime.theater_name} - ${showtime.theater_city}`,
              times: []
            };
          }
          
          theaterMap[showtime.theater_id].times.push({
            id: showtime.id,
            time: showtime.time,
            price: showtime.price
          });
        });

        // Format the date for display
        const dateObj = new Date(date);
        const formattedDate = dateObj.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'long', 
          day: 'numeric' 
        });
        
        // Check if date is today
        const isToday = dateObj.toDateString() === new Date().toDateString();
        const displayDate = isToday ? `Today, ${formattedDate}` : formattedDate;

        return {
          date: displayDate,
          theaters: Object.values(theaterMap)
        };
      });

      setShowtimes(groupedShowtimes);
    } catch (err) {
      console.error('Error fetching showtimes:', err);
    }
  };

  // If loading
  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <p>Loading...</p>
        </main>
        <Footer />
      </div>
    );
  }

  // If error or movie not found
  if (error || !movie) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-grow container mx-auto px-4 py-12 flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold mb-4">Movie Not Found</h1>
          <p className="mb-8">Sorry, the movie you're looking for doesn't exist.</p>
          <Link href="/movies">
            <Button>Back to Movies</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      {/* Hero Section with Backdrop */}
      <div className="relative w-full h-[400px] md:h-[500px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src={movie.backdrop}
            alt={movie.title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent" />
        </div>

        <div className="container mx-auto px-4 h-full flex items-end pb-8 relative z-10">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Movie Poster */}
            <div className="w-32 md:w-48 h-48 md:h-72 relative rounded-lg overflow-hidden shadow-lg flex-shrink-0 -mb-16 border-4 border-white">
              <Image
                src={movie.poster}
                alt={movie.title}
                fill
                className="object-cover"
              />
            </div>

            {/* Movie Info */}
            <div className="text-white">
              <div className="flex gap-2 mb-2">
                <Badge variant="age">{movie.rating}</Badge>
                {movie.is_now_showing && <Badge variant="now">Now Showing</Badge>}
                {movie.is_coming_soon && <Badge variant="soon">Coming Soon</Badge>}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{movie.title}</h1>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-sm">
                <span>{movie.duration} min</span>
                <span>•</span>
                <span>{Array.isArray(movie.genre) ? movie.genre.join(', ') : movie.genre}</span>
                <span>•</span>
                <span>{new Date(movie.release_date).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12 pt-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Movie Details */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold mb-4">Synopsis</h2>
            <p className="text-white-700 mb-8">{movie.description}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div>
                <h3 className="text-lg font-semibold mb-2">Director</h3>
                <p className="text-white-700">{movie.director}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Cast</h3>
                <ul className="text-white-700">
                  {Array.isArray(movie.cast) ? movie.cast.map((actor, index) => (
                    <li key={index}>{actor}</li>
                  )) : <li>No cast information available</li>}
                </ul>
              </div>
            </div>

            {/* Trailer Section */}
            <h2 className="text-2xl font-bold mb-4">Trailer</h2>
            <div className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center mb-8">
              <div className="text-center">
                <p className="text-gray-500 mb-2">Trailer placeholder</p>
                <Button variant="secondary">Watch Trailer</Button>
              </div>
            </div>
          </div>

          {/* Showtimes */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-secondary text-white p-4">
                <h2 className="text-xl font-bold">Showtimes</h2>
              </div>

              <div className="p-4">
                {movie.is_now_showing ? (
                  <>
                    {showtimes.length > 0 ? (
                      <>
                        {showtimes.map((day, dayIndex) => (
                          <div key={dayIndex} className="mb-6 last:mb-0">
                            <h3 className="font-semibold text-lg mb-3 text-black">{day.date}</h3>
                            
                            {day.theaters.map((theater, theaterIndex) => (
                              <div key={theaterIndex} className="mb-4 last:mb-0">
                                <h4 className="font-medium text-gray-800 mb-2">{theater.name}</h4>
                                <div className="flex flex-wrap gap-2">
                                  {theater.times.map((timeSlot, timeIndex) => (
                                    <Link
                                      key={timeIndex}
                                      href={`/booking/${timeSlot.id}`}
                                    >
                                      <button
                                        className="px-3 py-2 border border-gray-300 rounded-md text-sm text-black hover:bg-gray-50 hover:border-primary hover:text-primary transition-colors"
                                      >
                                        {timeSlot.time} - Rp {timeSlot.price.toLocaleString()}
                                      </button>
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        ))}
                      </>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-gray-500 mb-4">No showtimes available for this movie.</p>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-500 mb-4">This movie is coming soon. Get notified when tickets are available.</p>
                    <Button variant="outline" className="w-full">Set Reminder</Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}