/**
 * Ophthalmology OCT Page
 * List and manage OCT scans
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Scan,
  Plus,
  Search,
  Calendar,
  ChevronRight,
  Eye,
} from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../lib/api';

export default function OphthalmologyOctPage() {
  useLanguage();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [eyeFilter, setEyeFilter] = useState<string>('all');

  const { data: octScans, isLoading } = useQuery({
    queryKey: ['ophthalmology-oct', searchTerm, eyeFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (eyeFilter !== 'all') params.append('eye', eyeFilter);
      const response = await api.get(`/ophthalmology/oct?${params}`);
      return response.data?.data || [];
    },
  });

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'good':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'fair':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'poor':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Scan className="h-7 w-7 text-blue-500" />
            OCT - Tomographie en Cohérence Optique
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Examens OCT maculaires et RNFL
          </p>
        </div>
        <button
          onClick={() => navigate('/ophthalmology/oct/new')}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Nouvel OCT
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
            value={eyeFilter}
            onChange={(e) => setEyeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Tous les yeux</option>
            <option value="OD">Œil Droit (OD)</option>
            <option value="OG">Œil Gauche (OG)</option>
          </select>
        </div>
      </div>

      {/* OCT List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          </div>
        ) : octScans?.length === 0 ? (
          <div className="p-8 text-center">
            <Scan className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Aucun OCT trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {octScans?.map((oct: any) => (
              <div
                key={oct.id}
                onClick={() => navigate(`/ophthalmology/oct/${oct.id}`)}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center">
                      <Scan className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {oct.patientName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                          {oct.eye === 'OD' ? 'Œil Droit' : 'Œil Gauche'}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getQualityColor(oct.signalQuality)}`}>
                          {oct.signalQuality === 'good' ? 'Bonne qualité' :
                           oct.signalQuality === 'fair' ? 'Qualité moyenne' : 'Qualité faible'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(oct.scanDate).toLocaleDateString('fr-FR')}
                        </span>
                        <span>{oct.scanType}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">CMT</p>
                        <p className="font-medium text-gray-900 dark:text-white">{oct.centralMacularThickness} µm</p>
                      </div>
                      <div className="text-center">
                        <p className="text-gray-500 dark:text-gray-400">Volume</p>
                        <p className="font-medium text-gray-900 dark:text-white">{oct.maculaVolume} mm³</p>
                      </div>
                      {oct.rnflThickness && (
                        <div className="text-center">
                          <p className="text-gray-500 dark:text-gray-400">RNFL</p>
                          <p className="font-medium text-gray-900 dark:text-white">{oct.rnflThickness} µm</p>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </div>
                {oct.findings && (
                  <div className="mt-2 ml-16 text-sm text-gray-600 dark:text-gray-400">
                    <Eye className="h-4 w-4 inline mr-1" />
                    {oct.findings}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
