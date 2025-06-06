import Link from 'next/link';
import Navbar from '/components/ui/Navbar';
import Footer from '/components/ui/Footer';
import { CheckIcon } from '@heroicons/react/24/outline';

export default function Pricing() {
  const plans = [
    {
      name: 'Free',
      price: '€0',
      description: 'Basic CV analysis for job seekers',
      features: [
        '3 CV analyses per month',
        'Basic formatting feedback',
        'General content suggestions',
        'Export to PDF',
      ],
      button: {
        text: 'Get started',
        href: '/register',
      },
      highlighted: false,
    },
    {
      name: 'Pro',
      price: '€9.99',
      period: 'per month',
      description: 'Advanced analysis for serious job hunters',
      features: [
        'Unlimited CV analyses',
        'Industry-specific feedback',
        'ATS optimization tips',
        'Keyword analysis for job descriptions',
        'Priority support',
        'Resume templates access',
      ],
      button: {
        text: 'Start free trial',
        href: '/register?plan=pro',
      },
      highlighted: true,
    },
    {
      name: 'Enterprise',
      price: '€49.99',
      period: 'per month',
      description: 'Complete solution for organizations',
      features: [
        'All Pro features',
        'Multiple user accounts',
        'Team management dashboard',
        'API access',
        'Custom integration',
        'Dedicated account manager',
        'Custom branding',
      ],
      button: {
        text: 'Contact sales',
        href: '/contact',
      },
      highlighted: false,
    },
  ];

  return (
    <>
      <Navbar />
      <main>
        <div className="bg-secondary-50 py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl font-extrabold text-secondary-900 sm:text-5xl md:text-6xl">
                Simple, transparent pricing
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl text-secondary-500">
                Choose the plan that's right for you. All plans come with a 14-day money-back guarantee.
              </p>
            </div>

            <div className="mt-16 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`bg-white rounded-lg shadow-sm overflow-hidden ${
                    plan.highlighted ? 'ring-2 ring-primary-600' : ''
                  }`}
                >
                  <div className="p-8">
                    <h3 className="text-xl font-medium text-secondary-900">{plan.name}</h3>
                    <p className="mt-4">
                      <span className="text-4xl font-extrabold text-secondary-900">{plan.price}</span>
                      {plan.period && (
                        <span className="text-base font-medium text-secondary-500">
                          {' '}
                          {plan.period}
                        </span>
                      )}
                    </p>
                    <p className="mt-2 text-sm text-secondary-500">{plan.description}</p>

                    <ul className="mt-8 space-y-4">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <div className="flex-shrink-0">
                            <CheckIcon className="h-5 w-5 text-primary-500" aria-hidden="true" />
                          </div>
                          <p className="ml-3 text-sm text-secondary-700">{feature}</p>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-8">
                      <Link
                        href={plan.button.href}
                        className={`block w-full text-center py-3 px-4 rounded-md shadow ${
                          plan.highlighted
                            ? 'bg-primary-600 text-white hover:bg-primary-700'
                            : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
                        } font-medium`}
                      >
                        {plan.button.text}
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
