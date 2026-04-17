'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function TracksDirectory() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States untuk Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');

  useEffect(() => {
    async function fetchPublicTracks() {
      // Mengambil data sirkuit dari Supabase
      const { data, error } = await supabase
        .from('tracks')
        .select(
          `
          id, 
          name, 
          image_url, 
          country,
          city,
          length,
          pitboxes,
          run_direction
        `,
        )
        .order('name', { ascending: true });

      if (!error && data) {
        setTracks(data);
      }
      setLoading(false);
    }

    fetchPublicTracks();
  }, []);

  // Mendapatkan daftar negara unik untuk dropdown filter
  const availableCountries = useMemo(() => {
    const countries = tracks.map((track) => track.country).filter(Boolean);
    // Hapus duplikat
    return ['ALL', ...Array.from(new Set(countries))];
  }, [tracks]);

  // Logika Filter Data
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      const matchSearch =
        track.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (track.city &&
          track.city.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchCountry =
        selectedCountry === 'ALL' || track.country === selectedCountry;

      return matchSearch && matchCountry;
    });
  }, [tracks, searchQuery, selectedCountry]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-purple-500 font-bold italic tracking-widest uppercase">
          Loading Circuits...
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
              Circuit <span className="text-purple-500">Directory</span>
            </h1>
            <p className="text-gray-400 text-sm font-bold tracking-widest uppercase">
              Global Tracks & Venues Available for Racing
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Search track or city..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full md:w-64 p-3 pl-10 rounded-xl bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none transition shadow-inner text-sm text-white"
              />
              <span className="absolute left-3 top-3.5 text-gray-500 group-focus-within:text-purple-500 transition">
                🔍
              </span>
            </div>

            {/* Filter Dropdown */}
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full md:w-48 p-3 rounded-xl bg-gray-900 border border-gray-800 focus:border-purple-500 outline-none transition shadow-inner text-sm text-white font-bold uppercase"
            >
              {availableCountries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TRACKS GRID */}
        {filteredTracks.length === 0 ? (
          <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-gray-800 border-dashed">
            <p className="text-gray-500 text-lg italic font-bold">
              No circuits match your criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCountry('ALL');
              }}
              className="mt-4 text-purple-500 hover:text-purple-400 text-sm font-bold uppercase tracking-widest underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredTracks.map((track) => (
              // TAUTAN MENGARAH KE HALAMAN DETAIL SIRKUIT YANG TELAH KITA BUAT
              <Link
                href={`/tracks/${track.id}`}
                key={track.id}
                className="group block"
              >
                <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-purple-500 transition-all duration-300 shadow-lg hover:shadow-[0_0_30px_rgba(234,88,12,0.15)] flex flex-col h-full transform hover:-translate-y-1">
                  {/* Image Section */}
                  <div className="relative aspect-video bg-gray-800 overflow-hidden">
                    {track.image_url ? (
                      <img
                        src={track.image_url}
                        alt={track.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-700 font-black italic text-xs">
                        NO MAP PREVIEW
                      </div>
                    )}

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>

                    {/* Floating Badges */}
                    <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                      {track.length && (
                        <span className="text-[9px] bg-purple-600 text-white px-2 py-1 rounded border border-purple-500 uppercase font-black tracking-widest shadow-lg">
                          📍 {track.country}
                        </span>
                      )}
                    </div>

                    {/* Location Badge */}
                    <div className="absolute bottom-3 left-4">
                      <p className="text-[10px] text-purple-500 font-bold uppercase tracking-widest drop-shadow-md flex items-center gap-1">
                        📍 {track.city ? `${track.city}, ` : ''}
                        {track.country || 'Unknown Location'}
                      </p>
                    </div>
                  </div>

                  {/* Info Section */}
                  <div className="p-5 flex flex-col flex-grow relative bg-gray-900">
                    <h3 className="font-black text-xl text-white group-hover:text-purple-400 transition-colors leading-tight mb-4">
                      {track.name}
                    </h3>

                    <div className="mt-auto grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
                      <div>
                        <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">
                          Pitboxes
                        </span>
                        <span className="text-sm font-black text-gray-300">
                          {track.pitboxes || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] text-gray-500 uppercase font-bold tracking-widest mb-0.5">
                          Length
                        </span>
                        <span className="text-sm font-black text-gray-300 uppercase">
                          {track.length || 'N/A'}
                        </span>
                      </div>
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
