'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Search, CarFront, ChevronDown } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

export default function PublicCarsList() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States untuk Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

  // State untuk Pagination / Load More
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

  useEffect(() => {
    async function fetchPublicCars() {
      // Mengambil data mobil dari Supabase (hanya field yang dibutuhkan untuk list)
      const { data, error } = await supabase
        .from('cars')
        .select(
          `
          id, 
          name, 
          brand, 
          class, 
          image_url, 
          country,
          uri,
          car_liveries ( id )
        `,
        )
        .order('name', { ascending: true });

      if (!error && data) {
        setCars(data);
      }
      setLoading(false);
    }

    fetchPublicCars();
  }, []);

  // Reset visible count setiap kali user melakukan pencarian atau ganti filter
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedClass]);

  // Mendapatkan daftar class unik untuk dropdown filter
  const availableClasses = useMemo(() => {
    const classes = cars.map((car) => car.class).filter(Boolean); // Filter yang tidak null/undefined
    return ['ALL', ...Array.from(new Set(classes))];
  }, [cars]);

  // Logika Filter Data
  const filteredCars = useMemo(() => {
    return cars.filter((car) => {
      const matchSearch =
        car.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (car.brand &&
          car.brand.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchClass = selectedClass === 'ALL' || car.class === selectedClass;

      return matchSearch && matchClass;
    });
  }, [cars, searchQuery, selectedClass]);

  // Data yang benar-benar di-render ke layar saat ini
  const carsToShow = filteredCars.slice(0, visibleCount);

  // Handler untuk tombol Load More
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[var(--accent)] font-bold italic tracking-widest uppercase">
          Loading Showroom...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-4 md:p-8 transition-colors duration-300">
      <div className="max-w-7xl mx-auto pt-16">
        {/* HEADER & SEARCH SECTION */}
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6 relative">
          {/* Efek Glow di Header */}
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-[var(--accent-glow)] blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-2">
              Vehicle{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[var(--accent)]">
                Roster
              </span>
            </h1>
            <p className="text-[var(--muted)] text-sm font-bold tracking-widest uppercase">
              Available Fleet for Nismara Racing
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            {/* Search Input */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Search car or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 p-3 pl-10 rounded-xl bg-[var(--card)] border border-[var(--card-border)] focus:border-[var(--accent)] outline-none transition-all shadow-inner text-sm text-[var(--foreground)]"
              />
              <Search
                className="absolute left-3 top-3.5 text-[var(--muted)] group-focus-within:text-[var(--accent)] transition-colors"
                size={18}
              />
            </div>

            {/* Filter Dropdown */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full md:w-48 p-3 rounded-xl bg-[var(--card)] border border-[var(--card-border)] focus:border-[var(--accent)] outline-none transition-all shadow-inner text-sm text-[var(--foreground)] font-bold uppercase cursor-pointer appearance-none"
            >
              {availableClasses.map((cls) => (
                <option key={cls} value={cls}>
                  {cls}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* CARS GRID */}
        {filteredCars.length === 0 ? (
          <div className="text-center py-20 bg-[var(--card)] rounded-3xl border border-[var(--card-border)] border-dashed">
            <CarFront
              className="mx-auto text-[var(--muted)] mb-4 opacity-50"
              size={48}
            />
            <p className="text-[var(--muted)] text-lg italic font-bold">
              No vehicles match your criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClass('ALL');
              }}
              className="mt-4 text-[var(--accent)] hover:opacity-80 text-sm font-bold uppercase tracking-widest underline transition-opacity"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {carsToShow.map((car) => (
                <Link
                  href={`/cars/${car.uri}`}
                  key={car.id}
                  className="group block"
                >
                  <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden hover:border-[var(--accent)] transition-all duration-300 shadow-sm hover:shadow-[0_0_30px_var(--accent-glow)] flex flex-col h-full transform hover:-translate-y-1">
                    {/* Image Section */}
                    <div className="relative aspect-video bg-[var(--background)] overflow-hidden">
                      {car.image_url ? (
                        <img
                          src={car.image_url}
                          alt={car.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--muted)] font-black italic text-xs">
                          NO PREVIEW
                        </div>
                      )}

                      {/* Gradient Overlay for bottom text readability */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent"></div>

                      {/* Floating Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                        {car.class && (
                          <span className="text-[9px] bg-[var(--accent)] text-white px-2 py-1 rounded-md uppercase font-black tracking-widest shadow-lg">
                            {car.class}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="p-5 flex flex-col flex-grow relative">
                      <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest mb-1">
                        <span className="text-blue-500">
                          {car.brand || 'CUSTOM'}
                        </span>
                        {car.country ? ` • ${car.country}` : ''}
                      </p>
                      <h3 className="font-black text-lg text-[var(--foreground)] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-[var(--accent)] transition-all leading-tight mb-4">
                        {car.name}
                      </h3>

                      <div className="mt-auto flex items-center justify-between border-t border-[var(--card-border)] pt-4">
                        <p className="text-[10px] text-[var(--muted)] font-bold uppercase">
                          🎨 {car.car_liveries?.length || 0} Liveries
                        </p>

                        <span className="text-[10px] text-[var(--foreground)] font-bold bg-[var(--background)] border border-[var(--card-border)] group-hover:bg-[var(--accent)] group-hover:text-white group-hover:border-[var(--accent)] py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider">
                          View Specs
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* LOAD MORE BUTTON */}
            {visibleCount < filteredCars.length && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] hover:bg-[var(--accent-glow)] hover:border-[var(--accent)] text-[var(--foreground)] px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all group"
                >
                  Load More Vehicles
                  <ChevronDown
                    size={18}
                    className="group-hover:translate-y-1 transition-transform"
                  />
                </button>
              </div>
            )}

            {/* Indikator Info Total Mobil */}
            <div className="mt-6 text-center text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
              Showing {carsToShow.length} of {filteredCars.length} vehicles
            </div>
          </>
        )}
      </div>
    </div>
  );
}
