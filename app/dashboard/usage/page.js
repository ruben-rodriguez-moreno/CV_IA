'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '/contexts/AuthContext';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function UsageDashboard() {
  const { currentUser } = useAuth();
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    async function fetchUsageData() {
      try {
        const response = await fetch('/api/subscription/status');
        if (!response.ok) {
          throw new Error('Failed to fetch subscription data');
        }
        const data = await response.json();
        setUsageData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    
    if (currentUser) {
      fetchUsageData();
    }
  }, [currentUser]);
  
  if (loading) {
    return <div className="flex justify-center items-center py-12">Loading usage data...</div>;
  }
  
  if (error) {
    return <div className="p-4 bg-red-100 text-red-700 rounded-md">{error}</div>;
  }
  
  if (!usageData) {
    return <div>No usage data available</div>;
  }
  
  // Calculate usage percentage
  const usagePercentage = (usageData.usage.current / usageData.usage.limit) * 100;
  
  // Prepare data for historical chart
  // Using dummy data - in a real app, this would come from the API
  const monthlyData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'CV Uploads',
        data: [4, 7, 3, 5, 6, 8, 10, 8, 12, 15, 9, usageData.usage.current],
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  };
  
  // Prepare data for usage by type chart (dummy data)
  const usageByTypeData = {
    labels: ['Technical', 'Management', 'Creative', 'Sales', 'Other'],
    datasets: [
      {
        label: 'CV Types',
        data: [12, 19, 8, 15, 7],
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(153, 102, 255, 0.5)',
        ],
      },
    ],
  };
  
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Monthly CV Usage',
      },
    },
  };
  
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-secondary-900 mb-8">Usage Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Current Usage */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Current Usage</h2>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-secondary-700">
              {usageData.usage.current} / {usageData.usage.limit} CVs
            </span>
            <span className="text-sm font-medium text-secondary-900">
              {usagePercentage.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-secondary-200 rounded-full h-2.5">
            <div 
              className={`h-2.5 rounded-full ${
                usagePercentage > 80 ? 'bg-red-500' : 
                usagePercentage > 60 ? 'bg-yellow-500' : 'bg-primary-600'
              }`} 
              style={{ width: `${usagePercentage}%` }}
            ></div>
          </div>
        </div>
        
        {/* Subscription Plan */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Subscription Plan</h2>
          <div className="flex items-center">
            <div className="bg-primary-100 text-primary-800 p-3 rounded-full">
              {usageData.plan === 'free' && '🔍'}
              {usageData.plan === 'pro' && '⭐'}
              {usageData.plan === 'enterprise' && '🏆'}
            </div>
            <div className="ml-4">
              <h3 className="font-semibold capitalize">{usageData.plan} Plan</h3>
              <p className="text-sm text-secondary-600">
                {usageData.plan === 'free' ? '5 CVs per month' : 
                 usageData.plan === 'pro' ? '100 CVs per month' : 
                 '1000+ CVs per month'}
              </p>
            </div>
          </div>
          {usageData.plan !== 'enterprise' && (
            <div className="mt-4">
              <a 
                href="/dashboard/subscription" 
                className="text-primary-600 hover:text-primary-800 text-sm font-medium"
              >
                Upgrade your plan →
              </a>
            </div>
          )}
        </div>
        
        {/* Billing Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Billing</h2>
          {usageData.plan !== 'free' ? (
            <>
              <p className="text-secondary-600 mb-4">Manage your subscription and payment methods</p>
              <a 
                href={usageData.billingPortalUrl || '#'} 
                className="inline-block px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
              >
                Manage Billing
              </a>
            </>
          ) : (
            <p className="text-secondary-600">
              Free plan - No billing information required
            </p>
          )}
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Monthly Usage History</h2>
          <div className="h-64">
            <Line options={chartOptions} data={monthlyData} />
          </div>
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">CV Types Distribution</h2>
          <div className="h-64">
            <Bar 
              options={{
                ...chartOptions,
                plugins: {
                  ...chartOptions.plugins,
                  title: {
                    ...chartOptions.plugins.title,
                    text: 'CV Types Distribution',
                  },
                },
              }} 
              data={usageByTypeData} 
            />
          </div>
        </div>
      </div>
    </div>
  );
}
