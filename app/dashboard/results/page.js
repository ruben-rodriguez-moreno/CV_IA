'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { collection, query, where, orderBy, getDocs, doc, deleteDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../config/firebase-browser';
import {
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

export default function Results() {
  const { currentUser } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedCv, setSelectedCv] = useState(null);
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'cvs'),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const updatedResults = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          uploadedAt: doc.data().uploadedAt?.toDate()
        }))
        .filter(cv => 
          (cv.userId === currentUser.uid || cv.creatorId === currentUser.uid) &&
          (activeFilter === 'all' || cv.status === activeFilter)
        );

      setResults(updatedResults);
      setLoading(false);
    }, (err) => {
      setError("Error loading CVs: " + err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser, activeFilter]);
  const retryAnalysis = async (cvId) => {
    setProcessingAction(true);
    try {
      await updateDoc(doc(db, 'cvs', cvId), {
        status: 'processing',
        analysis: null, // Reiniciamos el análisis antes de intentar nuevamente
        retryCount: (results.find(r => r.id === cvId)?.retryCount || 0) + 1,
        lastAttempt: new Date()
      });
      alert("Re-análisis iniciado. Por favor espera...");
    } catch (err) {
      setError("Error al reintentar: " + err.message);
    } finally {
      setProcessingAction(false);
    }
  };


  const deleteCv = async (cvId) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este CV?")) return;
    
    setProcessingAction(true);
    try {
      await deleteDoc(doc(db, 'cvs', cvId));
    } catch (err) {
      setError("Error al eliminar: " + err.message);
    } finally {
      setProcessingAction(false);
    }
  };

  const viewCvDetails = (cv) => {
    setSelectedCv(cv);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return format(date, 'MMM dd, yyyy HH:mm');
    } catch (e) {
      return 'Invalid date';
    }
  };
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            <ClockIcon className="mr-1 h-3 w-3" /> Pendiente
          </span>
        );
      case 'processing':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <ArrowPathIcon className="animate-spin mr-1 h-3 w-3" />
            Procesando
          </span>
        );
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="mr-1 h-3 w-3" /> Completado
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <ExclamationTriangleIcon className="mr-1 h-3 w-3" /> Fallido
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Desconocido
          </span>
        );
    }
  };const AnalysisSection = ({ title, content, fallback, icon }) => {
    if (!content || (Array.isArray(content) && content.length === 0)) {
      return (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg mb-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-5 w-5 text-amber-500 mr-2" />
            <p className="text-amber-700 text-sm font-medium">{fallback}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="mb-8 bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-100">
        <div className="flex items-center mb-4">
          {icon && <span className="text-2xl mr-3">{icon}</span>}
          <h4 className="text-lg font-semibold text-gray-900">{title}</h4>
        </div>
        
        {Array.isArray(content) ? (
          <div className={title === "Habilidades" || title === "Idiomas" ? "flex flex-wrap gap-2" : "space-y-4"}>
            {content.map((item, index) => {
              // Handle string items (like skills and languages)
              if (typeof item === 'string') {
                // For skills section, render as individual tags in a flex container
                if (title === "Habilidades" || title === "Idiomas") {
                  return (
                    <span
                      key={index}
                      className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      {item}
                    </span>
                  );
                } else {
                  // For other string arrays, render as simple list
                  return (
                    <div key={index} className="text-sm text-gray-700 p-2 bg-white rounded-lg border border-gray-200">
                      {item}
                    </div>
                  );
                }
              }
                // Handle object items (like experience and education)
              if (typeof item === 'object' && item !== null) {
                // Handle education objects first (support both English and Spanish field names)
                if (title === "Educación" && (item.institucion || item.institution || item.titulo || item.degree || item.title)) {
                  return (
                    <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-lg text-gray-900">
                          {item.titulo || item.degree || item.title || 'Título no especificado'}
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {item.periodo || item.period || item.año || item.year || 'Período no especificado'}
                        </span>
                      </div>
                      <div className="text-base text-green-600 font-medium mb-2">
                        {item.institucion || item.institution || 'Institución no especificada'}
                      </div>
                      {(item.descripcion || item.description) && (
                        <div className="text-sm text-gray-700 mt-3 leading-relaxed">
                          {item.descripcion || item.description}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Handle experience objects (support both English and Spanish field names)
                if (title === "Experiencia Laboral" && (item.empresa || item.company || item.puesto || item.position)) {
                  return (
                    <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-lg text-gray-900">
                          {item.puesto || item.position || item.title || 'Puesto no especificado'}
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {item.periodo || item.period || item.año || item.year || 'Período no especificado'}
                        </span>
                      </div>
                      <div className="text-base text-indigo-600 font-medium mb-2">
                        {item.empresa || item.company || 'Empresa no especificada'}
                      </div>
                      {(item.descripcion || item.description) && (
                        <div className="text-sm text-gray-700 mt-3 leading-relaxed">
                          {item.descripcion || item.description}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Generic fallback for other objects that don't match specific patterns
                if (item.institucion || item.institution || item.titulo || item.degree || item.title) {
                  return (
                    <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-lg text-gray-900">
                          {item.titulo || item.degree || item.title || 'Título no especificado'}
                        </div>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {item.periodo || item.period || item.año || item.year || 'Período no especificado'}
                        </span>
                      </div>
                      <div className="text-base text-green-600 font-medium mb-2">
                        {item.institucion || item.institution || 'Institución no especificada'}
                      </div>
                      {(item.descripcion || item.description) && (
                        <div className="text-sm text-gray-700 mt-3 leading-relaxed">
                          {item.descripcion || item.description}
                        </div>
                      )}
                    </div>
                  );
                }
                
                if (item.empresa || item.company || item.puesto || item.position) {
                  return (
                    <div key={index} className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold text-lg text-gray-900">
                          {item.puesto || item.position || item.title || 'Puesto no especificado'}
                        </div>
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {item.periodo || item.period || item.año || item.year || 'Período no especificado'}
                        </span>
                      </div>
                      <div className="text-base text-indigo-600 font-medium mb-2">
                        {item.empresa || item.company || 'Empresa no especificada'}
                      </div>
                      {(item.descripcion || item.description) && (
                        <div className="text-sm text-gray-700 mt-3 leading-relaxed">
                          {item.descripcion || item.description}
                        </div>
                      )}
                    </div>
                  );
                }
                
                // Fallback for unknown object structure
                return (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <pre className="text-xs text-gray-600 overflow-auto">
                      {JSON.stringify(item, null, 2)}
                    </pre>
                  </div>
                );
              }
              
              return null;
            })}
          </div>
        ) : (
          <p className="text-base text-gray-700 leading-relaxed bg-white p-4 rounded-lg border border-gray-200">{content}</p>
        )}
      </div>
    );
  };

  const AIAdviceSection = ({ analysis }) => {
    if (!analysis) return null;

    const generateAdvice = () => {
      const advice = [];
      
      // Skills advice
      if (!analysis.skills || analysis.skills.length < 5) {
        advice.push({
          category: "Habilidades",
          icon: "🎯",
          suggestion: "Añade más habilidades técnicas y blandas relevantes para tu campo profesional. Incluye herramientas, software y competencias específicas.",
          priority: "alta"
        });
      }

      // Experience advice
      if (!analysis.experience || analysis.experience.length < 2) {
        advice.push({
          category: "Experiencia",
          icon: "💼",
          suggestion: "Detalla mejor tu experiencia laboral incluyendo logros específicos, métricas y responsabilidades principales en cada puesto.",
          priority: "alta"
        });
      }

      // Education advice
      if (!analysis.education || analysis.education.length === 0) {
        advice.push({
          category: "Educación",
          icon: "🎓",
          suggestion: "Asegúrate de incluir tu formación académica, certificaciones y cursos relevantes para tu campo profesional.",
          priority: "media"
        });
      }

      // General advice
      advice.push({
        category: "Formato",
        icon: "📄",
        suggestion: "Usa un formato limpio y profesional, con secciones bien definidas y información fácil de leer para los reclutadores.",
        priority: "media"
      });

      advice.push({
        category: "Palabras Clave",
        icon: "🔍",
        suggestion: "Incluye palabras clave relevantes de tu industria para mejorar la compatibilidad con sistemas ATS (Applicant Tracking Systems).",
        priority: "alta"
      });

      return advice;
    };

    const advice = generateAdvice();

    return (
      <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 p-6 rounded-xl border border-green-200">
        <div className="flex items-center mb-6">
          <span className="text-2xl mr-3">🤖</span>
          <h4 className="text-xl font-bold text-gray-900">Consejos de IA para Mejorar tu CV</h4>
        </div>
        
        <div className="space-y-4">
          {advice.map((item, index) => (
            <div 
              key={index} 
              className={`bg-white p-4 rounded-lg border-l-4 ${
                item.priority === 'alta' ? 'border-red-400' : 'border-yellow-400'
              } shadow-sm`}
            >
              <div className="flex items-start">
                <span className="text-lg mr-3">{item.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-semibold text-gray-900">{item.category}</h5>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      item.priority === 'alta' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      Prioridad {item.priority}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{item.suggestion}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-blue-100 rounded-lg">
          <div className="flex items-center">
            <span className="text-lg mr-2">💡</span>
            <p className="text-sm text-blue-800 font-medium">
              Consejo: Personaliza tu CV para cada aplicación de trabajo, destacando las habilidades y experiencias más relevantes para el puesto específico.
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Resultados de Análisis de CV</h1>
        <button
          onClick={() => window.location.reload()}
          disabled={loading}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
        >
          <ArrowPathIcon className={`-ml-0.5 mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-400" aria-hidden="true" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { key: 'all', label: 'Todos' },
              { key: 'pending', label: 'Pendiente' },
              { key: 'processing', label: 'Procesando' },
              { key: 'completed', label: 'Completado' },
              { key: 'failed', label: 'Fallido' }
            ].map((filter) => (
              <button
                key={filter.key}
                onClick={() => setActiveFilter(filter.key)}
                className={`${
                  activeFilter === filter.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
              >
                {filter.label}
              </button>
            ))}
          </nav>
        </div>
      </div>      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-sm text-gray-500">Cargando resultados...</p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No se encontraron CVs</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeFilter === 'all'
              ? "Aún no has subido ningún CV"
              : `No se encontraron CVs con estado "${
                  activeFilter === 'pending' ? 'pendiente' :
                  activeFilter === 'processing' ? 'procesando' :
                  activeFilter === 'completed' ? 'completado' :
                  activeFilter === 'failed' ? 'fallido' : activeFilter
                }"`}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">          <table className="min-w-full divide-y divide-gray-300">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                  Nombre del Archivo
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Fecha de Subida
                </th>
                <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                  Estado
                </th>
                <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {results.map((result) => (
                <tr key={result.id}>
                  <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                    {result.fileName}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {formatDate(result.uploadedAt)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    {getStatusBadge(result.status)}
                  </td>
                  <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                    <div className="flex justify-end space-x-3">                      <button
                        onClick={() => window.open(result.fileURL, '_blank')}
                        className="text-blue-600 hover:text-blue-900"
                        title="Ver CV Original"
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>

                      {result.status === 'completed' && (
                        <button
                          onClick={() => viewCvDetails(result)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Ver Detalles del Análisis"
                        >
                          <MagnifyingGlassIcon className="h-5 w-5" />
                        </button>
                      )}

                      {(result.status === 'pending' || result.status === 'failed') && (
                        <button
                          onClick={() => retryAnalysis(result.id)}
                          disabled={processingAction}
                          className={`text-yellow-600 hover:text-yellow-900 ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                          title="Reintentar Análisis"
                        >
                          <ArrowPathIcon className="h-5 w-5" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteCv(result.id)}
                        disabled={processingAction}
                        className={`text-red-600 hover:text-red-900 ${processingAction ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title="Eliminar CV"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedCv && (        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-xl font-semibold text-gray-900">
                📊 Resultados del Análisis de CV: {selectedCv.fileName}
              </h3>
              <button
                onClick={() => setSelectedCv(null)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="px-6 py-6">
              {selectedCv.analysis ? (
                <div className="space-y-8">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg mb-6 border border-blue-200">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">🤖</span>
                      <div>
                        <p className="text-sm text-blue-800 font-medium">
                          Análisis de IA generado: {formatDate(selectedCv.analysis.analyzedAt)}
                        </p>
                        {selectedCv.analysis.score && (
                          <p className="text-sm text-blue-600">
                            Puntuación de confianza: {selectedCv.analysis.score}%
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <AnalysisSection
                    title="Habilidades"
                    icon="🎯"
                    content={selectedCv.analysis.skills}
                    fallback="No se detectaron habilidades en el análisis"
                  />

                  <AnalysisSection
                    title="Experiencia Laboral"
                    icon="💼"
                    content={selectedCv.analysis.experience}
                    fallback="No se pudieron extraer los detalles de experiencia laboral"
                  />

                  <AnalysisSection
                    title="Educación"
                    icon="🎓"
                    content={selectedCv.analysis.education}
                    fallback="No se encontró información educativa"
                  />

                  {selectedCv.analysis.languages && (
                    <AnalysisSection
                      title="Idiomas"
                      icon="🌍"
                      content={selectedCv.analysis.languages}
                      fallback="No se detectaron idiomas"
                    />
                  )}

                  <AIAdviceSection analysis={selectedCv.analysis} />

                  {selectedCv.analysis.rawText && (
                    <div className="mt-8 border-t pt-6">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">📄</span>
                          Vista Previa del Texto Extraído
                        </h4>
                        <pre className="text-xs text-gray-600 whitespace-pre-wrap overflow-auto max-h-40 bg-white p-3 rounded border">
                          {selectedCv.analysis.rawText.substring(0, 1500)}...
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Análisis Fallido</h3>
                  <p className="mt-2 text-sm text-red-600">El análisis no se pudo completar. Por favor, inténtalo de nuevo.</p>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setSelectedCv(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm font-medium"
              >
                Cerrar
              </button>
              {selectedCv.analysis && (
                <button
                  onClick={() => window.open(selectedCv.fileURL, '_blank')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium"
                >
                  Ver CV Completo
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}