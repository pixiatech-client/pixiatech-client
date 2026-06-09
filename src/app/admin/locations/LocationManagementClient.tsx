"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import {
  Calendar, Search, Filter, ArrowUpDown, ChevronRight, 
  MoreVertical, Edit2, Trash2, Clock, CheckCircle2, 
  Truck, Archive, User, Package, FileText, LayoutGrid, 
  ArrowLeft, Check
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Pagination } from '@/components/ui/Pagination';
import { CustomSelect } from '@/components/ui/custom-select';
import useEmblaCarousel from 'embla-carousel-react';
import { useFirestore } from '@/firebase';
import { 
  collection, query, where, orderBy, onSnapshot, doc, updateDoc, deleteDoc 
} from 'firebase/firestore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// --- Types ---
type LocationStatus = 'pending' | 'processed' | 'sent' | 'archived' | 'all';

// --- Mobile Location Card Component ---
const MobileLocationCard = React.memo(({ 
  location, 
  isActive, 
  onClick 
}: any) => {
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
    processed: { label: 'Approved', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: CheckCircle2 },
    sent: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: Truck },
    archived: { label: 'Archived', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: Archive },
  };

  const status = (location.status as keyof typeof statusConfig) || 'pending';
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <motion.div
      onClick={() => onClick(location)}
      animate={{
        scale: isActive ? 1 : 0.95,
        opacity: isActive ? 1 : 0.7
      }}
      className="w-full bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-4"
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contrat #{location.number || location.id.slice(0, 8)}</p>
          <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter leading-none">
            {location.client?.companyName || location.client?.name || 'Unknown Client'}
          </h3>
        </div>
        <div className={cn("px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border", config.color)}>
          <config.icon className="w-3 h-3" />
          {config.label}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Start date</p>
          <p className="text-sm font-bold text-slate-900">
            {location.createdAt ? format(location.createdAt.toDate ? location.createdAt.toDate() : new Date(location.createdAt), 'dd MMMM yyyy', { locale: fr }) : '—'}
          </p>
        </div>
        <div className="bg-slate-50 p-4 rounded-2xl">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Amount</p>
          <p className="text-sm font-bold text-blue-600">
            {location.totalAmount?.toLocaleString('fr-FR')} €
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
          <Package className="w-4 h-4" />
        </div>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          {location.products?.length || 0} rental products
        </p>
        <ChevronRight className="w-4 h-4 text-slate-300 ml-auto" />
      </div>
    </motion.div>
  );
});

// --- Location List Item Component ---
const LocationListItem = ({ location, onClick }: any) => {
  const statusConfig = {
    pending: { label: 'Pending', color: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
    processed: { label: 'Approved', color: 'bg-blue-50 text-blue-600 border-blue-100', icon: CheckCircle2 },
    sent: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Truck },
    delivered: { label: 'Delivered', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: Truck },
    archived: { label: 'Archived', color: 'bg-slate-50 text-slate-600 border-slate-100', icon: Archive },
  };

  const status = (location.status as keyof typeof statusConfig) || 'pending';
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick(location)}
      className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-black transition-all group cursor-pointer flex items-center gap-6"
    >
      <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-black group-hover:text-white transition-all">
        <Calendar className="w-6 h-6" />
      </div>

      <div className="flex-1 grid grid-cols-4 gap-4 items-center">
        <div className="col-span-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Client</p>
          <h4 className="font-black text-slate-900 uppercase tracking-tighter truncate">
            {location.client?.companyName || location.client?.name || 'Unknown Client'}
          </h4>
        </div>

        <div className="col-span-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Status</p>
          <div className={cn("inline-flex items-center gap-2 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border", config.color)}>
            <config.icon className="w-3 h-3" />
            {config.label}
          </div>
        </div>

        <div className="col-span-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Date</p>
          <p className="text-xs font-bold text-slate-600 uppercase">
            {location.createdAt ? format(location.createdAt.toDate ? location.createdAt.toDate() : new Date(location.createdAt), 'dd/MM/yyyy') : '—'}
          </p>
        </div>

        <div className="col-span-1 text-right">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Total</p>
          <p className="text-sm font-black text-blue-600">
            {location.totalAmount?.toLocaleString('fr-FR')} €
          </p>
        </div>
      </div>

      <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 opacity-0 group-hover:opacity-100 transition-all">
        <ChevronRight className="w-4 h-4" />
      </div>
    </motion.div>
  );
};

