  'use client';

  import { useState, useEffect } from 'react';
  import Link from 'next/link';
  import { useAuth } from '/contexts/AuthContext';
  import { useRouter, usePathname } from 'next/navigation'; // Modificado
  import { 
    DocumentTextIcon, 
    ChartBarIcon, 
    Cog6ToothIcon,
    MagnifyingGlassIcon,
    Bars3Icon,
    XMarkIcon,
    ArrowLeftOnRectangleIcon,
    CreditCardIcon,
    LinkIcon // Add LinkIcon import
  } from '@heroicons/react/24/outline';

  const navigation = [
    { name: 'Upload CV', href: '/dashboard/upload', icon: DocumentTextIcon },
    { name: 'Results', href: '/dashboard/results', icon: ChartBarIcon },
    { name: 'Search', href: '/dashboard/search', icon: MagnifyingGlassIcon },
    { name: 'Shared Links', href: '/dashboard/share', icon: LinkIcon }, // Add this line
    { name: 'Subscription', href: '/dashboard/subscription', icon: CreditCardIcon },
    { name: 'Settings', href: '/dashboard/settings', icon: Cog6ToothIcon },
  ];

  export default function DashboardLayout({ children }) {
    const { currentUser, logout } = useAuth();
    const router = useRouter();
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const currentPath = usePathname(); // Nueva línea
    
    
    if (!currentUser) {
      return <div className="flex justify-center items-center h-screen">Loading...</div>;
    }

    return (
      <div className="h-screen flex overflow-hidden bg-secondary-50">
        {/* Mobile sidebar */}
        <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'} transition-opacity ease-linear duration-300`}>
          <div 
            className={`fixed inset-0 bg-secondary-600 bg-opacity-75 transition-opacity ${sidebarOpen ? 'opacity-100 ease-out duration-300' : 'opacity-0 ease-in duration-200'}`} 
            aria-hidden="true"
            onClick={() => setSidebarOpen(false)}
          />
          
          <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition ease-in-out duration-300`}>
            <div className="absolute top-0 right-0 -mr-12 pt-2">
              <button
                type="button"
                className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sr-only">Close sidebar</span>
                <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
              </button>
            </div>
            
            <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
              <div className="flex-shrink-0 flex items-center px-4">
                <Link href="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
                  CV-IA
                </Link>
              </div>
              <nav className="mt-5 px-2 space-y-1">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`group flex items-center px-2 py-2 text-base font-medium rounded-md ${
                      currentPath.includes(item.href)
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon
                      className={`mr-4 flex-shrink-0 h-6 w-6 ${
                        currentPath.includes(item.href)
                          ? 'text-primary-500'
                          : 'text-secondary-500 group-hover:text-secondary-700'
                      }`}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-secondary-200 p-4">
              <div className="flex-shrink-0 group block">
                <div className="flex items-center">
                  <div className="ml-3">
                    <p className="text-base font-medium text-secondary-700 group-hover:text-secondary-900">
                      {currentUser.displayName || currentUser.email}
                    </p>
                    <button
                      onClick={async () => {
                        await logout();
                        router.push('/');
                      }}
                      className="text-sm font-medium text-secondary-500 group-hover:text-secondary-700 flex items-center"
                    >
                      <ArrowLeftOnRectangleIcon className="mr-2 h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex-shrink-0 w-14" aria-hidden="true">
            {/* Force sidebar to shrink to fit close icon */}
          </div>
        </div>

        {/* Static sidebar for desktop */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            <div className="flex flex-col h-0 flex-1 border-r border-secondary-200 bg-white">
              <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4">
                  <Link href="/" className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors">
                    CV-IA
                  </Link>
                </div>
                <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md ${
                        currentPath.includes(item.href)
                          ? 'bg-primary-100 text-primary-700'
                          : 'text-secondary-600 hover:bg-secondary-100 hover:text-secondary-900'
                      }`}
                    >
                      <item.icon
                        className={`mr-3 flex-shrink-0 h-6 w-6 ${
                          currentPath.includes(item.href)
                            ? 'text-primary-500'
                            : 'text-secondary-500 group-hover:text-secondary-700'
                        }`}
                        aria-hidden="true"
                      />
                      {item.name}
                    </Link>
                  ))}
                </nav>
              </div>
              <div className="flex-shrink-0 flex border-t border-secondary-200 p-4">
                <div className="flex-shrink-0 w-full group block">
                  <div className="flex items-center">
                    <div className="ml-3 w-full">
                      <p className="text-sm font-medium text-secondary-700 group-hover:text-secondary-900">
                        {currentUser.displayName || currentUser.email}
                      </p>
                      <button
                        onClick={async () => {
                          await logout();
                          router.push('/');
                        }}
                        className="text-xs font-medium text-secondary-500 group-hover:text-secondary-700 flex items-center"
                      >
                        <ArrowLeftOnRectangleIcon className="mr-2 h-4 w-4" />
                        Sign out
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col w-0 flex-1 overflow-hidden">
          <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
            <button
              type="button"
              className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-secondary-500 hover:text-secondary-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
              onClick={() => setSidebarOpen(true)}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
          </div>
          
          <main className="flex-1 relative overflow-y-auto focus:outline-none">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                {children}
              </div>
            </div>
          </main>
        </div>
      </div>
    );
  }
