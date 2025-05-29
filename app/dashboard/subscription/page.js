'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '/contexts/AuthContext';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function SubscriptionPage() {
  const { currentUser } = useAuth();
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan]       = useState('free');
  const [isLoading, setIsLoading]                     = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      return;
    }
    currentUser.getIdTokenResult()
      .then(({ claims }) => {
        setSubscriptionActive(!!claims.subscriptionActive);
        if (claims.subscriptionPlan === 'pro') {
          setSubscriptionPlan('pro');
        } else if (claims.subscriptionPlan === 'enterprise') {
          setSubscriptionPlan('enterprise');
        } else {
          setSubscriptionPlan('free');
        }
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [currentUser]);

  if (isLoading) {
    return <div className="text-center py-12">Loading subscription data…</div>;
  }

  const handleSubscribe = (planId) => {
    fetch('/api/subscription/create-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ planId }),
    })
    .then(r => r.json())
    .then(({ url }) => url && (window.location.href = url))
    .catch(console.error);
  };

  const handleManage = () => {
    currentUser.getIdToken()
      .then(token =>
        fetch('/api/subscription/manage', {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      )
      .then(r => r.json())
      .then(({ url, error }) => {
        if (error) throw new Error(error);
        window.location.href = url;
      })
      .catch(console.error);
  };

  const plans = [
    {
      key: 'free',
      title: 'Free Plan',
      price: '$0',
      interval: 'month',
      features: ['5 CVs per month','Basic CV analysis','Standard support']
    },
    {
      key: 'pro',
      title: 'Pro Plan',
      price: '$29',
      interval: 'month',
      features: ['100 CVs per month','Advanced CV analysis','Export data to CSV/PDF','Enhanced support']
    },
    {
      key: 'enterprise',
      title: 'Enterprise Plan',
      price: '$296',
      interval: 'year',
      features: ['1000+ CVs per month','Premium CV analysis','Advanced data exports','Priority support','Dedicated account manager']
    }
  ];

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8">Subscription Plans</h1>
      <div className="grid md:grid-cols-3 gap-8">
        {plans.map(plan => (
          <div
            key={plan.key}
            className={`border rounded-lg p-6 ${subscriptionPlan === plan.key ? 'ring-2 ring-primary-500' : ''}`}
          >
            <h2 className="text-xl font-semibold">{plan.title}</h2>
            <p className="mt-4">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-secondary-500">/{plan.interval}</span>
            </p>
            <ul className="mt-6 space-y-4">
              {plan.features.map(feature => (
                <li key={feature} className="flex items-start">
                  <CheckIcon className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-secondary-600">{feature}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleSubscribe(plan.key)}
              disabled={subscriptionPlan === plan.key}
              className={`mt-6 w-full py-2 rounded-md ${
                subscriptionPlan === plan.key
                  ? 'bg-secondary-200 text-secondary-800'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
              }`}
            >
              {subscriptionPlan === plan.key
                ? 'Current Plan'
                : plan.key === 'free'
                  ? 'Select Plan'
                  : 'Subscribe'}
            </button>

            {/* Solo para Enterprise mostramos el Manage si está activo */}
            {plan.key === 'enterprise' && subscriptionActive && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleManage}
                  className="px-6 py-2 border rounded-md hover:bg-secondary-100"
                >
                  Manage Subscription
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