// --- Main Component ---
const GestionLocations = () => {
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<LocationStatus>('all');
  const [sortBy, setSortBy] = useState('date');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  const { toast } = useToast();
  const [activeIndex, setActiveIndex] = useState(0);
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: 'center' });
  const db = useFirestore();

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setActiveIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    emblaApi.on('reInit', onSelect);
    return () => {
      emblaApi.off('select', onSelect);
      emblaApi.off('reInit', onSelect);
    };
  }, [emblaApi]);

  useEffect(() => {
    if (!db) return;
    const q = query(
      collection(db, 'quotes'),
      where('transactionType', '==', 'rental'),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setLocations(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [db]);

  const filteredLocations = useMemo(() => {
    return locations.filter(loc => {
      const matchesSearch = 
        (loc.client?.companyName?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.number?.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (loc.id.toLowerCase().includes(searchQuery.toLowerCase()));
      
      const matchesStatus = filterStatus === 'all' || 
        (filterStatus === 'sent' ? (loc.status === 'sent' || loc.status === 'delivered') : loc.status === filterStatus);

      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'date') return (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0);
      if (sortBy === 'amount') return (b.totalAmount || 0) - (a.totalAmount || 0);
      if (sortBy === 'client') return (a.client?.companyName || '').localeCompare(b.client?.companyName || '');
      return 0;
    });
  }, [locations, searchQuery, filterStatus, sortBy]);

  const totalPages = Math.ceil(filteredLocations.length / itemsPerPage);
  const paginatedLocations = filteredLocations.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleLocationClick = (location: any) => {
    window.location.href = `/admin/quote-requests?id=${location.id}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Search & Filters Bar (Desktop) */}
      <div className="hidden md:flex bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex-row gap-4 items-center justify-between">
        <div className="flex items-center gap-4 w-auto">
          <div className="relative w-80">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search for a rental..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 h-10 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black transition-all"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 w-auto">
          <div className="relative">
            <CustomSelect
              options={[
                { value: 'all', label: 'All', icon: LayoutGrid },
                { value: 'pending', label: 'Pending', icon: Clock },
                { value: 'processed', label: 'Approved', icon: CheckCircle2 },
                { value: 'sent', label: 'Delivered', icon: Truck },
                { value: 'archived', label: 'Archived', icon: Archive },
              ]}
              value={filterStatus}
              onChange={(val) => setFilterStatus(val as any)}
              placeholder="Filter by status"
              className="w-56"
            />
          </div>

          <CustomSelect
            options={[
                { value: 'date', label: 'By Date' },
                { value: 'amount', label: 'By Amount' },
                { value: 'client', label: 'By Client' },
            ]}
            value={sortBy}
            onChange={setSortBy}
            placeholder="Sort by"
            className="w-40"
          />
        </div>
      </div>

      {/* List Container (Desktop) */}
      <div className="hidden md:block space-y-4">
        <AnimatePresence mode="popLayout">
          {paginatedLocations.map((location) => (
            <LocationListItem 
              key={location.id} 
              location={location} 
              onClick={handleLocationClick} 
            />
          ))}
        </AnimatePresence>

        {filteredLocations.length === 0 && (
          <div className="bg-white rounded-[32px] border border-slate-200 border-dashed p-12 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">No rentals found</h3>
            <p className="text-slate-500 font-medium">Modify your filters or start a new search</p>
          </div>
        )}
      </div>

      {/* Mobile View */}
      <div className="md:hidden -mx-4 relative overflow-hidden px-4">
        {/* Filters Horizontal Scroll for Mobile (as requested "same as categories Produits") */}
        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide mb-4 no-scrollbar">
          {[
            { id: 'all', label: 'All', icon: LayoutGrid },
            { id: 'pending', label: 'Pending', icon: Clock },
            { id: 'processed', label: 'Approved', icon: CheckCircle2 },
            { id: 'sent', label: 'Delivered', icon: Truck },
            { id: 'archived', label: 'Archived', icon: Archive },
          ].map((opt) => (
            <button
              key={opt.id}
              onClick={() => setFilterStatus(opt.id as any)}
              className={cn(
                "flex items-center gap-2 px-6 py-3 rounded-full text-xs font-black uppercase tracking-widest whitespace-nowrap transition-all border",
                filterStatus === opt.id 
                  ? "bg-black text-white border-black shadow-lg" 
                  : "bg-white text-slate-500 border-slate-100"
              )}
            >
              <opt.icon className="w-4 h-4" />
              {opt.label}
            </button>
          ))}
        </div>

        <div className="overflow-hidden pb-32" ref={emblaRef}>
          <div className="flex">
            {paginatedLocations.map((location, index) => (
              <div key={location.id} className="flex-[0_0_96%] min-w-0 pl-4 first:pl-0">
                <MobileLocationCard
                  location={location}
                  isActive={activeIndex === index}
                  onClick={handleLocationClick}
                />
              </div>
            ))}
          </div>
        </div>

        {filteredLocations.length === 0 && (
          <div className="py-20 text-center">
            <Calendar className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest">No rentals</p>
          </div>
        )}
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredLocations.length}
        itemsPerPage={itemsPerPage}
      />
    </div>
  );
};

export default function LocationManagementClient() {
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      filter: 'blur(10px)',
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      filter: 'blur(0px)',
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      filter: 'blur(10px)',
    }),
  };

  return (
    <div className="min-h-screen bg-transparent font-sans text-slate-900">
      <main className="min-h-screen transition-all duration-300">
        <div className="max-w-[1400px] mx-auto p-0 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="relative flex bg-slate-100/80 p-1 rounded-2xl border border-slate-200 w-full md:w-auto overflow-hidden shadow-sm">
              <button className="relative flex items-center justify-center gap-3 px-6 h-10 text-xs font-bold transition-all z-20 uppercase tracking-widest text-theme-sidebar-active-text">
                <motion.span
                  layoutId="nav-bubble"
                  className="absolute inset-0 z-10 bg-theme-sidebar-active-bg rounded-xl shadow-lg border border-theme-sidebar-active-bg"
                  transition={{ type: "spring", bounce: 0.15, duration: 0.5 }}
                />
                <Calendar className="w-4 h-4 z-20 text-theme-sidebar-active-text" />
                <span className="z-20">Location Management</span>
              </button>
            </div>
          </div>

          <motion.div
            initial="enter"
            animate="center"
            variants={slideVariants}
            transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
            className="w-full"
          >
            <GestionLocations />
          </motion.div>
          
          <p className="text-center mt-8 text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] opacity-40">
            Aura Admin v3.2 • Pixiatech Ecosystem
          </p>
        </div>
      </main>
    </div>
  );
}
