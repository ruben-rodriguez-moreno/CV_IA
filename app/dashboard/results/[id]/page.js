'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '/contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '/lib/firebase/config';
import { 
  ArrowLeftIcon,
  DocumentTextIcon,
  ChevronRightIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

export default function ResultDetail({ params }) {
  const { id } = params;
  const { currentUser } = useAuth();
  const router = useRouter();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchResult() {
      if (!currentUser?.uid) return;

      try {
        setLoading(true);
        
        const docRef = doc(db, 'cvs', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          
          // Check if this CV belongs to the current user
          if (data.userId !== currentUser.uid) {
            router.push('/dashboard/results');
            return;
          }
          
          setResult({
            id: docSnap.id,
            ...data,
            uploadedAt: data.uploadedAt?.toDate?.() || new Date()
          });
        } else {
          setError('CV analysis not found.');
        }
      } catch (error) {
        console.error('Error fetching result:', error);
        setError('Failed to load the CV analysis.');
      } finally {
        setLoading(false);
      }
    }

    fetchResult();
  }, [currentUser, id, router]);

  const formatDate = (date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  // Example analysis data structure (in a real app, this would come from your AI analysis)
  const mockAnalysis = {
    score: 78,
    strengths: [
      'Strong educational background',
      'Relevant technical skills',
      'Clear work experience timeline',
      'Includes quantifiable achievements'
    ],
    weaknesses: [
      'Too much technical jargon',
      'Missing keywords for target job',
      'Work experience lacks context',
      'Resume is too long (3 pages)'
    ],
    suggestions: [
      'Add more industry-specific keywords',
      'Quantify more achievements with numbers',
      'Condense to 1-2 pages',
      'Tailor summary to specific job descriptions'
    ],
    sections: {
      summary: {
        score: 70,
        feedback: 'Your summary is clear but could be more focused on your unique value proposition.'
      },
      experience: {
        score: 85,
        feedback: 'Good work experience with clear roles and responsibilities. Consider adding more measurable achievements.'
      },
      skills: {
        score: 90,
        feedback: 'Strong technical skills section. Consider organizing by proficiency level.'
      },
      education: {
        score: 95,
        feedback: 'Education section is well-structured and relevant.'
      },
    }
  };

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600 mx-auto"></div>
        <p className="mt-4 text-secondary-600">Loading analysis details...</p>
      </div>
    );
  }

  if (error || !result) {
    return (
      <div className="py-8 text-center">
        <XCircleIcon className="h-12 w-12 text-red-500 mx-auto" />
        <h2 className="mt-2 text-lg font-medium text-secondary-900">Something went wrong</h2>
        <p className="mt-1 text-secondary-500">{error || 'Unable to load CV analysis'}</p>
        <Link href="/dashboard/results" className="mt-6 btn btn-primary inline-flex items-center">
          <ArrowLeftIcon className="mr-2 h-4 w-4" />
          Back to results
        </Link>
      </div>
    );
  }

  // In a real application, you'd use result.analysis instead of mockAnalysis
  const analysis = result.analysis || mockAnalysis;

  return (
    <div>
      <div className="flex items-center">
        <Link href="/dashboard/results" className="text-primary-600 hover:text-primary-800 flex items-center">
          <ArrowLeftIcon className="h-4 w-4 mr-1" />
          Back to results
        </Link>
      </div>
      
      <div className="mt-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-secondary-900">{result.fileName}</h1>
        <a 
          href={result.fileURL} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
        >
          View original CV
          <ChevronRightIcon className="h-4 w-4 ml-1" />
        </a>
      </div>
      
      <p className="mt-1 text-sm text-secondary-500">
        Uploaded on {formatDate(result.uploadedAt)}
      </p>
      
      <div className="mt-8 bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-5 border-b border-secondary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-secondary-900">Overall Score</h2>
            <div className="flex items-center bg-primary-100 text-primary-800 text-lg font-bold px-4 py-1 rounded-full">
              {analysis.score}/100
            </div>
          </div>
          
          <div className="mt-4">
            <div className="w-full bg-secondary-200 rounded-full h-2.5">
              <div 
                className="bg-primary-600 h-2.5 rounded-full" 
                style={{ width: `${analysis.score}%` }}
              ></div>
            </div>
          </div>
        </div>
        
        <div className="px-6 py-5 grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <h3 className="text-md font-medium text-secondary-900 flex items-center">
              <CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" />
              Strengths
            </h3>
            <ul className="mt-4 space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-green-500">
                    <CheckCircleIcon className="h-5 w-5" />
                  </div>
                  <p className="ml-3 text-sm text-secondary-600">{strength}</p>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h3 className="text-md font-medium text-secondary-900 flex items-center">
              <XCircleIcon className="h-5 w-5 mr-2 text-red-500" />
              Areas to Improve
            </h3>
            <ul className="mt-4 space-y-2">
              {analysis.weaknesses.map((weakness, index) => (
                <li key={index} className="flex items-start">
                  <div className="flex-shrink-0 h-5 w-5 text-red-500">
                    <XCircleIcon className="h-5 w-5" />
                  </div>
                  <p className="ml-3 text-sm text-secondary-600">{weakness}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="px-6 py-5 border-t border-secondary-200">
          <h3 className="text-md font-medium text-secondary-900">
            Recommendations
          </h3>
          <ul className="mt-4 space-y-2">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="flex items-start">
                <div className="flex-shrink-0 h-5 w-5 text-primary-500 flex items-center justify-center">
                  <span className="text-sm font-medium">{index + 1}.</span>
                </div>
                <p className="ml-3 text-sm text-secondary-600">{suggestion}</p>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="px-6 py-5 border-t border-secondary-200">
          <h3 className="text-md font-medium text-secondary-900">
            Section-by-Section Analysis
          </h3>
          <div className="mt-4 space-y-4">
            {Object.entries(analysis.sections).map(([section, data]) => (
              <div key={section} className="bg-secondary-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium text-secondary-900 capitalize">
                    {section}
                  </h4>
                  <span className="bg-secondary-100 text-secondary-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {data.score}/100
                  </span>
                </div>
                <p className="mt-2 text-sm text-secondary-600">
                  {data.feedback}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="px-6 py-5 bg-secondary-50 border-t border-secondary-200">
          <div className="flex justify-center">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => window.print()}
            >
              Export results as PDF
            </button>
            <Link
              href="/dashboard/upload"
              className="ml-4 btn btn-secondary"
            >
              Upload a new version
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
