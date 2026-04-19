'use client';

import { useEffect, useState, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';
import { Search, MapPin, ChevronDown, Map } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

export default function TracksDirectory() {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // States untuk Filter & Pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('ALL');

  // State untuk Pagination / Load More
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);

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
          run_direction,
          uri
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

  // Reset visible count setiap kali user melakukan pencarian atau ganti filter
  useEffect(() => {
    setVisibleCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedCountry]);

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

  // Data yang benar-benar di-render ke layar saat ini
  const tracksToShow = filteredTracks.slice(0, visibleCount);

  // Handler untuk tombol Load More
  const handleLoadMore = () => {
    setVisibleCount((prev) => prev + ITEMS_PER_PAGE);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex flex-col items-center justify-center space-y-4 transition-colors duration-300">
        <div className="w-12 h-12 border-4 border-[var(--accent)] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[var(--accent)] font-bold italic tracking-widest uppercase">
          Loading Circuits...
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
          <div className="absolute -top-10 -left-10 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full pointer-events-none"></div>

          <div className="relative z-10">
            <h1 className="text-4xl md:text-5xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-2">
              Circuit{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[var(--accent)]">
                Directory
              </span>
            </h1>
            <p className="text-[var(--muted)] text-sm font-bold tracking-widest uppercase">
              Global Tracks & Venues Available for Racing
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto relative z-10">
            {/* Search Input */}
            <div className="relative group">
              <input
                type="text"
                placeholder="Search track or city..."
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
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full md:w-48 p-3 rounded-xl bg-[var(--card)] border border-[var(--card-border)] focus:border-[var(--accent)] outline-none transition-all shadow-inner text-sm text-[var(--foreground)] font-bold uppercase cursor-pointer appearance-none"
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
          <div className="text-center py-20 bg-[var(--card)] rounded-3xl border border-[var(--card-border)] border-dashed">
            <Map
              className="mx-auto text-[var(--muted)] mb-4 opacity-50"
              size={48}
            />
            <p className="text-[var(--muted)] text-lg italic font-bold">
              No circuits match your criteria.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCountry('ALL');
              }}
              className="mt-4 text-[var(--accent)] hover:opacity-80 text-sm font-bold uppercase tracking-widest underline transition-opacity"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {tracksToShow.map((track) => (
                <Link
                  href={`/tracks/${track.uri}`}
                  key={track.id}
                  className="group block"
                >
                  <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl overflow-hidden hover:border-[var(--accent)] transition-all duration-300 shadow-sm hover:shadow-[0_0_30px_var(--accent-glow)] flex flex-col h-full transform hover:-translate-y-1">
                    {/* Image Section */}
                    <div className="relative aspect-video bg-[var(--background)] overflow-hidden">
                      {track.image_url ? (
                        <img
                          src={track.image_url}
                          alt={track.name}
                          loading="lazy"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-90 group-hover:opacity-100"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[var(--muted)] font-black italic text-xs">
                          NO MAP PREVIEW
                        </div>
                      )}

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-[var(--card)]/40 to-transparent"></div>

                      {/* Floating Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                        {track.country && (
                          <span className="text-[9px] bg-[var(--accent)] text-white px-2.5 py-1 rounded-md border border-[var(--accent)]/50 uppercase font-black tracking-widest shadow-lg">
                            {track.country}
                          </span>
                        )}
                      </div>

                      {/* Location Badge */}
                      <div className="absolute bottom-3 left-4">
                        <p className="text-[10px] text-[var(--accent)] font-bold uppercase tracking-widest drop-shadow-md flex items-center gap-1.5">
                          <MapPin size={12} className="text-blue-500" />
                          {track.city ? `${track.city}, ` : ''}
                          {track.country || 'Unknown Location'}
                        </p>
                      </div>
                    </div>

                    {/* Info Section */}
                    <div className="p-5 flex flex-col flex-grow relative bg-[var(--card)]">
                      <h3 className="font-black text-xl text-[var(--foreground)] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blue-500 group-hover:to-[var(--accent)] transition-all leading-tight mb-4">
                        {track.name}
                      </h3>

                      <div className="mt-auto grid grid-cols-2 gap-4 border-t border-[var(--card-border)] pt-4">
                        <div>
                          <span className="block text-[9px] text-[var(--muted)] uppercase font-bold tracking-widest mb-0.5">
                            Pitboxes
                          </span>
                          <span className="text-sm font-black text-[var(--foreground)]">
                            {track.pitboxes || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="block text-[9px] text-[var(--muted)] uppercase font-bold tracking-widest mb-0.5">
                            Length
                          </span>
                          <span className="text-sm font-black text-[var(--foreground)] uppercase">
                            {track.length || 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* LOAD MORE BUTTON */}
            {visibleCount < filteredTracks.length && (
              <div className="mt-12 flex justify-center">
                <button
                  onClick={handleLoadMore}
                  className="flex items-center gap-2 bg-[var(--glass-bg)] backdrop-blur-md border border-[var(--glass-border)] hover:bg-[var(--accent-glow)] hover:border-[var(--accent)] text-[var(--foreground)] px-8 py-3 rounded-xl font-black uppercase tracking-widest transition-all group"
                >
                  Load More Circuits
                  <ChevronDown
                    size={18}
                    className="group-hover:translate-y-1 transition-transform"
                  />
                </button>
              </div>
            )}

            {/* Indikator Info Total Sirkuit */}
            <div className="mt-6 text-center text-[10px] font-bold text-[var(--muted)] uppercase tracking-widest">
              Showing {tracksToShow.length} of {filteredTracks.length} circuits
            </div>
          </>
        )}
      </div>
    </div>
  );
}
