'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { currentUser, logout } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to log out', error);
    }
  };

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white shadow-md' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/" className="flex-shrink-0 font-bold text-2xl text-primary-600">
              CV-IA
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="ml-10 flex items-center space-x-4">
              <Link href="/features" className="hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                Features
              </Link>
              <Link href="/pricing" className="hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                Pricing
              </Link>
              {currentUser ? (
                <>
                  <Link href="/dashboard" className="hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Dashboard
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="hover:bg-primary-700 text-white bg-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium">
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    className="hover:bg-primary-700 text-white bg-primary-600 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Sign up
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            >
              <span className="sr-only">Open main menu</span>
              {isOpen ? (
                <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white shadow-md">
            <Link href="/features" className="hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
              Pricing
            </Link>
            {currentUser ? (
              <>
                <Link href="/dashboard" className="hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                  Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left hover:bg-primary-700 text-white bg-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:text-primary-600 block px-3 py-2 rounded-md text-base font-medium">
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="hover:bg-primary-700 text-white bg-primary-600 block px-3 py-2 rounded-md text-base font-medium"
                >
                  Sign up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
