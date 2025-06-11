'use client';

import Link from 'next/link';
import Navbar from '/components/ui/Navbar';
import Footer from '/components/ui/Footer';
import { useLanguage } from '/contexts/LanguageContext';
import LanguageToggle from '/components/ui/LanguageToggle';
import { homeTranslations } from '/utils/translations';

export default function Home() {
  const { language } = useLanguage();
  const t = homeTranslations[language];

  return (
    <>
      <Navbar />
      <main>
        {/* Hero Section */}
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
            <div className="text-center">
              {/* Language Toggle */}
              <div className="flex justify-center mb-8">
                <LanguageToggle />
              </div>
              <h1 className="text-4xl font-extrabold text-secondary-900 sm:text-5xl md:text-6xl">
                <span className="block">{t.heroTitle1}</span>
                <span className="block text-primary-600">{t.heroTitle2}</span>
              </h1>
              <p className="mt-6 max-w-lg mx-auto text-xl text-secondary-500">
                {t.heroSubtitle}
              </p>
              <div className="mt-10 flex justify-center">
                <Link href="/register" className="btn btn-primary px-8 py-3 text-lg">
                  {t.getStartedButton}
                </Link>
                <Link href="/pricing" className="btn btn-secondary ml-4 px-8 py-3 text-lg">
                  {t.viewPricingButton}
                </Link> 
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="bg-secondary-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-secondary-900">
                {t.featuresTitle}
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-secondary-500">
                {t.featuresSubtitle}
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-3">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="w-12 h-12 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-secondary-900">{t.uploadTitle}</h3>
                <p className="mt-2 text-secondary-500">
                  {t.uploadDescription}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="w-12 h-12 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.309 48.309 0 01-8.135-1.087c-1.717-.293-2.3-2.379-1.067-3.61L5 14.5" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-secondary-900">{t.analyzeTitle}</h3>
                <p className="mt-2 text-secondary-500">
                  {t.analyzeDescription}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6">
                <div className="w-12 h-12 rounded-md bg-primary-100 text-primary-600 flex items-center justify-center mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-secondary-900">{t.insightsTitle}</h3>
                <p className="mt-2 text-secondary-500">
                  {t.insightsDescription}
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
