'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  X,
  Activity,
  Server as ServerIcon,
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';

// DAFTAR SERVER (Silakan ganti URL-nya dengan IP/URL API Server Anda)
// Catatan: Gunakan HTTP/HTTPS URL, bukan IP Mentah tanpa port web, agar browser bisa mengeceknya.
const SERVER_ENDPOINTS = [
  {
    id: 'main',
    name: 'Main Server Racing',
    location: 'West Java, ID',
    url: 'http://103.150.101.154',
  },
  {
    id: 'gs1',
    name: 'Secondary Server',
    location: 'Jakarta, ID',
    url: 'http://8.215.48.48/',
  }, // Dummy URL untuk tes
  {
    id: 'gs2',
    name: 'Backup Server',
    location: 'Jakarta, ID',
    url: 'http://103.26.176.179/',
  }, // Dummy URL untuk tes
];

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // State untuk melacak status masing-masing server
  const [serverStatuses, setServerStatuses] = useState<
    Record<
      string,
      { status: 'checking' | 'online' | 'offline'; latency: number | null }
    >
  >({});

  // State agregat untuk tombol di footer (Jika ada 1 yang mati, status = Partial/Offline)
  const [globalStatus, setGlobalStatus] = useState<
    'checking' | 'online' | 'partial' | 'offline'
  >('checking');

  // FUNGSI UNTUK MENGECEK 1 SERVER
  const pingServer = async (serverInfo: (typeof SERVER_ENDPOINTS)[0]) => {
    setServerStatuses((prev) => ({
      ...prev,
      [serverInfo.id]: { status: 'checking', latency: null },
    }));
    const startTime = Date.now();

    try {
      // Menggunakan mode 'no-cors' agar browser tidak memblokir ping ke IP beda domain (hanya mengecek apakah server hidup/merespons)
      await fetch(serverInfo.url, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-store',
      });
      const latency = Date.now() - startTime;

      setServerStatuses((prev) => ({
        ...prev,
        [serverInfo.id]: { status: 'online', latency },
      }));
      return 'online';
    } catch (error) {
      setServerStatuses((prev) => ({
        ...prev,
        [serverInfo.id]: { status: 'offline', latency: -1 },
      }));
      return 'offline';
    }
  };

  // FUNGSI UNTUK MENGECEK SEMUA SERVER
  const runDiagnostics = async () => {
    setGlobalStatus('checking');

    // Jalankan ping ke semua server secara bersamaan (paralel)
    const results = await Promise.all(
      SERVER_ENDPOINTS.map((s) => pingServer(s)),
    );

    // Kalkulasi status global
    const totalOnline = results.filter((r) => r === 'online').length;
    if (totalOnline === SERVER_ENDPOINTS.length) setGlobalStatus('online');
    else if (totalOnline === 0) setGlobalStatus('offline');
    else setGlobalStatus('partial');
  };

  // Jalankan cek secara otomatis di background saat halaman dimuat (untuk status awal di footer)
  useEffect(() => {
    runDiagnostics();
    // Opsional: Auto-refresh status setiap 60 detik
    const interval = setInterval(runDiagnostics, 60000);
    return () => clearInterval(interval);
  }, []);

  const openModal = () => {
    setIsModalOpen(true);
    runDiagnostics(); // Selalu tes ulang saat modal dibuka agar benar-benar real-time
  };

  return (
    <>
      <footer className="bg-gray-950 border-t border-gray-800 pt-12 pb-8 relative z-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
            {/* Brand Section */}
            <div className="col-span-1 md:col-span-1">
              <h3 className="text-xl font-bold text-white mb-4 italic uppercase tracking-tighter">
                NISMARA <span className="text-blue-500">RACING</span>
              </h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Pusat modifikasi dan portal live server Assetto Corsa terbaik
                untuk komunitas balap Indonesia.
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-widest text-xs">
                Navigasi
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <Link href="/" className="hover:text-blue-400 transition">
                    Home
                  </Link>
                </li>
                <li>
                  <Link
                    href="/servers"
                    className="hover:text-blue-400 transition"
                  >
                    Servers List
                  </Link>
                </li>
                <li>
                  <Link
                    href="/events"
                    className="hover:text-blue-400 transition"
                  >
                    Events List
                  </Link>
                </li>
              </ul>
            </div>

            {/* Community Links */}
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-widest text-xs">
                Komunitas
              </h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a
                    href="https://link.nismara.web.id/discord"
                    className="hover:text-[#5865F2] transition italic font-bold"
                  >
                    Join Discord
                  </a>
                </li>
                <li>
                  <a
                    href="https://link.nismara.web.id/instagram"
                    className="hover:text-[#E4405F] transition"
                  >
                    Instagram
                  </a>
                </li>
                <li>
                  <a
                    href="https://link.nismara.web.id/youtube"
                    className="hover:text-[#FF0000] transition"
                  >
                    YouTube Channel
                  </a>
                </li>
              </ul>
            </div>

            {/* Server Info Snapshot */}
            <div>
              <h4 className="text-white font-semibold mb-4 uppercase tracking-widest text-xs">
                Status Sistem
              </h4>

              <button
                onClick={openModal}
                className="w-full text-left bg-gray-900 p-4 rounded-xl border border-gray-800 hover:border-purple-500 hover:bg-gray-800 transition-all group relative overflow-hidden shadow-lg"
              >
                <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-500/10 to-purple-500/10 blur-2xl group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition"></div>

                <div className="flex items-center justify-between mb-1 relative z-10">
                  <div className="flex items-center gap-2">
                    {globalStatus === 'online' && (
                      <span className="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></span>
                    )}
                    {globalStatus === 'partial' && (
                      <span className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.8)]"></span>
                    )}
                    {globalStatus === 'offline' && (
                      <span className="h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                    {globalStatus === 'checking' && (
                      <span className="h-2 w-2 rounded-full bg-gray-500 animate-pulse"></span>
                    )}

                    <span className="text-xs text-gray-200 uppercase font-bold tracking-wider">
                      {globalStatus === 'online'
                        ? 'All Systems Operational'
                        : globalStatus === 'partial'
                          ? 'Partial Degradation'
                          : globalStatus === 'offline'
                            ? 'Systems Down'
                            : 'Checking Status...'}
                    </span>
                  </div>
                  <Activity
                    size={14}
                    className="text-gray-500 group-hover:text-purple-500 transition"
                  />
                </div>

                <p className="text-[10px] text-gray-500 font-medium relative z-10">
                  {SERVER_ENDPOINTS.length} Servers Monitored
                </p>

                <div className="mt-3 pt-3 border-t border-gray-800/50 flex justify-between items-center relative z-10">
                  <span className="text-[9px] text-gray-500 uppercase tracking-widest">
                    Live Multi-Server Ping
                  </span>
                  <span className="text-[9px] text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 font-bold group-hover:translate-x-1 transition-transform">
                    Run Diagnostics →
                  </span>
                </div>
              </button>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} Nismara Racing. Part of Nismara
              Group.
            </p>
            <div className="flex gap-6 text-xs text-gray-500 font-medium">
              <Link href="/privacy" className="hover:text-white transition">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-white transition">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* ================= MODAL DIAGNOSTICS ================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-gray-950 border border-gray-800 rounded-2xl w-full max-w-lg overflow-hidden flex flex-col shadow-[0_0_50px_rgba(59,130,246,0.15)] animate-in zoom-in-95 duration-200">
            {/* Header Modal */}
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-gray-900/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg">
                  <Activity size={18} className="text-blue-400" />
                </div>
                <div>
                  <h2 className="text-sm font-black text-white uppercase tracking-wider">
                    Network Diagnostics
                  </h2>
                  <p className="text-[9px] text-gray-500 uppercase tracking-widest mt-0.5">
                    Real-time Telemetry
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-500 hover:text-white transition bg-gray-800 p-1.5 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body Modal */}
            <div className="p-6">
              {/* List of Servers */}
              <div className="space-y-3 mb-6">
                <h3 className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-4">
                  Infrastructure Nodes
                </h3>

                {SERVER_ENDPOINTS.map((server) => {
                  const data = serverStatuses[server.id] || {
                    status: 'checking',
                    latency: null,
                  };

                  return (
                    <div
                      key={server.id}
                      className="bg-gray-900 p-4 rounded-xl border border-gray-800 flex items-center justify-between group hover:border-gray-700 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-950 border border-gray-800 rounded-lg text-gray-500">
                          <ServerIcon size={16} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-gray-200 uppercase">
                            {server.name}
                          </h4>
                          <p className="text-[9px] text-gray-500 flex items-center gap-1 mt-1">
                            <Globe size={8} /> {server.location}
                          </p>
                        </div>
                      </div>

                      {/* Status / Latency Display */}
                      <div className="text-right">
                        {data.status === 'checking' && (
                          <div className="flex items-center gap-2 text-blue-500">
                            <Loader2 size={14} className="animate-spin" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              Pinging
                            </span>
                          </div>
                        )}

                        {data.status === 'online' && (
                          <div className="flex flex-col items-end">
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2
                                size={12}
                                className="text-green-500"
                              />
                              <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">
                                Online
                              </span>
                            </div>
                            <span
                              className={`text-xs font-black mt-1 ${
                                data.latency! < 50
                                  ? 'text-green-400'
                                  : data.latency! < 150
                                    ? 'text-yellow-400'
                                    : 'text-red-400'
                              }`}
                            >
                              {data.latency}{' '}
                              <span className="text-[9px] text-gray-500 font-bold">
                                ms
                              </span>
                            </span>
                          </div>
                        )}

                        {data.status === 'offline' && (
                          <div className="flex items-center gap-1.5">
                            <XCircle size={14} className="text-red-500" />
                            <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">
                              Offline
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Action Button */}
              <button
                onClick={runDiagnostics}
                disabled={globalStatus === 'checking'}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:from-gray-800 disabled:to-gray-800 disabled:text-gray-500 text-white py-3.5 rounded-xl font-black uppercase tracking-widest transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(59,130,246,0.2)]"
              >
                {globalStatus === 'checking'
                  ? 'Pinging Nodes...'
                  : 'Refresh All Connections'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
