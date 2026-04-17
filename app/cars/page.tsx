'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function PublicCarsList() {
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States untuk Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('ALL');

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-blue-500 font-bold italic tracking-widest uppercase">
          Loading Showroom...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-200 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* HEADER & SEARCH SECTION */}
        <div className="mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic text-white uppercase tracking-tighter mb-2">
              Vehicle <span className="text-blue-500">Roster</span>
            </h1>
            <p className="text-gray-400 text-sm font-bold tracking-widest uppercase">
              Available Fleet for Nismara Racing
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Search car or brand..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 p-3 pl-10 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition shadow-inner text-sm text-white"
              />
              <span className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-blue-500 transition">
                🔍
              </span>
            </div>

            {/* Filter Dropdown */}
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full md:w-48 p-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-blue-500 outline-none transition shadow-inner text-sm text-white font-bold uppercase"
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
          <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800 border-dashed">
            <p className="text-gray-500 text-lg italic font-bold">
              No vehicles match your criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedClass('ALL');
              }}
              className="mt-4 text-blue-500 hover:text-blue-400 text-sm font-bold uppercase tracking-widest underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredCars.map((car) => (
              <Link
                href={`/cars/${car.uri}`}
                key={car.id}
                className="group block"
              >
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] flex flex-col h-full transform hover:-translate-y-1">
                  {/* Image Section */}
                  <div className="relative aspect-video bg-gray-800 overflow-hidden">
                    {car.image_url ? (
                      <img
                        src={car.image_url}
                        alt={car.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 font-black italic text-xs">
                        NO PREVIEW
                      </div>
                    )}

                    {/* Gradient Overlay for bottom text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent"></div>

                    {/* Floating Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                      {car.class && (
                        <span className="text-[9px] bg-blue-600 text-white px-2 py-1 rounded border border-white-500 uppercase font-black tracking-widest shadow-lg">
                          {car.class}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-5 flex flex-col flex-grow relative">
                    <p className="text-[10px] text-blue-500 font-bold uppercase tracking-widest mb-1">
                      {car.brand || 'CUSTOM'}{' '}
                      {car.country ? `• ${car.country}` : ''}
                    </p>
                    <h3 className="font-black text-xl text-white group-hover:text-blue-400 transition-colors leading-tight mb-4">
                      {car.name}
                    </h3>

                    <div className="mt-auto flex items-center justify-between border-t border-gray-800 pt-4">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">
                        🎨 {car.car_liveries?.length || 0} Liveries
                      </p>

                      <span className="text-xs text-white font-bold bg-gray-800 group-hover:bg-blue-600 py-1.5 px-3 rounded-lg transition-colors uppercase tracking-wider">
                        View Specs
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
