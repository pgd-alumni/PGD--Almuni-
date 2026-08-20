import React, { useState, useMemo } from 'react';
import { Building2, Users, Search, ArrowRight, MapPin, Sparkles } from 'lucide-react';
import { AlumniRecord } from '../types';

interface CompanyDirectoryModuleProps {
  alumniList: AlumniRecord[];
  onSelectCompany: (company: string) => void;
  setActiveTab: (tab: string) => void;
}

export const CompanyDirectoryModule: React.FC<CompanyDirectoryModuleProps> = ({
  alumniList,
  onSelectCompany,
  setActiveTab
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Group alumni by company
  const companyGroups = useMemo(() => {
    const map = new Map<string, AlumniRecord[]>();
    alumniList.forEach(alumni => {
      const comp = alumni.company.trim();
      if (!comp) return;
      if (!map.has(comp)) {
        map.set(comp, []);
      }
      map.get(comp)!.push(alumni);
    });

    const result = Array.from(map.entries()).map(([companyName, members]) => ({
      companyName,
      count: members.length,
      members,
      locations: Array.from(new Set(members.map(m => m.city).filter(Boolean))),
    })).sort((a, b) => b.count - a.count);

    return result;
  }, [alumniList]);

  const filteredCompanies = companyGroups.filter(c => 
    c.companyName.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-12">
      
      {/* Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 space-y-4 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-2 text-xs font-semibold text-amber-400">
          <Sparkles className="w-4 h-4" />
          <span>Employer & Industry Presence Directory</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold">Alumni Business & Company Directory</h1>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Discover {companyGroups.length} RMG manufacturers, buying houses, global brand liaison offices, and textile mills employing BUTEX PGD graduates.
        </p>

        <div className="relative pt-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search company by name (e.g. Apex, Epic, BKMEA, Decathlon)..."
            className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400"
          />
        </div>
      </div>

      {/* Control Bar: Total Count & Grid/List View Toggles (Desktop only) */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs sm:text-sm text-slate-500 font-medium">
          Showing <span className="font-bold text-slate-900">{filteredCompanies.length}</span> companies
        </p>
        <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Grid View
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'list'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            List View
          </button>
        </div>
      </div>

      {/* Conditional Layout Rendering */}
      {viewMode === 'grid' ? (
        /* Companies Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCompanies.map((group) => (
            <div
              key={group.companyName}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-xl hover:border-amber-400 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-extrabold text-lg shrink-0">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-extrabold">
                    {group.count} Alumni {group.count === 1 ? 'Member' : 'Members'}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-lg leading-snug">{group.companyName}</h3>
                  {group.locations.length > 0 && (
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{group.locations.join(', ')}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1 pt-2 border-t border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Key Representatives</span>
                  <div className="space-y-1">
                    {group.members.slice(0, 3).map(m => (
                      <div key={m.id} className="text-xs text-slate-700 flex items-center justify-between">
                        <span className="font-medium truncate">{m.name}</span>
                        <span className="text-[10px] text-slate-400 truncate max-w-[120px]">{m.designation}</span>
                      </div>
                    ))}
                    {group.members.length > 3 && (
                      <span className="text-[10px] text-amber-600 font-bold block">+{group.members.length - 3} more alumni</span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectCompany(group.companyName);
                  setActiveTab('directory');
                }}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-bold transition-all flex items-center justify-center space-x-1.5"
              >
                <span>View Alumni at {group.companyName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Companies List View */
        <div className="space-y-3">
          {filteredCompanies.map((group) => (
            <div
              key={group.companyName}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm hover:shadow-md hover:border-amber-400 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              {/* Left Side: Details */}
              <div className="flex items-start sm:items-center gap-4 flex-1">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center font-extrabold text-lg shrink-0">
                  <Building2 className="w-6 h-6" />
                </div>

                <div className="space-y-1 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-base">{group.companyName}</h3>
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-extrabold">
                      {group.count} Alumni {group.count === 1 ? 'Member' : 'Members'}
                    </span>
                  </div>

                  {group.locations.length > 0 && (
                    <p className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{group.locations.join(', ')}</span>
                    </p>
                  )}

                  <div className="text-xs text-slate-600 pt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Reps:</span>
                    {group.members.slice(0, 3).map(m => (
                      <span key={m.id} className="font-medium text-slate-700">
                        {m.name} <span className="text-slate-400 font-normal">({m.designation})</span>
                      </span>
                    ))}
                    {group.members.length > 3 && (
                      <span className="text-amber-600 font-bold text-[10px]">+{group.members.length - 3} more</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Side: Action Button */}
              <button
                onClick={() => {
                  onSelectCompany(group.companyName);
                  setActiveTab('directory');
                }}
                className="sm:w-auto w-full px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-bold transition-all flex items-center justify-center space-x-1.5 shrink-0"
              >
                <span>View Alumni</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};