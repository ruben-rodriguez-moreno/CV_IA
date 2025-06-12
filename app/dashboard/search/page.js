'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '/contexts/AuthContext';
import CvFilterPanel from '/components/CvFilterPanel';
import CvSearchResults from '/components/CvSearchResults';
import { searchCvs, getAllSkills } from '/services/cvSearchService';
import { MagnifyingGlassCircleIcon } from '@heroicons/react/24/outline';

export default function CvSearchPage() {
  const [results, setResults] = useState([]);
  const [availableSkills, setAvailableSkills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const { currentUser } = useAuth();

  // Cargar habilidades disponibles para autocompletar
  useEffect(() => {
    if (currentUser?.uid) {
      async function loadSkills() {
        const skills = await getAllSkills(currentUser.uid);
        setAvailableSkills(skills);
      }
      loadSkills();
    }
  }, [currentUser]);

  // Manejar búsqueda
  const handleSearch = async (filters) => {
    if (!currentUser?.uid) return;
    
    try {
      setLoading(true);
      const searchResults = await searchCvs(currentUser.uid, filters);
      setResults(searchResults);
      setInitialLoad(false);
    } catch (error) {
      console.error('Error en la búsqueda:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-secondary-900">Buscar CVs</h1>
      
      <div className="mt-6">
        <p className="text-sm text-secondary-600">
          Busca en tu base de datos de CVs usando palabras clave, habilidades y otros criterios.
        </p>
      </div>

      <div className="mt-6">
        <CvFilterPanel 
          onSearch={handleSearch} 
          availableSkills={availableSkills} 
          isLoading={loading}
        />
        
        {initialLoad ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <MagnifyingGlassCircleIcon className="h-16 w-16 text-secondary-300 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-secondary-700">Busca en tus CVs</h3>
            <p className="mt-2 text-sm text-secondary-500 max-w-md mx-auto">
              Usa el cuadro de búsqueda de arriba para encontrar CVs por habilidades, experiencia, educación o ubicación.
              Añade varias palabras clave para afinar tus resultados.
            </p>
          </div>
        ) : (
          <CvSearchResults 
            results={results} 
            isLoading={loading} 
          />
        )}
      </div>
    </div>
  );
}