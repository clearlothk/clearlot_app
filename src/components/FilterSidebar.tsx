import React from 'react';
import { SearchFilters } from '../types';
import { Sliders, MapPin, DollarSign, Package, CheckCircle } from 'lucide-react';
import { CATEGORIES, LOCATIONS } from '../constants/categories';

interface FilterSidebarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function FilterSidebar({ filters, onFiltersChange, isOpen, onClose }: FilterSidebarProps) {

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed lg:sticky top-0 left-0 h-screen lg:h-auto bg-white border-r border-gray-200 w-80 lg:w-72 p-6 z-50 transform transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between mb-8 lg:mb-6">
          <h3 className="text-xl font-bold text-gray-900 flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg mr-3">
              <Sliders className="h-5 w-5 text-blue-600" />
            </div>
            篩選
          </h3>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 p-2 rounded-lg transition-colors duration-200"
          >
            ×
          </button>
        </div>

        <div className="space-y-8">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
              <Package className="h-4 w-4 mr-2 text-blue-600" />
              類別
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors duration-200 font-medium"
            >
                              <option value="所有類別">所有類別</option>
                {CATEGORIES.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
          </div>

          {/* Location Filter */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
              <MapPin className="h-4 w-4 mr-2 text-blue-600" />
              地點
            </label>
            <select
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors duration-200 font-medium"
            >
                              <option value="所有地點">所有地點</option>
                {LOCATIONS.map((location) => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3 flex items-center">
              <DollarSign className="h-4 w-4 mr-2 text-blue-600" />
              價格範圍
            </label>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="number"
                placeholder="最低"
                value={filters.priceRange[0] || ''}
                onChange={(e) => 
                  handleFilterChange('priceRange', [Number(e.target.value) || 0, filters.priceRange[1]])
                }
                className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors duration-200 font-medium"
              />
              <input
                type="number"
                placeholder="最高"
                value={filters.priceRange[1] || ''}
                onChange={(e) => 
                  handleFilterChange('priceRange', [filters.priceRange[0], Number(e.target.value) || 999999])
                }
                className="border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors duration-200 font-medium"
              />
            </div>
          </div>



          {/* Sort By */}
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-3">
              排序方式
            </label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 focus:bg-white transition-colors duration-200 font-medium"
            >
              <option value="discount">最佳折扣</option>
              <option value="price">最低價格</option>
              <option value="ending-soon">即將結束</option>
              <option value="newest">最新優先</option>
            </select>
          </div>

          {/* Clear Filters */}
          <button
            onClick={() => onFiltersChange({
              category: '所有類別',
              location: '所有地點',
              priceRange: [0, 999999],
              minQuantity: 0,
              sortBy: 'discount'
            })}
            className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-semibold"
          >
            清除所有篩選
          </button>
        </div>
      </div>
    </>
  );
}