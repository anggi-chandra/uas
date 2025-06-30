import React from 'react';
import Link from 'next/link';
import { Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-secondary text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">CinemaTicket</h3>
            <p className="text-sm text-gray-300 mb-4">
              The best place to book your movie tickets online. Experience the
              latest movies in theaters near you.
            </p>
            <div className="flex space-x-4">
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Facebook"
              >
                <Facebook size={20} />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Twitter"
              >
                <Twitter size={20} />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Instagram"
              >
                <Instagram size={20} />
              </a>
              <a
                href="#"
                className="text-gray-300 hover:text-white transition-colors"
                aria-label="Youtube"
              >
                <Youtube size={20} />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-md font-bold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link href="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link
                  href="/movies"
                  className="hover:text-white transition-colors"
                >
                  Movies
                </Link>
              </li>
              <li>
                <Link
                  href="/theaters"
                  className="hover:text-white transition-colors"
                >
                  Theaters
                </Link>
              </li>
              <li>
                <Link
                  href="/promotions"
                  className="hover:text-white transition-colors"
                >
                  Promotions
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-bold mb-4">Help & Support</h4>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link
                  href="/faq"
                  className="hover:text-white transition-colors"
                >
                  FAQ
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="hover:text-white transition-colors"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link
                  href="/privacy"
                  className="hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="hover:text-white transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-md font-bold mb-4">Download Our App</h4>
            <p className="text-sm text-gray-300 mb-4">
              Get the best experience on our mobile app
            </p>
            <div className="space-y-2">
              <a
                href="#"
                className="block px-4 py-2 border border-gray-600 rounded-md text-sm text-center hover:bg-gray-700 transition-colors"
              >
                App Store
              </a>
              <a
                href="#"
                className="block px-4 py-2 border border-gray-600 rounded-md text-sm text-center hover:bg-gray-700 transition-colors"
              >
                Google Play
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-700 mt-12 pt-8 text-sm text-gray-400 text-center">
          <p>&copy; {new Date().getFullYear()} CinemaTicket. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}