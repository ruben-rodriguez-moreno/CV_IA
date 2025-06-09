'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Navbar from '/components/ui/Navbar';
import Footer from '/components/ui/Footer';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  LightBulbIcon, 
  AcademicCapIcon, 
  BriefcaseIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

export default function Features() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  useEffect(() => {
    // Check if user is logged in
    // This is a placeholder - replace with your actual authentication check
    const checkAuth = () => {
      // Example: Check for auth token in localStorage or cookies
      const token = localStorage.getItem('authToken');
      setIsLoggedIn(!!token);
    };
    
    checkAuth();
  }, []);
  
  const handleCVAnalysis = (e) => {
    e.preventDefault();
    router.push('/dashboard/upload');
  };

  return (
    <>
      <Navbar />
      <div className="bg-gradient-to-b from-white to-blue-50">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Analyze Your CV</span>
              <span className="block text-blue-600">Improve Your Chances</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Our AI-powered CV analysis tool helps you stand out from the crowd by identifying strengths and suggesting improvements.
            </p>
            <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
              <div className="rounded-md shadow">
                <a 
                  href="#" 
                  onClick={handleCVAnalysis}
                  className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 md:py-4 md:text-lg md:px-10"
                >
                  Try It Now
                </a>
              </div>
              <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
                <Link href="#features" className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 md:py-4 md:text-lg md:px-10">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="py-12 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center">
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Features</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                A smarter way to improve your CV
              </p>
              <p className="mt-4 max-w-2xl text-xl text-gray-500 lg:mx-auto">
                Our advanced AI analyzes your CV to provide actionable insights and recommendations.
              </p>
            </div>

            <div className="mt-10">
              <div className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-10">
                {/* Feature 1 */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <DocumentTextIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Instant CV Upload</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Upload your CV in PDF or Word format and get instant analysis with detailed feedback.
                    </p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <SparklesIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Skills Extraction</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Automatically extract and highlight your key skills, comparing them to industry standards.
                    </p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <BriefcaseIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Experience Assessment</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Get insights on how to better present your work experience and highlight achievements.
                    </p>
                  </div>
                </div>

                {/* Feature 4 */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <AcademicCapIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Education Analysis</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Understand how to best position your educational background for your target roles.
                    </p>
                  </div>
                </div>

                {/* Feature 5 */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <ChartBarIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">ATS Compatibility</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Check if your CV is optimized for Applicant Tracking Systems that companies use to filter candidates.
                    </p>
                  </div>
                </div>

                {/* Feature 6 */}
                <div className="relative">
                  <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white">
                    <LightBulbIcon className="h-6 w-6" aria-hidden="true" />
                  </div>
                  <div className="ml-16">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Personalized Recommendations</h3>
                    <p className="mt-2 text-base text-gray-500">
                      Receive tailored suggestions to improve your CV based on industry best practices.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Testimonial Section */}
        <div className="bg-blue-50 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="lg:text-center mb-10">
              <h2 className="text-base text-blue-600 font-semibold tracking-wide uppercase">Testimonials</h2>
              <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
                Success stories from our users
              </p>
            </div>
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                    J
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold">Juan Pérez</h4>
                    <p className="text-sm text-gray-600">Software Developer</p>
                  </div>
                </div>
                <p className="text-gray-600">"Thanks to this tool, I was able to identify key skills I was missing in my CV. After updating it, I got three interview calls in a week!"</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                    M
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold">María González</h4>
                    <p className="text-sm text-gray-600">Marketing Specialist</p>
                  </div>
                </div>
                <p className="text-gray-600">"The feedback was incredibly detailed and specific to my industry. It helped me reframe my experience in a way that really speaks to recruiters."</p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center mb-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-500">
                    C
                  </div>
                  <div className="ml-4">
                    <h4 className="font-semibold">Carlos Rodríguez</h4>
                    <p className="text-sm text-gray-600">Finance Analyst</p>
                  </div>
                </div>
                <p className="text-gray-600">"I was skeptical at first, but the AI gave me insights I hadn't considered. The ATS optimization tips were especially valuable."</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-blue-600">
          <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              <span className="block">Ready to improve your CV?</span>
              <span className="block">Start using our tool today.</span>
            </h2>
            <p className="mt-4 text-lg leading-6 text-blue-100">
              Upload your CV now and get personalized insights to help you land your dream job.
            </p>
            <a
              href="#"
              onClick={handleCVAnalysis}
              className="mt-8 w-full inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 sm:w-auto"
            >
              Analyze My CV
            </a>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
}
