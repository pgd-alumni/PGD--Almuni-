import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink, 
  MapPin, 
  Users, 
  Mail, 
  Phone, 
  CheckCircle2, 
  AlertCircle, 
  Globe, 
  LayoutGrid, 
  List, 
  RefreshCw, 
  Sparkles, 
  Briefcase, 
  ShieldCheck,
  X,
  UserCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import { PartnerCompany, AlumniRecord } from '../types';

interface AdminCompaniesModuleProps {
  alumniList?: AlumniRecord[];
  role: 'super' | 'admin' | null;
  onSelectCompany?: (company: string) => void;
}

const SECTOR_OPTIONS = [
  'Garments & RMG',
  'Textile Spinning & Weaving',
  'Buying House & Sourcing',
  'Dyeing & Finishing',
  'Brand Liaison Office',
  'Apparel Accessories & Trims',
  'Testing & Compliance',
  'IT & Textile Automation',
  'Chemical & Auxiliaries',
  'Other Industrial Sector'
];

const PARTNERSHIP_OPTIONS = [
  'Corporate Partner',
  'Recruiting Partner',
  'MoU Signed',
  'Alumni Employer',
  'Industry Sponsor'
];

const EMPLOYEE_RANGES = [
  '100-500 Employees',
  '500-1,000 Employees',
  '1,000-5,000 Employees',
  '5,000-10,000 Employees',
  '10,000+ Employees',
  '50,000+ Employees'
];

