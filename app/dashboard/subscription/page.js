'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '/contexts/AuthContext';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function SubscriptionPage() {
  const { currentUser } = useAuth();
  const [subscriptionActive, setSubscriptionActive] = useState(false);
  const [subscriptionPlan, setSubscriptionPlan] = useState('free');
  const [isLoading, setIsLoading] = useState(true);
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
    return <div className="text-center py-12">Cargando datos de suscripción…</div>;
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
      title: 'Plan Gratis',
      price: '0€',
      interval: 'mes',
      features: ['5 CVs al mes', 'Análisis básico de CV', 'Soporte estándar']
    },
    {
      key: 'pro',
      title: 'Plan Pro',
      price: '29€',
      interval: 'mes',
      features: ['100 CVs al mes', 'Análisis avanzado de CV', 'Exportar datos a CSV/PDF', 'Soporte mejorado']
    },
    {
      key: 'enterprise',
      title: 'Plan Empresa',
      price: '296€',
      interval: 'año',
      features: ['1000+ CVs al mes', 'Análisis premium de CV', 'Exportaciones avanzadas de datos', 'Soporte prioritario', 'Gestor de cuenta dedicado']
    }
  ];

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-8">Planes de Suscripción</h1>
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
                ? 'Plan Actual'
                : plan.key === 'free'
                  ? 'Seleccionar Plan'
                  : 'Suscribirse'}
            </button>

            {/* Solo para Empresa mostramos el botón de gestión si está activo */}
            {plan.key === 'enterprise' && subscriptionActive && (
              <div className="mt-4 text-center">
                <button
                  onClick={handleManage}
                  className="px-6 py-2 border rounded-md hover:bg-secondary-100"
                >
                  Gestionar Suscripción
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}