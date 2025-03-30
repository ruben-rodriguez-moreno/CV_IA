'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '/contexts/AuthContext';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function SubscriptionPage() {
  const { currentUser } = useAuth();
  const [currentPlan, setCurrentPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  
  useEffect(() => {
    async function fetchSubscriptionData() {
      if (currentUser) {
        try {
          // Fetch user's subscription data from your backend
          const response = await fetch('/api/subscription/status');
          const data = await response.json();
          setCurrentPlan(data.plan);
        } catch (error) {
          console.error("Error fetching subscription data:", error);
        } finally {
          setIsLoading(false);
        }
      }
    }
    
    fetchSubscriptionData();
  }, [currentUser]);
  
  const handleSubscribe = async (planId) => {
    try {
      const response = await fetch('/api/subscription/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });
      
      const { url } = await response.json();
      router.push(url); // Redirect to Stripe checkout
    } catch (error) {
      console.error("Error creating checkout session:", error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading subscription data...</div>;
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-secondary-900 mb-8">Subscription Plans</h1>
      <p className="mb-8 text-lg text-secondary-600">Choose the plan that best fits your needs.</p>
      
      <div className="grid md:grid-cols-3 gap-8">
        {/* Free Plan */}
        <div className={`border rounded-lg shadow-sm overflow-hidden ${currentPlan === 'free' ? 'ring-2 ring-primary-500' : ''}`}>
          <div className="p-6 bg-white">
            <h2 className="text-xl font-semibold text-secondary-900">Free Plan</h2>
            <p className="mt-4 text-secondary-600">Basic features for individuals</p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-secondary-900">$0</span>
              <span className="text-secondary-500">/month</span>
            </p>
            
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">5 CVs per month</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">Basic CV analysis</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">Standard support</span>
              </li>
            </ul>
            
            <button
              className={`mt-8 w-full py-2 px-4 rounded-md ${
                currentPlan === 'free' ? 'bg-secondary-200 text-secondary-800' : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
              disabled={currentPlan === 'free'}
            >
              {currentPlan === 'free' ? 'Current Plan' : 'Select Plan'}
            </button>
          </div>
        </div>
        
        {/* Pro Plan */}
        <div className={`border rounded-lg shadow-sm overflow-hidden ${currentPlan === 'pro' ? 'ring-2 ring-primary-500' : ''}`}>
          <div className="p-6 bg-white">
            <h2 className="text-xl font-semibold text-secondary-900">Pro Plan</h2>
            <p className="mt-4 text-secondary-600">Advanced features for professionals</p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-secondary-900">$29</span>
              <span className="text-secondary-500">/month</span>
            </p>
            
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">100 CVs per month</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">Advanced CV analysis</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">Export data to CSV/PDF</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">Enhanced support</span>
              </li>
            </ul>
            
            <button
              onClick={() => currentPlan !== 'pro' && handleSubscribe('pro')}
              className={`mt-8 w-full py-2 px-4 rounded-md ${
                currentPlan === 'pro' ? 'bg-secondary-200 text-secondary-800' : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
              disabled={currentPlan === 'pro'}
            >
              {currentPlan === 'pro' ? 'Current Plan' : 'Subscribe'}
            </button>
          </div>
        </div>
        
        {/* Enterprise Plan */}
        <div className={`border rounded-lg shadow-sm overflow-hidden ${currentPlan === 'enterprise' ? 'ring-2 ring-primary-500' : ''}`}>
          <div className="p-6 bg-white">
            <h2 className="text-xl font-semibold text-secondary-900">Enterprise Plan</h2>
            <p className="mt-4 text-secondary-600">Complete solution for businesses</p>
            <p className="mt-6">
              <span className="text-4xl font-bold text-secondary-900">Custom</span>
              <span className="text-secondary-500">/month</span>
            </p>
            
            <ul className="mt-6 space-y-4">
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">1000+ CVs per month</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">Premium CV analysis</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">Advanced data exports</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">Priority support</span>
              </li>
              <li className="flex items-start">
                <CheckIcon className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                <span className="text-secondary-600">Dedicated account manager</span>
              </li>
            </ul>
            
            <button
              onClick={() => window.location.href = 'mailto:sales@cv-ia.com?subject=Enterprise Plan Inquiry'}
              className="mt-8 w-full bg-primary-600 text-white hover:bg-primary-700 py-2 px-4 rounded-md"
            >
              Contact Sales
            </button>
          </div>
        </div>
      </div>
      
      <div className="mt-12">
        <h2 className="text-2xl font-bold text-secondary-900 mb-4">Current Usage</h2>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-secondary-900">CV Usage</h3>
            <p className="text-secondary-600">Monthly usage statistics for your account</p>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-secondary-700">
                CVs Used This Month
              </span>
              <span className="text-sm font-medium text-secondary-900">
                {/* This will be dynamically loaded */}
                3 / 5
              </span>
            </div>
            <div className="w-full bg-secondary-200 rounded-full h-2.5">
              <div className="bg-primary-600 h-2.5 rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => router.push('/dashboard/usage')}
              className="text-primary-600 hover:text-primary-800 font-medium"
            >
              View detailed usage statistics →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
