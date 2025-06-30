import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Header } from '@/components/organisms/Header';
import { Footer } from '@/components/organisms/Footer';
import { Button } from '@/components/atoms/Button';

export const metadata = {
  title: 'Theaters - CinemaTicket',
  description: 'Find cinema theaters near you and check movie schedules.',
};

// Mock data for theaters
const theaters = [
  {
    id: 'theater-1',
    name: 'Downtown Cinema',
    address: '123 Main Street, Downtown',
    image: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    facilities: ['IMAX', 'Dolby Atmos', 'VIP Seats', 'Food Court'],
    description: 'Our flagship theater in the heart of downtown featuring the latest technology and premium comfort.',
  },
  {
    id: 'theater-2',
    name: 'Westside Mall',
    address: '456 West Avenue, Westside Mall',
    image: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    facilities: ['3D', 'Recliner Seats', 'Snack Bar'],
    description: 'Conveniently located in Westside Mall with easy access to shopping and dining options.',
  },
  {
    id: 'theater-3',
    name: 'Eastside Plaza',
    address: '789 East Boulevard, Eastside Plaza',
    image: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    facilities: ['4DX', 'Premium Lounge', 'Bar Service'],
    description: 'Experience movies like never before with our 4DX technology and premium lounge services.',
  },
  {
    id: 'theater-4',
    name: 'Northside Cineplex',
    address: '101 North Road, Northside',
    image: 'https://images.unsplash.com/photo-1615986201152-7686a4867f30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80',
    facilities: ['IMAX', 'Dolby Atmos', 'Family Rooms'],
    description: 'Family-friendly cinema with special rooms for parents with young children.',
  },
];

export default function TheatersPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold mb-8 text-secondary">Our Theaters</h1>
        
        {/* Map Section */}
        <div className="mb-12 rounded-lg overflow-hidden shadow-md">
          <div className="aspect-[21/9] bg-gray-200 relative">
            {/* This would be a real map in production */}
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <p className="text-gray-500">Interactive Map Placeholder</p>
            </div>
          </div>
          <div className="bg-white p-4">
            <p className="text-gray-600">Find the nearest cinema theater to you. Click on a location on the map or browse the list below.</p>
          </div>
        </div>
        
        {/* Theaters List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {theaters.map((theater) => (
            <div key={theater.id} className="border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="aspect-video relative">
                <Image
                  src={theater.image}
                  alt={theater.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{theater.name}</h2>
                <p className="text-gray-600 mb-4">{theater.address}</p>
                
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-500 mb-2">Facilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {theater.facilities.map((facility, index) => (
                      <span 
                        key={index} 
                        className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded"
                      >
                        {facility}
                      </span>
                    ))}
                  </div>
                </div>
                
                <p className="text-gray-700 mb-4">{theater.description}</p>
                
                <div className="flex gap-3">
                  <Button variant="default" size="sm">
                    View Schedule
                  </Button>
                  <Button variant="outline" size="sm">
                    Get Directions
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}