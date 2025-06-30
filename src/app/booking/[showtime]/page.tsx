'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

// Theater layout configuration
const theaterRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
const seatsPerRow = 12;

import { use } from 'react';

export default function BookingPage({ params }: { params: Promise<{ showtime: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [takenSeats, setTakenSeats] = useState<string[]>([]);
  const [ticketCount, setTicketCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [movieDetails, setMovieDetails] = useState({
    title: 'Loading...',
    theater: 'Loading...',
    date: 'Loading...',
    time: 'Loading...',
    price: 0,
    theaterId: '',
    showtimeId: ''
  });
  const [totalPrice, setTotalPrice] = useState(0);

  // Redirect if not logged in and fetch showtime details
  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/booking/${unwrappedParams.showtime}`));
      return;
    }
    
    const fetchShowtimeDetails = async () => {
      try {
        // The URL now contains the showtime ID directly
        const showtimeId = unwrappedParams.showtime;
        
        console.log('Fetching details for showtime ID:', showtimeId);
        
        // Fetch the showtime details with related movie and theater
        const { data: showtime, error: showtimeError } = await supabase
          .from('showtimes')
          .select(`
            id, 
            time, 
            date, 
            price,
            movie_id,
            theater_id,
            movies(id, title),
            theaters(id, name)
          `)
          .eq('id', showtimeId)
          .single();
        
        if (showtimeError) {
          console.error('Showtime fetch error:', showtimeError);
          throw showtimeError;
        }
        
        if (!showtime) {
          throw new Error(`Showtime with ID ${showtimeId} not found`);
        }
        
        console.log('Found showtime:', showtime);
        
        // Extract movie and theater details
        const movieData = showtime.movies;
        const theater = showtime.theaters;
        
        if (!movieData) {
          throw new Error(`Movie for showtime ${showtimeId} not found`);
        }
        
        if (!theater) {
          throw new Error(`Theater for showtime ${showtimeId} not found`);
        }
        
        console.log('Movie:', movieData.title);
        console.log('Theater:', theater.name);
        
        // Use the time field directly from the showtime data
        const time = showtime.time;
        
        setMovieDetails({
          title: movieData.title,
          theater: theater.name,
          date: showtime.date,
          time: time,
          price: parseFloat(showtime.price) || 75000, // Default price if not set
          theaterId: theater.id,
          showtimeId: showtime.id
        });
        
        // Fetch already booked seats for this showtime
        const { data: bookingsData, error: bookingsError } = await supabase
          .from('bookings')
          .select('id')
          .eq('showtime_id', showtime.id)
          .eq('status', 'confirmed'); // Only consider confirmed bookings
        
        if (bookingsError) {
          console.error('Error fetching bookings:', bookingsError);
          throw bookingsError;
        }
        
        // Get all booked seats for these bookings
        const bookedSeats: string[] = [];
        
        if (bookingsData && bookingsData.length > 0) {
          // Create an array of booking IDs
          const bookingIds = bookingsData.map(booking => booking.id);
          
          // Fetch all seats for these bookings
          const { data: seatData, error: seatError } = await supabase
            .from('booking_seats')
            .select('seats(row, number)')
            .in('booking_id', bookingIds);
          
          if (seatError) {
            console.error('Error fetching booked seats:', seatError);
            throw seatError;
          }
          
          // Format the seat labels (e.g., 'A1', 'B2')
          if (seatData && seatData.length > 0) {
            seatData.forEach(item => {
              if (item.seats) {
                bookedSeats.push(`${item.seats.row}${item.seats.number}`);
              }
            });
          }
        }
        
        // Set the taken seats
        setTakenSeats(bookedSeats);
        console.log('Booked seats:', bookedSeats);
        
        console.log('Set movie details:', {
          title: movieData.title,
          theater: theater.name,
          date: showtime.date,
          time: time,
          price: parseFloat(showtime.price) || 75000,
          theaterId: theater.id,
          showtimeId: showtime.id
        });
      } catch (err) {
        console.error('Error fetching showtime details:', err);
        setError('Failed to load showtime details. Please try again.');
      }
    };
    
    fetchShowtimeDetails();
  }, [user, router, unwrappedParams.showtime]);

  // Handle seat selection
  const toggleSeatSelection = (seat: string) => {
    if (takenSeats.includes(seat)) return; // Can't select taken seats
    
    if (selectedSeats.includes(seat)) {
      // Deselect the seat
      setSelectedSeats(selectedSeats.filter(s => s !== seat));
    } else {
      // Check if we've reached the ticket count limit
      if (selectedSeats.length < ticketCount) {
        setSelectedSeats([...selectedSeats, seat]);
      }
    }
  };

  // Handle ticket count change
  const handleTicketCountChange = (count: number) => {
    if (count < selectedSeats.length) {
      // If reducing tickets, remove excess selected seats
      setSelectedSeats(selectedSeats.slice(0, count));
    }
    setTicketCount(count);
  };

  // Update total price when seats or ticket count changes
  useEffect(() => {
    setTotalPrice(selectedSeats.length * movieDetails.price);
  }, [selectedSeats, movieDetails.price]);

  // Show booking confirmation dialog
  const showBookingConfirmation = () => {
    if (selectedSeats.length !== ticketCount) {
      alert(`Please select ${ticketCount} seats to continue.`);
      return;
    }
    
    // Show confirmation dialog
    setShowConfirmation(true);
  };
  
  // Handle booking submission after confirmation
  const handleBooking = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Verify user is logged in
      if (!user || !user.id) {
        console.error('User not logged in or user ID not available');
        throw new Error('You must be logged in to book tickets');
      }
      
      // Use the showtime ID from the movieDetails state
      const showtimeId = movieDetails.showtimeId;
      
      if (!showtimeId) {
        console.error('Showtime ID not available');
        throw new Error('Showtime details not loaded properly');
      }
      
      // Verify theater ID is available
      if (!movieDetails.theaterId) {
        console.error('Theater ID not available');
        throw new Error('Theater details not loaded properly');
      }
      
      // Log booking details
      console.log('Creating booking with:', {
        user_id: user.id,
        showtime_id: showtimeId,
        theater_id: movieDetails.theaterId,
        selected_seats: selectedSeats,
        total_price: totalPrice
      });
      
      // Create a new booking in the database
      const bookingInsert = {
        user_id: user.id,
        showtime_id: showtimeId,
        total_price: totalPrice,
        status: 'pending'
      };
      
      console.log('Inserting booking with data:', bookingInsert);
      
      // Check if user exists in the database
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error('Error checking user existence:', userError);
        // If user doesn't exist in the users table, create one
        if (userError.code === 'PGRST116') { // Not found error
          console.log('User not found in users table, creating user record');
          const { data: newUser, error: createUserError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email || '',
              full_name: user.user_metadata?.full_name || 'User',
              role: 'user'
            })
            .select()
            .single();
            
          if (createUserError) {
            console.error('Error creating user record:', createUserError);
            throw new Error(`Failed to create user record: ${createUserError.message}`);
          }
          
          console.log('User record created successfully:', newUser);
        } else {
          throw new Error(`Error checking user: ${userError.message}`);
        }
      } else {
        console.log('User exists in database:', userData);
      }
      
      // Create the booking
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert(bookingInsert)
        .select()
        .single();
      
      if (bookingError) {
        console.error('Error creating booking record:', bookingError);
        throw new Error(`Failed to create booking: ${bookingError.message}`);
      }
      
      if (!bookingData || !bookingData.id) {
        console.error('Booking created but no ID returned');
        throw new Error('Failed to create booking properly');
      }
      
      console.log('Booking created successfully:', bookingData);
      
      // For each selected seat, we need to find the actual seat ID in the database
      // and create a booking_seat record
      for (const seatLabel of selectedSeats) {
        try {
          // Extract row and number from seat label (e.g., 'A1' -> row='A', number=1)
          const row = seatLabel.charAt(0);
          const number = parseInt(seatLabel.substring(1));
          
          console.log(`Processing seat ${seatLabel}: row=${row}, number=${number}, theater_id=${movieDetails.theaterId}`);
          
          // Find the seat ID in the database
          const { data: seatData, error: seatError } = await supabase
            .from('seats')
            .select('id')
            .eq('row', row)
            .eq('number', number)
            .eq('theater_id', movieDetails.theaterId)
            .single();
          
          if (seatError) {
            console.log(`Seat ${seatLabel} not found, creating new seat`);
            // If seat not found, create it (for demo purposes)
            const seatInsert = {
              theater_id: movieDetails.theaterId,
              row: row,
              number: number,
              type: 'standard'
            };
            
            console.log('Inserting new seat with data:', seatInsert);
            
            const { data: newSeat, error: createSeatError } = await supabase
              .from('seats')
              .insert(seatInsert)
              .select()
              .single();
              
            if (createSeatError) {
              console.error(`Error creating seat ${seatLabel}:`, createSeatError);
              throw new Error(`Failed to create seat: ${createSeatError.message}`);
            }
            
            if (!newSeat || !newSeat.id) {
              console.error('Seat created but no ID returned');
              throw new Error('Failed to create seat properly');
            }
            
            console.log(`New seat created:`, newSeat);
            
            // Create a booking_seat record with the new seat
            const bookingSeatInsert = {
              booking_id: bookingData.id,
              seat_id: newSeat.id
            };
            
            console.log('Inserting booking_seat with data:', bookingSeatInsert);
            
            const { data: bookingSeatData, error: bookingSeatError } = await supabase
              .from('booking_seats')
              .insert(bookingSeatInsert)
              .select();
            
            if (bookingSeatError) {
              console.error(`Error creating booking_seat for new seat ${seatLabel}:`, bookingSeatError);
              throw new Error(`Failed to create booking seat: ${bookingSeatError.message}`);
            }
            
            console.log(`Booking seat record created for new seat ${seatLabel}:`, bookingSeatData);
          } else {
            if (!seatData || !seatData.id) {
              console.error(`Found seat ${seatLabel} but no ID returned`);
              throw new Error('Failed to retrieve seat ID properly');
            }
            
            console.log(`Found existing seat ${seatLabel}:`, seatData);
            
            // Create a booking_seat record with the existing seat
            const bookingSeatInsert = {
              booking_id: bookingData.id,
              seat_id: seatData.id
            };
            
            console.log('Inserting booking_seat with data:', bookingSeatInsert);
            
            const { data: bookingSeatData, error: bookingSeatError } = await supabase
              .from('booking_seats')
              .insert(bookingSeatInsert)
              .select();
            
            if (bookingSeatError) {
              console.error(`Error creating booking_seat for existing seat ${seatLabel}:`, bookingSeatError);
              throw new Error(`Failed to create booking seat: ${bookingSeatError.message}`);
            }
            
            console.log(`Booking seat record created for existing seat ${seatLabel}:`, bookingSeatData);
          }
        } catch (seatErr: any) {
          console.error(`Error processing seat ${seatLabel}:`, seatErr);
          throw new Error(`Failed to process seat ${seatLabel}: ${seatErr.message}`);
        }
      }
      
      console.log('All seats processed successfully, redirecting to payment page');
      
      // Hide confirmation dialog
      setShowConfirmation(false);
      
      // Redirect to payment page with booking ID
      router.push(`/booking/payment/${bookingData.id}`);
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(`Failed to create booking: ${err.message || 'Please try again.'}`);
      setShowConfirmation(false);
    } finally {
      setLoading(false);
    }
  };
  
  // Cancel booking confirmation
  const cancelBookingConfirmation = () => {
    setShowConfirmation(false);
  };

  if (!user) return null; // Will redirect in useEffect

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          {/* Booking Header */}
          <div className="mb-8">
            <Link href="/movies" className="text-primary hover:underline mb-4 inline-block">
              &larr; Back to Movies
            </Link>
            <h1 className="text-3xl font-bold mb-2 text-black">{movieDetails.title}</h1>
            <div className="flex flex-wrap gap-4 text-black">
              <p>{movieDetails.theater}</p>
              <p>•</p>
              <p>{movieDetails.date}</p>
              <p>•</p>
              <p>{movieDetails.time}</p>
            </div>
          </div>
          
          {/* Ticket Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-black">Select Tickets</h2>
            <div className="flex items-center gap-4">
              <p className="text-black">Number of Tickets:</p>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleTicketCountChange(Math.max(1, ticketCount - 1))}
                  className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center hover:bg-gray-400"
                  aria-label="Decrease ticket count"
                >
                  -
                </button>
                <span className="w-8 text-center text-black">{ticketCount}</span>
                <button 
                  onClick={() => handleTicketCountChange(Math.min(10, ticketCount + 1))}
                  className="w-8 h-8 rounded-full bg-gray-400 flex items-center justify-center hover:bg-gray-400"
                  aria-label="Increase ticket count"
                >
                  +
                </button>
              </div>
            </div>
          </div>
          
          {/* Seat Selection */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-black">Select Seats</h2>
            <p className="mb-2 text-black">Please select {ticketCount} seat{ticketCount !== 1 ? 's' : ''}.</p>
            
            {/* Seat Legend */}
            <div className="flex gap-6 mb-6">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-blue-800 rounded"></div>
                <span className="text-black">Available</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-green-400 rounded"></div>
                <span className="text-black">Selected</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-gray-400 rounded"></div>
                <span className="text-black">Taken ({takenSeats.length})</span>
              </div>
            </div>
            
            {/* Screen */}
            <div className="relative mb-10">
              <div className="h-2 bg-gray-300 w-3/4 mx-auto mb-2 rounded"></div>
              <p className="text-center text-sm text-black">SCREEN</p>
            </div>
            
            {/* Seats */}
            <div className="mb-8">
              {theaterRows.map((row) => (
                <div key={row} className="flex justify-center mb-2">
                  <div className="w-6 flex items-center justify-center font-bold text-black">{row}</div>
                  <div className="flex gap-1 flex-wrap justify-center">
                    {Array.from({ length: seatsPerRow }, (_, i) => {
                      const seatNumber = i + 1;
                      const seatId = `${row}${seatNumber}`;
                      const isSelected = selectedSeats.includes(seatId);
                      const isTaken = takenSeats.includes(seatId);
                      
                      return (
                        <button
                          key={seatId}
                          className={`w-8 h-8 rounded flex items-center justify-center text-sm
                            ${isSelected ? 'bg-green-400 text-white' : isTaken ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-800 hover:bg-gray-300'}`}
                          onClick={() => toggleSeatSelection(seatId)}
                          disabled={isTaken}
                          aria-label={`Seat ${seatId}`}
                        >
                          {seatNumber}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Booking Summary */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-black">Booking Summary</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between">
                <p className="text-black">Movie:</p>
                <p className="font-medium text-black">{movieDetails.title}</p>
              </div>
              
              <div className="flex justify-between">
                <p className="text-black">Theater:</p>
                <p className="font-medium text-black">{movieDetails.theater}</p>
              </div>
              
              <div className="flex justify-between">
                <p className="text-black">Date & Time:</p>
                <p className="font-medium text-black">{movieDetails.date}, {movieDetails.time}</p>
              </div>
              
              <div className="flex justify-between">
                <p className="text-black">Selected Seats:</p>
                <p className="font-medium text-black">
                  {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'None selected'}
                </p>
              </div>
              
              <div className="flex justify-between">
                <p className="text-black">Tickets:</p>
                <p className="font-medium text-black">{selectedSeats.length} × IDR {movieDetails.price.toLocaleString()}</p>
              </div>
              
              <div className="border-t pt-4 flex justify-between">
                <p className="font-bold text-black">Total:</p>
                <p className="font-bold text-black">IDR {totalPrice.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-between">
            <Link href="/movies">
              <Button variant="outline" className="text-white">Cancel</Button>
            </Link>
            <Button 
              onClick={showBookingConfirmation}
              disabled={selectedSeats.length !== ticketCount || loading}
              className="text-white"
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </Button>
          </div>
          
          {/* Booking Confirmation Modal */}
          {showConfirmation && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4 text-black">Confirm Booking</h2>
                
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between">
                    <p className="text-black">Movie:</p>
                    <p className="font-medium text-black">{movieDetails.title}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-black">Theater:</p>
                    <p className="font-medium text-black">{movieDetails.theater}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-black">Date & Time:</p>
                    <p className="font-medium text-black">{movieDetails.date} at {movieDetails.time}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-black">Selected Seats:</p>
                    <p className="font-medium text-black">{selectedSeats.join(', ')}</p>
                  </div>
                  
                  <div className="border-t pt-3 flex justify-between">
                    <p className="font-bold text-black">Total:</p>
                    <p className="font-bold text-black">IDR {totalPrice.toLocaleString()}</p>
                  </div>
                </div>
                
                <div className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={cancelBookingConfirmation}
                    className="text-black"
                  >
                    Cancel
                  </Button>
                  
                  <Button
                    onClick={handleBooking}
                    disabled={loading}
                    className="text-black"
                  >
                    {loading ? 'Processing...' : 'Confirm Booking'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}