export const AdminCompaniesModule: React.FC<AdminCompaniesModuleProps> = ({
  alumniList = [],
  role,
  onSelectCompany
}) => {
  const [companies, setCompanies] = useState<PartnerCompany[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [partnershipFilter, setPartnershipFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingCompany, setEditingCompany] = useState<PartnerCompany | null>(null);
  const [deletingCompany, setDeletingCompany] = useState<PartnerCompany | null>(null);
  const [viewingAlumniCompany, setViewingAlumniCompany] = useState<PartnerCompany | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form input fields
  const [formName, setFormName] = useState('');
  const [formSector, setFormSector] = useState(SECTOR_OPTIONS[0]);
  const [formLocation, setFormLocation] = useState('Dhaka, Bangladesh');
  const [formHeadOffice, setFormHeadOffice] = useState('');
  const [formWebsite, setFormWebsite] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formContactPerson, setFormContactPerson] = useState('');
  const [formContactDesignation, setFormContactDesignation] = useState('');
  const [formContactEmail, setFormContactEmail] = useState('');
  const [formContactPhone, setFormContactPhone] = useState('');
  const [formPartnershipType, setFormPartnershipType] = useState(PARTNERSHIP_OPTIONS[0]);
  const [formDescription, setFormDescription] = useState('');
  const [formEmployeeRange, setFormEmployeeRange] = useState(EMPLOYEE_RANGES[2]);

  // Show Toast
  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Fetch companies from server
  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/companies');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setCompanies(data.data);
      }
    } catch (err) {
      console.error("Failed to load companies:", err);
      showToast("Error loading partner companies list", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  // Map alumni to companies
  const companyAlumniMap = useMemo(() => {
    const map = new Map<string, AlumniRecord[]>();
    alumniList.forEach(alumni => {
      const comp = (alumni.company || '').trim().toLowerCase();
      if (!comp) return;
      if (!map.has(comp)) {
        map.set(comp, []);
      }
      map.get(comp)!.push(alumni);
    });
    return map;
  }, [alumniList]);

  // Get matching alumni for a company
  const getConnectedAlumni = (companyName: string): AlumniRecord[] => {
    const compLower = companyName.toLowerCase().trim();
    if (companyAlumniMap.has(compLower)) {
      return companyAlumniMap.get(compLower)!;
    }
    // Partial search match
    const matches: AlumniRecord[] = [];
    const seenIds = new Set<string>();
    for (const [name, members] of companyAlumniMap.entries()) {
      if (name.includes(compLower) || compLower.includes(name)) {
        members.forEach(m => {
          if (!seenIds.has(m.id)) {
            seenIds.add(m.id);
            matches.push(m);
          }
        });
      }
    }
    return matches;
  };

  // Open Create Modal
  const handleOpenAddModal = () => {
    setEditingCompany(null);
    setFormName('');
    setFormSector(SECTOR_OPTIONS[0]);
    setFormLocation('Dhaka, Bangladesh');
    setFormHeadOffice('');
    setFormWebsite('');
    setFormLogoUrl('');
    setFormContactPerson('');
    setFormContactDesignation('');
    setFormContactEmail('');
    setFormContactPhone('');
    setFormPartnershipType(PARTNERSHIP_OPTIONS[0]);
    setFormDescription('');
    setFormEmployeeRange(EMPLOYEE_RANGES[2]);
    setIsFormModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEditModal = (comp: PartnerCompany) => {
    setEditingCompany(comp);
    setFormName(comp.name || '');
    setFormSector(comp.sector || SECTOR_OPTIONS[0]);
    setFormLocation(comp.location || 'Dhaka, Bangladesh');
    setFormHeadOffice(comp.headOffice || '');
    setFormWebsite(comp.website || '');
    setFormLogoUrl(comp.logoUrl || '');
    setFormContactPerson(comp.contactPerson || '');
    setFormContactDesignation(comp.contactDesignation || '');
    setFormContactEmail(comp.contactEmail || '');
    setFormContactPhone(comp.contactPhone || '');
    setFormPartnershipType(comp.partnershipType || PARTNERSHIP_OPTIONS[0]);
    setFormDescription(comp.description || '');
    setFormEmployeeRange(comp.employeeCountRange || EMPLOYEE_RANGES[2]);
    setIsFormModalOpen(true);
  };

  // Handle Form Submit (Create or Update)
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      showToast("Please enter a valid Company Name", "error");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      name: formName.trim(),
      sector: formSector,
      location: formLocation.trim(),
      headOffice: formHeadOffice.trim(),
      website: formWebsite.trim(),
      logoUrl: formLogoUrl.trim() || 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=300&q=80',
      contactPerson: formContactPerson.trim(),
      contactDesignation: formContactDesignation.trim(),
      contactEmail: formContactEmail.trim(),
      contactPhone: formContactPhone.trim(),
      partnershipType: formPartnershipType,
      description: formDescription.trim(),
      employeeCountRange: formEmployeeRange
    };

    try {
      if (editingCompany) {
        // PUT update
        const res = await fetch(`/api/admin/companies/${encodeURIComponent(editingCompany.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Company "${payload.name}" updated successfully!`);
          setIsFormModalOpen(false);
          fetchCompanies();
        } else {
          showToast(data.message || "Failed to update company", "error");
        }
      } else {
        // POST create
        const res = await fetch('/api/admin/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          showToast(`Company "${payload.name}" added successfully!`);
          setIsFormModalOpen(false);
          fetchCompanies();
        } else {
          showToast(data.message || "Failed to add company", "error");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("Server error during company save", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deletingCompany) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/admin/companies/${encodeURIComponent(deletingCompany.id)}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Company "${deletingCompany.name}" deleted successfully!`);
        setDeletingCompany(null);
        fetchCompanies();
      } else {
        showToast(data.message || "Failed to delete company", "error");
      }
    } catch (err) {
      showToast("Server error deleting company", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered companies
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const matchesSearch = 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.location && c.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.contactPerson && c.contactPerson.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (c.sector && c.sector.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesSector = sectorFilter === 'all' || c.sector === sectorFilter;
      const matchesPartnership = partnershipFilter === 'all' || c.partnershipType === partnershipFilter;

      return matchesSearch && matchesSector && matchesPartnership;
    });
  }, [companies, searchQuery, sectorFilter, partnershipFilter]);

  // Sector color helper
  const getPartnershipBadge = (type?: string) => {
    switch (type) {
      case 'Corporate Partner':
        return 'bg-emerald-100 text-emerald-900 border-emerald-300';
      case 'Recruiting Partner':
        return 'bg-blue-100 text-blue-900 border-blue-300';
      case 'MoU Signed':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Industry Sponsor':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div 
          className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3 text-sm font-bold animate-fadeIn transition-all ${
            toastMessage.type === 'success' ? 'bg-slate-900 text-emerald-400 border border-emerald-500/30' : 'bg-red-900 text-red-200 border border-red-500/30'
          }`}
        >
          {toastMessage.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <AlertCircle className="w-5 h-5 text-red-400" />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Main Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-[#002147] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/80 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-12 -translate-y-8 opacity-10 pointer-events-none">
          <Building2 className="w-72 h-72 text-amber-400" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold border border-amber-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Admin & Coding Admin Corporate Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
              <span>Partner & Employer Companies</span>
              <span className="text-sm font-extrabold bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
                {companies.length}
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Maintain and organize industrial partners, RMG manufacturing conglomerates, textile spinning mills, buying houses, and brand liaison offices employing BUTEX PGD graduates.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchCompanies}
              disabled={isLoading}
              className="px-4 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-600 transition-all flex items-center gap-2 shadow-sm"
              title="Refresh company data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-400' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={handleOpenAddModal}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold rounded-xl transition-all shadow-lg hover:shadow-amber-500/20 flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Add New Company</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Summary Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-slate-700/60 text-xs">
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <span className="text-slate-400 text-[11px] block">Total Registered</span>
            <span className="text-lg font-black text-amber-400">{companies.length} Companies</span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <span className="text-slate-400 text-[11px] block">MoU / Corporate Partners</span>
            <span className="text-lg font-black text-emerald-400">
              {companies.filter(c => c.partnershipType === 'Corporate Partner' || c.partnershipType === 'MoU Signed').length} Active
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <span className="text-slate-400 text-[11px] block">RMG & Spinning</span>
            <span className="text-lg font-black text-blue-400">
              {companies.filter(c => c.sector?.includes('Garments') || c.sector?.includes('Spinning')).length} Facilities
            </span>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
            <span className="text-slate-400 text-[11px] block">Connected Alumni</span>
            <span className="text-lg font-black text-purple-400">{alumniList.length}+ Alumni</span>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Filters, & View Toggle */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Field */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search companies by name, location, contact person or sector..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters & View Modes */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Sector Filter */}
            <select
              value={sectorFilter}
              onChange={(e) => setSectorFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Sectors ({companies.length})</option>
              {SECTOR_OPTIONS.map(sec => (
                <option key={sec} value={sec}>{sec}</option>
              ))}
            </select>

            {/* Partnership Filter */}
            <select
              value={partnershipFilter}
              onChange={(e) => setPartnershipFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Partnerships</option>
              {PARTNERSHIP_OPTIONS.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>

            {/* View Mode Buttons (Grid vs List) */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'grid'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  viewMode === 'list'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="List View"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">List</span>
              </button>
            </div>
          </div>
        </div>

        {/* Status Count Indicator */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <span>
            Showing <strong className="text-slate-800">{filteredCompanies.length}</strong> of <strong className="text-slate-800">{companies.length}</strong> companies
          </span>
          {(searchQuery || sectorFilter !== 'all' || partnershipFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSectorFilter('all');
                setPartnershipFilter('all');
              }}
              className="text-amber-600 hover:text-amber-700 font-bold hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Main Companies Content View */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-white rounded-3xl border border-slate-200 shadow-sm">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-600">Loading partner company records...</p>
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <Building2 className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-900">No partner companies matched</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              No company found with your selected search keyword or sector filter.
            </p>
          </div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-slate-900 text-amber-400 font-bold text-xs rounded-xl hover:bg-amber-500 hover:text-slate-950 transition-all inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Company Now</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompanies.map(comp => {
            const connectedAlumni = getConnectedAlumni(comp.name);
            const initial = comp.name.charAt(0).toUpperCase();

            return (
              <div
                key={comp.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-amber-400 shadow-sm hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden group"
              >
                {/* Card Top Header */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {comp.logoUrl ? (
                        <img 
                          src={comp.logoUrl} 
                          alt={comp.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-black text-lg flex items-center justify-center shrink-0">
                          {initial}
                        </div>
                      )}

                      <div className="space-y-0.5">
                        <h3 className="font-extrabold text-slate-900 text-base leading-snug group-hover:text-amber-600 transition-colors">
                          {comp.name}
                        </h3>
                        <span className="inline-block text-[11px] font-semibold text-slate-500">
                          {comp.sector}
                        </span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${getPartnershipBadge(comp.partnershipType)}`}>
                      {comp.partnershipType || 'Partner'}
                    </span>
                  </div>

                  {/* Location & Employee count */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-600 pt-1">
                    {comp.location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{comp.location}</span>
                      </span>
                    )}
                    {comp.employeeCountRange && (
                      <span className="flex items-center gap-1 text-slate-400">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{comp.employeeCountRange}</span>
                      </span>
                    )}
                  </div>

                  {/* Description / Summary if present */}
                  {comp.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed bg-slate-50/70 p-2.5 rounded-xl border border-slate-100">
                      {comp.description}
                    </p>
                  )}

                  {/* Contact Representative */}
                  {(comp.contactPerson || comp.contactEmail) && (
                    <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                        Company Liaison
                      </span>
                      {comp.contactPerson && (
                        <p className="font-bold text-slate-800 flex items-center justify-between">
                          <span>{comp.contactPerson}</span>
                          {comp.contactDesignation && (
                            <span className="text-[11px] font-normal text-slate-500">{comp.contactDesignation}</span>
                          )}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 pt-0.5 text-[11px] text-slate-500">
                        {comp.contactEmail && (
                          <a href={`mailto:${comp.contactEmail}`} className="flex items-center gap-1 hover:text-amber-600 transition-colors">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{comp.contactEmail}</span>
                          </a>
                        )}
                        {comp.contactPhone && (
                          <a href={`tel:${comp.contactPhone}`} className="flex items-center gap-1 hover:text-amber-600 transition-colors">
                            <Phone className="w-3 h-3 text-slate-400" />
                            <span>{comp.contactPhone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Connected Alumni Badge */}
                  <div 
                    onClick={() => setViewingAlumniCompany(comp)}
                    className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 hover:bg-amber-100/90 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">
                        <Users className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold text-amber-950">
                        {connectedAlumni.length} BUTEX Alumni Connected
                      </span>
                    </div>
                    <span className="text-amber-700 font-bold text-[11px] hover:underline flex items-center gap-1">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>

                {/* Card Bottom Controls */}
                <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {comp.website && (
                      <a
                        href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold transition-all flex items-center gap-1"
                        title="Open official website"
                      >
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        <span className="hidden sm:inline">Website</span>
                        <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEditModal(comp)}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors flex items-center gap-1"
                      title="Edit company profile"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>

                    <button
                      onClick={() => setDeletingCompany(comp)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition-colors"
                      title="Delete company"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST VIEW */
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-900 text-white font-extrabold uppercase text-[11px] tracking-wider">
                  <th className="py-3.5 px-4">Company & Sector</th>
                  <th className="py-3.5 px-4">Partnership Status</th>
                  <th className="py-3.5 px-4">Location / Head Office</th>
                  <th className="py-3.5 px-4">Contact Liaison</th>
                  <th className="py-3.5 px-4">Alumni Employed</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCompanies.map((comp, idx) => {
                  const connectedAlumni = getConnectedAlumni(comp.name);
                  const initial = comp.name.charAt(0).toUpperCase();

                  return (
                    <tr 
                      key={comp.id} 
                      className={`hover:bg-amber-50/40 transition-colors ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}
                    >
                      {/* Company name & Sector */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {comp.logoUrl ? (
                            <img 
                              src={comp.logoUrl} 
                              alt={comp.name} 
                              className="w-10 h-10 rounded-xl object-cover border border-slate-200 bg-slate-50 shrink-0"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                              {initial}
                            </div>
                          )}

                          <div>
                            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                              <span>{comp.name}</span>
                              {comp.website && (
                                <a 
                                  href={comp.website.startsWith('http') ? comp.website : `https://${comp.website}`} 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="text-slate-400 hover:text-amber-600"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {comp.sector} • {comp.employeeCountRange || 'Corporate'}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Partnership Status */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${getPartnershipBadge(comp.partnershipType)}`}>
                          {comp.partnershipType || 'Partner'}
                        </span>
                      </td>

                      {/* Location */}
                      <td className="py-3.5 px-4 text-slate-600">
                        <div className="flex items-center gap-1 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[180px]">{comp.location || comp.headOffice || 'Dhaka, Bangladesh'}</span>
                        </div>
                      </td>

                      {/* Contact Liaison */}
                      <td className="py-3.5 px-4">
                        {comp.contactPerson ? (
                          <div>
                            <div className="font-bold text-slate-900">{comp.contactPerson}</div>
                            <div className="text-[11px] text-slate-500 flex items-center gap-2">
                              {comp.contactEmail && <span>{comp.contactEmail}</span>}
                              {comp.contactPhone && <span>• {comp.contactPhone}</span>}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 italic">Not assigned</span>
                        )}
                      </td>

                      {/* Alumni Employed */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => setViewingAlumniCompany(comp)}
                          className="px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-950 rounded-lg text-xs font-extrabold transition-colors flex items-center gap-1.5"
                        >
                          <Users className="w-3.5 h-3.5 text-amber-700" />
                          <span>{connectedAlumni.length} Alumni</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEditModal(comp)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingCompany(comp)}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ADD / EDIT COMPANY MODAL */}
      {/* ========================================================================= */}
      {isFormModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    {editingCompany ? 'Edit Partner Company Profile' : 'Add New Partner & Employer Company'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Registered companies are indexed for both Admin review and the Public Alumni Business Directory.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsFormModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="space-y-4">
              {/* Row 1: Name & Sector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Company Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Epic Group, DBL Group, Decathlon"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Sector / Industry Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formSector}
                    onChange={(e) => setFormSector(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white font-semibold text-slate-900"
                  >
                    {SECTOR_OPTIONS.map(sec => (
                      <option key={sec} value={sec}>{sec}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Partnership Type & Employee Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Partnership / MoU Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formPartnershipType}
                    onChange={(e) => setFormPartnershipType(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white font-semibold text-slate-900"
                  >
                    {PARTNERSHIP_OPTIONS.map(opt => (
                      <option key={opt} value={opt}>{opt}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Workforce / Employee Range
                  </label>
                  <select
                    value={formEmployeeRange}
                    onChange={(e) => setFormEmployeeRange(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white font-semibold text-slate-900"
                  >
                    {EMPLOYEE_RANGES.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 3: Location & Head Office */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Primary Operational City / Region
                  </label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="e.g. Gazipur, Savar, Tejgaon, Dhaka"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Head Office Full Address
                  </label>
                  <input
                    type="text"
                    value={formHeadOffice}
                    onChange={(e) => setFormHeadOffice(e.target.value)}
                    placeholder="e.g. Plot 12, Gulshan Avenue, Dhaka"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 4: Website & Logo URL */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Official Website URL
                  </label>
                  <input
                    type="text"
                    value={formWebsite}
                    onChange={(e) => setFormWebsite(e.target.value)}
                    placeholder="https://company.com"
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white font-semibold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Logo Image URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={formLogoUrl}
                    onChange={(e) => setFormLogoUrl(e.target.value)}
                    placeholder="https://images.unsplash.com/..."
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white font-semibold text-slate-900"
                  />
                </div>
              </div>

              {/* Row 5: Contact Person Details */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-amber-600" />
                  <span>Key Representative / HR Contact Person</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={formContactPerson}
                      onChange={(e) => setFormContactPerson(e.target.value)}
                      placeholder="e.g. Engr. Tanvir Ahmed"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Designation</label>
                    <input
                      type="text"
                      value={formContactDesignation}
                      onChange={(e) => setFormContactDesignation(e.target.value)}
                      placeholder="e.g. General Manager / HR Head"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Official Email</label>
                    <input
                      type="email"
                      value={formContactEmail}
                      onChange={(e) => setFormContactEmail(e.target.value)}
                      placeholder="hr@company.com"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Phone / WhatsApp</label>
                    <input
                      type="text"
                      value={formContactPhone}
                      onChange={(e) => setFormContactPhone(e.target.value)}
                      placeholder="+8801711000000"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>

              {/* Row 6: Description */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Company Overview & Partnership Summary
                </label>
                <textarea
                  rows={3}
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  placeholder="Provide background on manufacturing specialities, major buyers, or historical BUTEX collaboration..."
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:bg-white font-medium text-slate-900"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-amber-400 text-xs font-extrabold transition-all shadow-md flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>{editingCompany ? 'Save Changes' : 'Publish Partner Company'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================================= */}
      {deletingCompany && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-slate-900">Delete Partner Company</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to delete <strong className="text-slate-900">{deletingCompany.name}</strong> from the corporate registry?
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingCompany(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold transition-colors shadow-md flex items-center gap-1.5"
              >
                {isSubmitting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* CONNECTED ALUMNI INSPECTION DRAWER/MODAL */}
      {/* ========================================================================= */}
      {viewingAlumniCompany && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 max-w-3xl w-full p-6 sm:p-8 shadow-2xl space-y-6 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-black text-lg">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Alumni at {viewingAlumniCompany.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Verified BUTEX Post Graduate Diploma alumni registered with this employer affiliation.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingAlumniCompany(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* List of alumni */}
            {(() => {
              const list = getConnectedAlumni(viewingAlumniCompany.name);
              if (list.length === 0) {
                return (
                  <div className="py-12 text-center space-y-2 bg-slate-50 rounded-2xl border border-slate-200">
                    <Users className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="text-xs font-bold text-slate-600">No alumni currently matched with this exact name.</p>
                    <p className="text-[11px] text-slate-400">Alumni who input "{viewingAlumniCompany.name}" during onboarding will appear here automatically.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {list.map(member => (
                    <div 
                      key={member.id}
                      className="p-4 rounded-2xl bg-slate-50 hover:bg-amber-50/60 border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3.5">
                        {member.photoUrl ? (
                          <img 
                            src={member.photoUrl} 
                            alt={member.name} 
                            className="w-12 h-12 rounded-xl object-cover border border-slate-300 shrink-0"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-400 font-black text-sm flex items-center justify-center shrink-0">
                            {member.name.charAt(0)}
                          </div>
                        )}

                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">{member.name}</h4>
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold flex items-center gap-0.5">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>Verified</span>
                            </span>
                          </div>
                          <p className="text-xs font-bold text-amber-700">{member.designation || 'Alumni Member'}</p>
                          <p className="text-[11px] text-slate-500 font-medium">{member.rollNo} • {member.batch || 'PGD Alumni'}</p>
                        </div>
                      </div>

                      <div className="flex sm:flex-col items-end justify-between sm:justify-center text-xs text-slate-600 space-y-1">
                        {member.email && (
                          <a href={`mailto:${member.email}`} className="text-slate-600 hover:text-amber-600 flex items-center gap-1 font-medium">
                            <Mail className="w-3.5 h-3.5 text-slate-400" />
                            <span>{member.email}</span>
                          </a>
                        )}
                        {member.phone && (
                          <a href={`tel:${member.phone}`} className="text-slate-600 hover:text-amber-600 flex items-center gap-1 font-medium">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{member.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}

            <div className="flex items-center justify-between pt-4 border-t border-slate-100">
              <span className="text-xs text-slate-500 font-medium">
                Alumni profiles synchronized with official Google Sheet database.
              </span>
              <button
                type="button"
                onClick={() => setViewingAlumniCompany(null)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white hover:bg-amber-500 hover:text-slate-950 font-bold text-xs transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
