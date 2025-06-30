import React from 'react';
import Image from 'next/image';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Button } from '@/components/atoms/Button';
import { Badge } from '@/components/atoms/Badge';

export const metadata = {
  title: 'Promotions - CinemaTicket',
  description: 'Check out our latest promotions, discounts and special offers for movie tickets.',
};

// Mock data for promotions
const promotions = [
  {
    id: 'promo-1',
    title: 'Student Discount',
    description: 'Students get 20% off on all movie tickets with valid student ID. Available all days of the week.',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    validUntil: 'December 31, 2024',
    code: 'STUDENT20',
    isNew: true,
  },
  {
    id: 'promo-2',
    title: 'Family Package',
    description: 'Special family package for 4 persons with free popcorn and drinks. Perfect for weekend family outings.',
    image: 'https://images.unsplash.com/photo-1502086223501-7ea6ecd79368?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    validUntil: 'November 30, 2024',
    code: 'FAMILY4',
    isNew: false,
  },
  {
    id: 'promo-3',
    title: 'Weekday Special',
    description: 'Enjoy 30% off on all movie tickets from Monday to Thursday. Great way to beat the weekend crowds.',
    image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    validUntil: 'October 31, 2024',
    code: 'WEEKDAY30',
    isNew: true,
  },
  {
    id: 'promo-4',
    title: 'Senior Citizen Discount',
    description: 'Senior citizens aged 60 and above get 25% off on all movie tickets with valid ID.',
    image: 'https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    validUntil: 'December 31, 2024',
    code: 'SENIOR25',
    isNew: false,
  },
  {
    id: 'promo-5',
    title: 'Birthday Special',
    description: 'Celebrate your birthday with us! Get a free ticket on your birthday when accompanied by at least one paying guest.',
    image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    validUntil: 'December 31, 2024',
    code: 'BIRTHDAY',
    isNew: false,
  },
  {
    id: 'promo-6',
    title: 'Membership Rewards',
    description: 'Join our membership program and earn points with every purchase. Redeem points for free tickets and concessions.',
    image: 'https://images.unsplash.com/photo-1472457897821-70d3819a0e24?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    validUntil: 'Ongoing',
    code: 'MEMBER',
    isNew: true,
  },
];

export default function PromotionsPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-secondary">Promotions & Offers</h1>
        
        {/* Featured Promotion */}
        <div className="mb-12 bg-gradient-to-r from-primary to-secondary text-white rounded-lg overflow-hidden shadow-lg">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 flex flex-col justify-center">
              <Badge variant="age" className="mb-4 self-start">Limited Time</Badge>
              <h2 className="text-2xl md:text-3xl font-bold mb-4">Buy 1 Get 1 Free Weekends</h2>
              <p className="mb-6">Purchase one ticket and get another one free every weekend in May. Use code WEEKEND241 when booking online.</p>
              <div className="flex gap-4">
                <Button size="lg" className="bg-white text-primary hover:bg-gray-100">
                  Book Now
                </Button>
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
                  Learn More
                </Button>
              </div>
            </div>
            <div className="relative aspect-[4/3] md:aspect-auto">
              <Image
                src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                alt="Weekend Promotion"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
        
        {/* All Promotions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {promotions.map((promo) => (
            <div key={promo.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative aspect-[16/9]">
                <Image
                  src={promo.image}
                  alt={promo.title}
                  fill
                  className="object-cover"
                />
                {promo.isNew && (
                  <div className="absolute top-4 right-4">
                    <Badge variant="now">New</Badge>
                  </div>
                )}
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{promo.title}</h2>
                <p className="text-gray-600 mb-4">{promo.description}</p>
                
                <div className="flex justify-between items-center mb-4 text-sm">
                  <span className="text-gray-500">Valid until: {promo.validUntil}</span>
                  <span className="font-mono font-bold text-primary">{promo.code}</span>
                </div>
                
                <Button className="w-full">Redeem Offer</Button>
              </div>
            </div>
          ))}
        </div>
        
        {/* Newsletter Signup */}
        <div className="mt-16 bg-gray-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold mb-4">Stay Updated on Promotions</h2>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Subscribe to our newsletter to receive the latest promotions and exclusive offers directly to your inbox.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Your email address"
              className="flex-grow px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <Button>Subscribe</Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}