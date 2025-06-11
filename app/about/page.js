'use client';

import Link from 'next/link';
import Navbar from '/components/ui/Navbar';
import Footer from '/components/ui/Footer';
import { useLanguage } from '/contexts/LanguageContext';
import LanguageToggle from '/components/ui/LanguageToggle';
import { aboutTranslations } from '/utils/translations';

export default function About() {
  const { language } = useLanguage();
  const t = aboutTranslations[language];

  return (
    <>
      <Navbar />
      <main>{/* Hero Section */}
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
              <p className="mt-6 max-w-3xl mx-auto text-xl text-secondary-500">
                {t.heroSubtitle}
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="bg-secondary-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">            <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div>
                <h2 className="text-3xl font-extrabold text-secondary-900 sm:text-4xl">
                  {t.missionTitle}
                </h2>
                <p className="mt-6 text-lg text-secondary-500">
                  {t.missionParagraph1}
                </p>
                <p className="mt-4 text-lg text-secondary-500">
                  {t.missionParagraph2}
                </p>
              </div>
              <div className="mt-8 lg:mt-0">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <div className="flex items-center justify-center w-16 h-16 rounded-md bg-primary-100 text-primary-600 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189c.176-.077.291-.253.291-.436 0-.183-.115-.359-.291-.436A5.995 5.995 0 0012 12.75a6.01 6.01 0 00-1.5.189c-.176.077-.291.253-.291.436 0 .183.115.359.291.436A6.01 6.01 0 0012 12.75zM12 18a9 9 0 11-9-9 9 9 0 019 9z" />
                    </svg>
                  </div>
                  <h3 className="text-xl font-semibold text-secondary-900 text-center mb-4">
                    {t.missionCardTitle}
                  </h3>
                  <p className="text-secondary-500 text-center">
                    {t.missionCardDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do Section */}
        <section className="bg-white py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">            <div className="text-center">
              <h2 className="text-3xl font-extrabold text-secondary-900 sm:text-4xl">
                {t.whatWeDoTitle}
              </h2>
              <p className="mt-4 max-w-2xl mx-auto text-xl text-secondary-500">
                {t.whatWeDoSubtitle}
              </p>
            </div>

            <div className="mt-20">
              <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-md bg-primary-100 text-primary-600 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23-.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21a48.309 48.309 0 01-8.135-1.087c-1.717-.293-2.3-2.379-1.067-3.61L5 14.5" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-medium text-secondary-900 mb-4">{t.aiAnalysisTitle}</h3>
                  <p className="text-lg text-secondary-500">
                    {t.aiAnalysisDescription}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-md bg-primary-100 text-primary-600 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-medium text-secondary-900 mb-4">{t.personalizedTitle}</h3>
                  <p className="text-lg text-secondary-500">
                    {t.personalizedDescription}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-md bg-primary-100 text-primary-600 mx-auto mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-medium text-secondary-900 mb-4">{t.performanceTitle}</h3>
                  <p className="text-lg text-secondary-500">
                    {t.performanceDescription}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Technology Section */}
        <section className="bg-secondary-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">              <div className="order-2 lg:order-1">
                <div className="bg-white rounded-lg shadow-lg p-8">
                  <h3 className="text-2xl font-semibold text-secondary-900 mb-6">
                    {t.technologyCardTitle}
                  </h3>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-secondary-700">{t.technologyFeature1}</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-secondary-700">{t.technologyFeature2}</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-secondary-700">{t.technologyFeature3}</p>
                    </li>
                    <li className="flex items-start">
                      <div className="flex-shrink-0">
                        <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="ml-3 text-secondary-700">{t.technologyFeature4}</p>
                    </li>
                  </ul>
                </div>
              </div>
              <div className="order-1 lg:order-2">
                <h2 className="text-3xl font-extrabold text-secondary-900 sm:text-4xl">
                  {t.technologyTitle}
                </h2>
                <p className="mt-6 text-lg text-secondary-500">
                  {t.technologyParagraph1}
                </p>
                <p className="mt-4 text-lg text-secondary-500">
                  {t.technologyParagraph2}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-primary-600">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              <span className="block">{t.ctaTitle}</span>
              <span className="block text-primary-200">{t.ctaSubtitle}</span>
            </h2>
            <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
              <div className="inline-flex rounded-md shadow">
                <Link
                  href="/dashboard/upload"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-primary-600 bg-white hover:bg-primary-50 transition-colors duration-200"
                >
                  {t.ctaButtonPrimary}
                </Link>
              </div>
              <div className="ml-3 inline-flex rounded-md shadow">
                <Link
                  href="/features"
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-500 hover:bg-primary-400 transition-colors duration-200"
                >
                  {t.ctaButtonSecondary}
                </Link>
              </div>
            </div>
          </div>
        </section>      </main>
      <Footer />
    </>
  );
}
