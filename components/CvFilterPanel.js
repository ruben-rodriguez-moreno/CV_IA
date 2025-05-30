'use client';

import { useState, useEffect, useRef } from 'react';
import { XMarkIcon, MagnifyingGlassIcon, AdjustmentsHorizontalIcon } from '@heroicons/react/24/outline';
import { useAuth } from '/contexts/AuthContext';

const CvFilterPanel = ({ onSearch, availableSkills = [], isLoading = false }) => {
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);  const [filters, setFilters] = useState({
    experienceYears: '',
    educationLevel: '',
    location: '',
    sourceType: '',
    analysisType: '',
  });
  const { currentUser } = useAuth();
  const searchInputRef = useRef(null);
  // Education level options
  const educationLevels = [
    { id: 'high-school', name: 'High School / Bachillerato' },
    { id: 'associate', name: 'Associate / Técnico' },
    { id: 'bachelor', name: 'Bachelor\'s / Licenciatura' },
    { id: 'master', name: 'Master\'s / Maestría' },
    { id: 'phd', name: 'PhD / Doctorado' },
  ];

  // Years of experience options
  const experienceRanges = [
    { id: '0-1', name: 'Entry level (0-1 years)' },
    { id: '1-3', name: 'Junior (1-3 years)' },
    { id: '3-5', name: 'Mid-level (3-5 years)' },
    { id: '5-10', name: 'Senior (5-10 years)' },
    { id: '10+', name: 'Expert (10+ years)' },
  ];

  // CV Source options
  const sourceTypes = [
    { id: 'all', name: 'All CVs' },
    { id: 'direct', name: 'Direct uploads only' },
    { id: 'shared', name: 'Shared link uploads only' },
  ];

  // Analysis status options
  const analysisTypes = [
    { id: 'all', name: 'All statuses' },
    { id: 'ai_analysis', name: 'AI analyzed' },
    { id: 'text_only', name: 'Text only' },
  ];

  // Handle search input changes and provide suggestions
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setSuggestions([]);
      return;
    }

    // Filter available skills that match the search term
    const filteredSuggestions = availableSkills
      .filter(skill => 
        skill.toLowerCase().includes(searchTerm.toLowerCase()) && 
        !selectedTags.includes(skill)
      )
      .slice(0, 5); // Limit to 5 suggestions
    
    setSuggestions(filteredSuggestions);
  }, [searchTerm, availableSkills, selectedTags]);

  // Add a tag when a suggestion is selected
  const addTag = (tag) => {
    if (tag && !selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
      setSearchTerm('');
      setSuggestions([]);
      searchInputRef.current?.focus();
    }
  };

  // Remove a tag
  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };
  // Handle search submission
  const handleSearch = () => {
    onSearch({
      keywords: selectedTags.map(tag => tag.toLowerCase()), // Normalizar a minúsculas
      experienceYears: filters.experienceYears,
      educationLevel: filters.educationLevel,
      location: filters.location.toLowerCase(), // Normalizar ubicación
      sourceType: filters.sourceType,
      analysisType: filters.analysisType,
    });
  };
  // Clear all filters and tags
  const clearAll = () => {
    setSelectedTags([]);
    setFilters({
      experienceYears: '',
      educationLevel: '',
      location: '',
      sourceType: '',
      analysisType: '',
    });
    setSearchTerm('');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
      <div className="flex flex-col space-y-4">
        {/* Search input and tags */}
        <div className="relative">
          <div className="flex items-center border border-secondary-300 rounded-md focus-within:ring-2 focus-within:ring-primary-500 focus-within:border-transparent">
            <MagnifyingGlassIcon className="h-5 w-5 text-secondary-400 ml-3" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search for skills..."
              className="flex-1 p-2 outline-none"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 text-secondary-500 hover:text-secondary-700"
              aria-label="Toggle filters"
              title="Toggle filters"
            >
              <AdjustmentsHorizontalIcon className="h-5 w-5" />
            </button>
          </div>
          
          {/* Autocomplete suggestions */}
          {suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white rounded-md shadow-lg border border-secondary-200">
              <ul className="max-h-60 overflow-y-auto py-1">
                {suggestions.map((suggestion, index) => (
                  <li
                    key={index}
                    onClick={() => addTag(suggestion)}
                    className="px-3 py-2 hover:bg-secondary-100 cursor-pointer"
                  >
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Selected tags */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTags.map((tag, index) => (
                <div
                  key={index}
                  className="flex items-center bg-primary-100 text-primary-700 px-2 py-1 rounded-md"
                >
                  <span className="text-sm">{tag}</span>
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-primary-500 hover:text-primary-700"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
          {/* Additional filters - conditional display */}
        {showFilters && (
          <div className="space-y-4 pt-4 border-t border-secondary-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Experience Years Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Years of Experience
                </label>
                <select
                  name="experienceYears"
                  value={filters.experienceYears}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-secondary-300 p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Any experience</option>
                  {experienceRanges.map((range) => (
                    <option key={range.id} value={range.id}>
                      {range.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Education Level Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Education Level
                </label>
                <select
                  name="educationLevel"
                  value={filters.educationLevel}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-secondary-300 p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Any education</option>
                  {educationLevels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.name}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Location Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={filters.location}
                  onChange={handleFilterChange}
                  placeholder="City, country, etc."
                  className="w-full rounded-md border border-secondary-300 p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Source Type Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  CV Source
                </label>
                <select
                  name="sourceType"
                  value={filters.sourceType}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-secondary-300 p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {sourceTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Analysis Status Filter */}
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Analysis Status
                </label>
                <select
                  name="analysisType"
                  value={filters.analysisType}
                  onChange={handleFilterChange}
                  className="w-full rounded-md border border-secondary-300 p-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  {analysisTypes.map((type) => (
                    <option key={type.id} value={type.id}>
                      {type.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}
        
        {/* Search buttons */}
        <div className="flex justify-between pt-2">
          <button
            onClick={clearAll}
            className="text-secondary-600 hover:text-secondary-800 text-sm"
          >
            Clear all
          </button>
          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="btn btn-primary py-1"
          >
            {isLoading ? 'Searching...' : 'Search CVs'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CvFilterPanel;
