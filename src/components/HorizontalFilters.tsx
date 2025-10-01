import React, { useState, useEffect } from 'react';
import { SearchFilters } from '../types';
import { Filter, ChevronDown, X, MapPin, CheckCircle } from 'lucide-react';
import { CATEGORIES, LOCATIONS } from '../constants/categories';

interface HorizontalFiltersProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  resultCount: number;
  displayMode?: 'grid' | 'feed';
  onDisplayModeChange?: (mode: 'grid' | 'feed') => void;
  offers?: any[]; // Add offers prop to extract tags
}

export default function HorizontalFilters({ 
  filters, 
  onFiltersChange, 
  resultCount, 
  displayMode = 'grid', 
  onDisplayModeChange,
  offers = []
}: HorizontalFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [popularTags, setPopularTags] = useState<string[]>([]);
  const [showAllTags, setShowAllTags] = useState(false);

  // Extract popular tags from offers data
  useEffect(() => {
    if (offers.length > 0) {
      const allTags = offers.flatMap(offer => offer.tags || []);
      const tagCounts = allTags.reduce((acc: Record<string, number>, tag: string) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
      
      // Get all tags for display
      const sortedTags = Object.entries(tagCounts)
        .sort(([,a], [,b]) => (b as number) - (a as number))
        .map(([tag]) => tag);
      
      setPopularTags(sortedTags);
    }
  }, [offers]);

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      category: '所有類別',
      location: '所有地點',
      priceRange: [0, 999999],
      minQuantity: 0,
      sortBy: 'discount',
      verifiedOnly: false,
      selectedTag: undefined
    });
  };

  const hasActiveFilters = filters.category !== '所有類別' || 
                          filters.location !== '所有地點' || 
                          filters.verifiedOnly ||
                          filters.selectedTag ||
                          filters.priceRange[0] > 0 || 
                          filters.priceRange[1] < 999999;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8">
      {/* Main Filter Bar */}
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Popular Tags */}
          {popularTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {(showAllTags ? popularTags : popularTags.slice(0, 6)).map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    // Toggle tag selection - if already selected, deselect it
                    if (filters.selectedTag === tag) {
                      handleFilterChange('selectedTag', undefined);
                    } else {
                      handleFilterChange('selectedTag', tag);
                    }
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    filters.selectedTag === tag
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {tag}
                </button>
              ))}
              {popularTags.length > 6 && (
                <button
                  onClick={() => setShowAllTags(!showAllTags)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300"
                >
                  {showAllTags ? '顯示較少' : `更多 (${popularTags.length - 6})`}
                </button>
              )}
            </div>
          )}

          {/* Verified Only Toggle */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={filters.verifiedOnly || false}
              onChange={(e) => handleFilterChange('verifiedOnly', e.target.checked)}
              className="mr-2 w-4 h-4 text-green-600 rounded focus:ring-green-500"
            />
            <div className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span>僅認證</span>
            </div>
          </label>

          {/* Display Mode Switcher */}
          {onDisplayModeChange && (
            <div className="flex items-center bg-gray-100 rounded-lg p-1 ml-auto">
              <button
                onClick={() => onDisplayModeChange('grid')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                  displayMode === 'grid'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM11 13a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                網格
              </button>
              <button
                onClick={() => onDisplayModeChange('feed')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center ${
                  displayMode === 'feed'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <svg className="h-4 w-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
                動態
              </button>
            </div>
          )}

          {/* More Filters Toggle */}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors duration-200 text-gray-700 font-medium"
          >
            <Filter className="h-4 w-4" />
            <span>更多篩選</span>
            <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="flex items-center space-x-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 font-medium"
            >
              <X className="h-4 w-4" />
              <span>清除</span>
            </button>
          )}
        </div>

        {/* Active Location Filter Display */}
        {filters.location !== '所有地點' && (
          <div className="mt-4 flex items-center bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium w-fit">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{filters.location}</span>
            <button
              onClick={() => handleFilterChange('location', '所有地點')}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {/* Advanced Filters (Collapsible) */}
      {showAdvanced && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-4">
            {/* Category Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">類別</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
              >
                <option value="所有類別">所有類別</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>

            {/* Location Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">地點</label>
              <select
                value={filters.location}
                onChange={(e) => handleFilterChange('location', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
              >
                <option value="所有地點">所有地點</option>
                {LOCATIONS.map((location) => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>

            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">價格範圍</label>
              <div className="flex space-x-2">
                <input
                  type="number"
                  placeholder="最低"
                  value={filters.priceRange[0] || ''}
                  onChange={(e) => handleFilterChange('priceRange', [Number(e.target.value) || 0, filters.priceRange[1]])}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                />
                <input
                  type="number"
                  placeholder="最高"
                  value={filters.priceRange[1] === 999999 ? '' : filters.priceRange[1]}
                  onChange={(e) => handleFilterChange('priceRange', [filters.priceRange[0], Number(e.target.value) || 999999])}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
                />
              </div>
            </div>

            {/* Sort By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排序方式</label>
              <select
                value={filters.sortBy}
                onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-sm"
              >
                <option value="discount">最佳折扣</option>
                <option value="price">最低價格</option>
                <option value="ending-soon">即將結束</option>
                <option value="newest">最新優先</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}