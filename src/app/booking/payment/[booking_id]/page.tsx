'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Button } from '@/components/atoms/Button';
import { useAuth } from '@/components/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

type PaymentMethod = 'credit_card' | 'debit_card' | 'e_wallet';

import { use } from 'react';

export default function PaymentPage({ params }: { params: Promise<{ booking_id: string }> }) {
  const unwrappedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  
  // Card details state
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Redirect if not logged in
  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      router.push('/login?redirect=' + encodeURIComponent(`/booking/payment/${unwrappedParams.booking_id}`));
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        
        // Fetch the booking details from Supabase
        const { data, error } = await supabase
          .from('bookings')
          .select(`
            id,
            total_price,
            status,
            showtimes!inner(time, date, theaters!inner(name), movies!inner(title))
          `)
          .eq('id', unwrappedParams.booking_id)
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (!data) throw new Error('Booking not found');

        // Fetch seats for the booking
        const { data: seatData, error: seatError } = await supabase
          .from('booking_seats')
          .select('seats(row, number)')
          .eq('booking_id', unwrappedParams.booking_id);

        if (seatError) throw seatError;

        const seatLabels = seatData.map(item => `${item.seats.row}${item.seats.number}`);
        
        // Format the showtime date and time
        const formattedShowtime = `${data.showtimes.date} at ${data.showtimes.time}`;
        
        setBookingDetails({
          id: data.id,
          total_price: data.total_price,
          status: data.status,
          seats: seatLabels,
          movie_title: data.showtimes.movies.title,
          theater_name: data.showtimes.theaters.name,
          showtime: formattedShowtime
        });
      } catch (err: any) {
        console.error('Error fetching booking details:', err);
        setError('Failed to load booking details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingDetails();
  }, [user, router, unwrappedParams.booking_id]);

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
  };

  const validatePaymentDetails = () => {
    if (paymentMethod === 'credit_card' || paymentMethod === 'debit_card') {
      // Basic validation for card payments
      if (!cardNumber.trim() || cardNumber.length < 16) {
        setError('Please enter a valid card number');
        return false;
      }
      if (!cardName.trim()) {
        setError('Please enter the cardholder name');
        return false;
      }
      if (!expiryDate.trim() || !expiryDate.includes('/')) {
        setError('Please enter a valid expiry date (MM/YY)');
        return false;
      }
      if (!cvv.trim() || cvv.length < 3) {
        setError('Please enter a valid CVV');
        return false;
      }
    }
    return true;
  };

  const handlePayment = async () => {
    if (!validatePaymentDetails()) {
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      // Insert payment record into the database
      const { error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: unwrappedParams.booking_id,
          amount: bookingDetails.total_price,
          payment_method: paymentMethod,
          status: 'completed'
        });

      if (paymentError) throw paymentError;

      // Update booking status to confirmed
      const { error: bookingError } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', unwrappedParams.booking_id);

      if (bookingError) throw bookingError;
      
      // Langsung arahkan ke halaman profil dengan pesan sukses
      router.push('/profile?payment=success');
    } catch (err: any) {
      console.error('Payment processing error:', err);
      setError('Failed to process payment. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!user) return null; // Will redirect in useEffect

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-grow container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-6 text-black">Payment</h1>
          
          {loading ? (
            <div className="bg-white rounded-lg shadow-md p-6 text-center">
              <p className="text-black">Loading payment details...</p>
            </div>
          ) : error ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <p className="text-red-500">{error}</p>
              <Button 
                onClick={() => router.push('/movies')} 
                className="mt-4"
              >
                Browse Movies
              </Button>
            </div>
          ) : (
            <>
              {/* Booking Summary */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 text-black">Booking Summary</h2>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <p className="text-black">Movie:</p>
                    <p className="font-medium text-black">{bookingDetails.movie_title}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-black">Theater:</p>
                    <p className="font-medium text-black">{bookingDetails.theater_name}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-black">Date & Time:</p>
                    <p className="font-medium text-black">{bookingDetails.showtime}</p>
                  </div>
                  
                  <div className="flex justify-between">
                    <p className="text-black">Selected Seats:</p>
                    <p className="font-medium text-black">
                      {bookingDetails.seats.join(', ')}
                    </p>
                  </div>
                  
                  <div className="border-t pt-3 flex justify-between">
                    <p className="font-bold text-black">Total:</p>
                    <p className="font-bold text-black">IDR {bookingDetails.total_price.toLocaleString()}</p>
                  </div>
                </div>
              </div>
              
              {/* Payment Method Selection */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-bold mb-4 text-black">Payment Method</h2>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="credit_card"
                      name="payment_method"
                      value="credit_card"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => handlePaymentMethodChange('credit_card')}
                      className="mr-2"
                    />
                    <label htmlFor="credit_card" className="text-black">Credit Card</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="debit_card"
                      name="payment_method"
                      value="debit_card"
                      checked={paymentMethod === 'debit_card'}
                      onChange={() => handlePaymentMethodChange('debit_card')}
                      className="mr-2"
                    />
                    <label htmlFor="debit_card" className="text-black">Debit Card</label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id="e_wallet"
                      name="payment_method"
                      value="e_wallet"
                      checked={paymentMethod === 'e_wallet'}
                      onChange={() => handlePaymentMethodChange('e_wallet')}
                      className="mr-2"
                    />
                    <label htmlFor="e_wallet" className="text-black">E-Wallet</label>
                  </div>
                </div>
              </div>
              
              {/* Payment Details */}
              {(paymentMethod === 'credit_card' || paymentMethod === 'debit_card') && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4 text-black">
                    {paymentMethod === 'credit_card' ? 'Credit Card' : 'Debit Card'} Details
                  </h2>
                  
                  <div className="space-y-4">
                    <div>
                      <label htmlFor="card_number" className="block text-sm font-medium text-black mb-1">
                        Card Number
                      </label>
                      <input
                        type="text"
                        id="card_number"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="1234 5678 9012 3456"
                        className="w-full p-2 border border-gray-300 rounded"
                        maxLength={19}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="card_name" className="block text-sm font-medium text-black mb-1">
                        Cardholder Name
                      </label>
                      <input
                        type="text"
                        id="card_name"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="John Doe"
                        className="w-full p-2 border border-gray-300 rounded"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="expiry_date" className="block text-sm font-medium text-black mb-1">
                          Expiry Date
                        </label>
                        <input
                          type="text"
                          id="expiry_date"
                          value={expiryDate}
                          onChange={(e) => setExpiryDate(e.target.value)}
                          placeholder="MM/YY"
                          className="w-full p-2 border border-gray-300 rounded"
                          maxLength={5}
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="cvv" className="block text-sm font-medium text-black mb-1">
                          CVV
                        </label>
                        <input
                          type="text"
                          id="cvv"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value)}
                          placeholder="123"
                          className="w-full p-2 border border-gray-300 rounded"
                          maxLength={4}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {paymentMethod === 'e_wallet' && (
                <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4 text-black">E-Wallet Payment</h2>
                  <p className="text-black mb-4">
                    You will be redirected to your e-wallet provider to complete the payment.
                  </p>
                </div>
              )}
              
              {/* Action Buttons */}
              <div className="flex justify-between">
                <Button 
                  variant="outline" 
                  onClick={() => router.back()}
                  className="text-white"
                >
                  Back
                </Button>
                
                <Button
                  onClick={handlePayment}
                  disabled={processing}
                  className="text-white"
                >
                  {processing ? 'Processing...' : 'Pay Now'}
                </Button>
              </div>
            </>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
}