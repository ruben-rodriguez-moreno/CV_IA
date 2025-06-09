import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t">
      <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
        <nav className="flex flex-wrap justify-center -mx-5 -my-2" aria-label="Footer">
          <div className="px-5 py-2">
            <Link href="/about" className="text-base text-gray-500 hover:text-gray-900">
              About
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/features" className="text-base text-gray-500 hover:text-gray-900">
              Features
            </Link>
          </div>
          <div className="px-5 py-2">
            <Link href="/pricing" className="text-base text-gray-500 hover:text-gray-900">
              Pricing
            </Link>
          </div>
        </nav>
        <p className="mt-8 text-center text-base text-gray-400">&copy; {new Date().getFullYear()} CV-IA. All rights reserved.</p>
      </div>
    </footer>
  );
}
