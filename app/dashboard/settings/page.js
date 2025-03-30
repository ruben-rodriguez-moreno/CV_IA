'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '/contexts/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '/lib/firebase/config';
import { 
  UserIcon,
  KeyIcon,
  CreditCardIcon,
  CheckBadgeIcon
} from '@heroicons/react/24/outline';

export default function Settings() {
  const { currentUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [currentPlan, setCurrentPlan] = useState('free');

  useEffect(() => {
    if (currentUser) {
      setName(currentUser.displayName || '');
      setEmail(currentUser.email || '');
      setCurrentPlan(currentUser.plan || 'free');
    }
  }, [currentUser]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Update displayName in Firebase Auth
      await updateProfile(currentUser, { displayName: name });
      
      // Update user document in Firestore
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name
      });
      
      setSuccess('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      id: 'free',
      name: 'Free',
      description: 'Basic CV analysis',
      features: [
        '3 CV analyses per month',
        'Basic formatting feedback',
        'General content suggestions',
      ],
      current: currentPlan === 'free',
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Advanced analysis for job hunters',
      price: '€9.99/month',
      features: [
        'Unlimited CV analyses',
        'Industry-specific feedback',
        'ATS optimization tips',
        'Keyword analysis for job descriptions',
      ],
      current: currentPlan === 'pro',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Complete solution for organizations',
      price: '€49.99/month',
      features: [
        'All Pro features',
        'Multiple user accounts',
        'Team management dashboard',
        'API access',
      ],
      current: currentPlan === 'enterprise',
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-secondary-900">Account Settings</h1>
      
      <div className="mt-6">
        <p className="text-sm text-secondary-600">
          Manage your account settings and subscription plan.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {/* Profile Settings */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex items-center">
            <UserIcon className="h-5 w-5 text-secondary-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-secondary-900">
              Profile Settings
            </h3>
          </div>
          <div className="border-t border-secondary-200 px-4 py-5 sm:p-6">
            {success && (
              <div className="mb-4 bg-green-50 border-l-4 border-green-500 p-4">
                <div className="text-sm text-green-700">{success}</div>
              </div>
            )}
            
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                <div className="text-sm text-red-700">{error}</div>
              </div>
            )}
            
            <form onSubmit={handleUpdateProfile}>
              <div className="grid grid-cols-6 gap-6">
                <div className="col-span-6 sm:col-span-3">
                  <label htmlFor="name" className="block text-sm font-medium text-secondary-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-1 input w-full"
                  />
                </div>
                
                <div className="col-span-6 sm:col-span-4">
                  <label htmlFor="email" className="block text-sm font-medium text-secondary-700">
                    Email address
                  </label>
                  <input
                    type="text"
                    name="email"
                    id="email"
                    value={email}
                    disabled
                    className="mt-1 bg-secondary-100 input w-full cursor-not-allowed"
                  />
                  <p className="mt-1 text-xs text-secondary-500">
                    Email cannot be changed.
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Password Settings */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex items-center">
            <KeyIcon className="h-5 w-5 text-secondary-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-secondary-900">
              Password Settings
            </h3>
          </div>
          <div className="border-t border-secondary-200 px-4 py-5 sm:p-6">
            <p className="text-sm text-secondary-600 mb-4">
              Update your password to maintain account security.
            </p>
            <a
              href="/forgot-password"
              className="btn btn-secondary"
            >
              Reset Password
            </a>
          </div>
        </div>
        
        {/* Subscription Plan */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 flex items-center">
            <CreditCardIcon className="h-5 w-5 text-secondary-500 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-secondary-900">
              Subscription Plan
            </h3>
          </div>
          <div className="border-t border-secondary-200 px-4 py-5 sm:p-6">
            <p className="text-sm text-secondary-600 mb-6">
              Manage your subscription and billing information.
            </p>
            
            <div className="space-y-4">
              {plans.map((plan) => (
                <div 
                  key={plan.id} 
                  className={`relative rounded-lg border p-4 ${
                    plan.current 
                      ? 'bg-primary-50 border-primary-500' 
                      : 'border-secondary-300'
                  }`}
                >
                  <div className="flex justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-secondary-900">
                        {plan.name}
                        {plan.current && (
                          <span className="ml-2 bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full">
                            Current Plan
                          </span>
                        )}
                      </h4>
                      <p className="mt-1 text-sm text-secondary-500">
                        {plan.description}
                      </p>
                      {plan.price && (
                        <p className="mt-2 text-sm font-medium text-secondary-900">
                          {plan.price}
                        </p>
                      )}
                    </div>
                    {plan.current && (
                      <CheckBadgeIcon className="h-5 w-5 text-primary-600" />
                    )}
                  </div>
                  
                  <ul className="mt-4 space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start">
                        <div className="flex-shrink-0 h-5 w-5 text-primary-500">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <p className="ml-3 text-xs text-secondary-700">{feature}</p>
                      </li>
                    ))}
                  </ul>
                  
                  {!plan.current && (
                    <div className="mt-5">
                      <button
                        type="button"
                        className="text-sm text-primary-600 font-medium hover:text-primary-500"
                      >
                        {plan.id === 'free' ? 'Downgrade to Free' : `Upgrade to ${plan.name}`}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
