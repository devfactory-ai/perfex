/**
 * Ophthalmology IVT Injections Page
 * List and manage intravitreal injections
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Syringe,
  Plus,
  Search,
  Calendar,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

export default function OphthalmologyIvtPage() {
  useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [drugFilter, setDrugFilter] = useState<string>('all');

  const { data: injections, isLoading } = useQuery({
    queryKey: ['ophthalmology-ivt', searchTerm, drugFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (drugFilter !== 'all') params.append('drug', drugFilter);
      const response = await api.get(`/ophthalmology/ivt-injections?${params}`);
      return response.data?.data || [];
    },
  });

  const getDrugColor = (drug: string) => {
    if (drug.includes('Eylea') || drug.includes('aflibercept')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    }
    if (drug.includes('Lucentis') || drug.includes('ranibizumab')) {
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    }
    if (drug.includes('Avastin') || drug.includes('bevacizumab')) {
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    }
    if (drug.includes('Vabysmo') || drug.includes('faricimab')) {
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    }
    return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Syringe className="h-7 w-7 text-blue-500" />
            Injections Intravitréennes (IVT)
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Anti-VEGF et corticoïdes intravitréens
          </p>
        </div>
        <button
          onClick={() => navigate('/ophthalmology/ivt-injections/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvelle IVT
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher un patient..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={drugFilter}
            onChange={(e) => setDrugFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les médicaments</option>
            <option value="aflibercept">Aflibercept (Eylea)</option>
            <option value="ranibizumab">Ranibizumab (Lucentis)</option>
            <option value="bevacizumab">Bevacizumab (Avastin)</option>
            <option value="faricimab">Faricimab (Vabysmo)</option>
            <option value="dexamethasone">Dexaméthasone (Ozurdex)</option>
          </select>
        </div>
      </div>

      {/* IVT List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : injections?.length === 0 ? (
          <div className="p-8 text-center">
            <Syringe className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Aucune injection IVT trouvée</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {injections?.map((injection: any) => (
              <div
                key={injection.id}
                onClick={() => navigate(`/ophthalmology/ivt-injections/${injection.id}`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
                      <Syringe className="h-6 w-6 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {injection.patientName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {injection.eye === 'OD' ? 'OD' : 'OG'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getDrugColor(injection.drug)}`}>
                          {injection.drug}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(injection.injectionDate).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{injection.indication}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-4 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Injection #</p>
                        <p className="font-medium text-gray-900 dark:text-white">{injection.injectionNumber}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Lot</p>
                        <p className="font-medium text-gray-900 dark:text-white">{injection.lotNumber || '-'}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
