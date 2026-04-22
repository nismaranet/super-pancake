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
  Zap, // Tambahan untuk branding logo
} from 'lucide-react';

// DAFTAR SERVER TETAP SAMA
const SERVER_ENDPOINTS = [
  {
    id: 'main',
    name: 'Main Server Racing',
    location: 'West Java, ID',
    url: 'https://assetto.nismara.web.id/',
  },
  {
    id: 'gs1',
    name: 'Secondary Server',
    location: 'Jakarta, ID',
    url: 'https://s3.nismara.web.id/',
  },
  {
    id: 'gs2',
    name: 'Backup Server',
    location: 'Jakarta, ID',
    url: 'https://amatomasaki.my.id/',
  },
];

export default function Footer() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [serverStatuses, setServerStatuses] = useState<any>({});
  const [globalStatus, setGlobalStatus] = useState<
    'online' | 'partial' | 'offline' | 'checking'
  >('checking');

  // LOGIKA CEK SERVER TETAP SAMA (Tidak dikurangi)
  const checkServerStatus = async (server: any) => {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      await fetch(server.url, { mode: 'no-cors', signal: controller.signal });
      clearTimeout(timeoutId);

      const latency = Date.now() - startTime;
      return { status: 'online', latency };
    } catch (error) {
      return { status: 'offline', latency: 0 };
    }
  };

  const runDiagnostics = async () => {
    setGlobalStatus('checking');
    const results: any = {};
    let onlineCount = 0;

    for (const server of SERVER_ENDPOINTS) {
      const res = await checkServerStatus(server);
      results[server.id] = res;
      if (res.status === 'online') onlineCount++;
    }

    setServerStatuses(results);
    if (onlineCount === SERVER_ENDPOINTS.length) setGlobalStatus('online');
    else if (onlineCount > 0) setGlobalStatus('partial');
    else setGlobalStatus('offline');
  };

  useEffect(() => {
    runDiagnostics();
    const interval = setInterval(runDiagnostics, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <footer className="bg-[var(--card)] border-t border-[var(--glass-border)] pt-20 pb-10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-12">
          {/* Branding Section */}
          <div className="md:col-span-4 space-y-5">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-8 h-8 racing-gradient rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
                <Zap size={18} className="text-white fill-white" />
              </div>
              <span className="font-black italic text-2xl tracking-tighter uppercase">
                NISMARA<span className="text-[var(--accent)]">RACING</span>
              </span>
            </Link>
            <p className="text-[var(--muted)] text-sm leading-relaxed max-w-sm">
              Nismara Racing adalah komunitas balap virtual yang dioperasikan
              oleh Nismara Group. Bergabunglah dengan komunitas kami dan rasakan
              sensasi balapan kompetitif yang sebenarnya.
            </p>
          </div>

          {/* Navigation Section */}
          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">
              Navigation
            </h4>
            <div className="flex flex-col gap-3">
              <FooterLink href="/events">Race Events</FooterLink>
              <FooterLink href="/leaderboard">Driver Standings</FooterLink>
              <FooterLink href="/cars">Available Cars</FooterLink>
              <FooterLink href="/tracks">Circuit List</FooterLink>
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">
              Social Media
            </h4>
            <div className="flex flex-col gap-3">
              <FooterLink
                href="https://link.nismara.web.id/discord"
                target="_blank"
              >
                Discord
              </FooterLink>
              <FooterLink
                href="https://link.nismara.web.id/instagram"
                target="_blank"
              >
                Instagram
              </FooterLink>
              <FooterLink
                href="https://link.nismara.web.id/youtube"
                target="_blank"
              >
                YouTube
              </FooterLink>
            </div>
          </div>

          {/* Server Status Section */}
          <div className="md:col-span-4 space-y-5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--accent)]">
              System Infrastructure
            </h4>
            <div className="p-5 rounded-2xl bg-white/5 border border-[var(--glass-border)] space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full animate-pulse ${
                      globalStatus === 'online'
                        ? 'bg-green-500'
                        : globalStatus === 'partial'
                          ? 'bg-yellow-500'
                          : 'bg-red-500'
                    }`}
                  />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">
                    {globalStatus === 'checking'
                      ? 'Checking Nodes...'
                      : globalStatus === 'online'
                        ? 'All Systems Go'
                        : 'Network Issues'}
                  </span>
                </div>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="text-[9px] font-black uppercase tracking-widest text-[var(--accent)] hover:underline"
                >
                  View Details
                </button>
              </div>
              <button
                onClick={() => setIsModalOpen(true)}
                className="w-full py-3 glass rounded-xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:border-[var(--accent)] transition-all"
              >
                <Activity size={14} className="text-[var(--accent)]" />
                Network Diagnostics
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="max-w-7xl mx-auto px-6 mt-20 pt-8 border-t border-[var(--glass-border)] flex flex-col md:grow md:flex-row justify-between items-center gap-6">
          <p className="text-[10px] font-bold text-[var(--muted)] uppercase tracking-[0.2em]">
            © 2026 Nismara Group • v1.0.1 • Made with ❤️ from Lemper
          </p>
          <div className="flex items-center gap-8 text-[var(--muted)]">
            <Link
              href="https://services.nismara.web.id/"
              className="text-[9px] font-bold uppercase hover:text-[var(--accent)] transition"
            >
              Service Monitor
            </Link>
            <Link
              href="/terms"
              className="text-[9px] font-bold uppercase hover:text-[var(--accent)] transition"
            >
              Terms
            </Link>
            <Link
              href="/privacy"
              className="text-[9px] font-bold uppercase hover:text-[var(--accent)] transition"
            >
              Privacy
            </Link>
            <Link
              href="/cookies-policy"
              className="text-[9px] font-bold uppercase hover:text-[var(--accent)] transition"
            >
              Cookies Policy
            </Link>
          </div>
        </div>
      </footer>

      {/* SERVER STATUS MODAL - Desain Baru (Glassmorphism) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-lg glass rounded-3xl overflow-hidden shadow-2xl">
            <div className="p-6 border-b border-[var(--glass-border)] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-[var(--accent-glow)] rounded-xl text-[var(--accent)]">
                  <ServerIcon size={20} />
                </div>
                <div>
                  <h3 className="font-black italic uppercase tracking-tighter text-lg">
                    Network Nodes
                  </h3>
                  <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-widest">
                    Real-time status monitor
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 hover:bg-white/5 rounded-full transition"
              >
                <X size={20} className="text-[var(--muted)]" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="space-y-3">
                {SERVER_ENDPOINTS.map((server) => {
                  const data = serverStatuses[server.id] || {
                    status: 'checking',
                    latency: 0,
                  };
                  return (
                    <div
                      key={server.id}
                      className="p-4 bg-white/5 border border-[var(--glass-border)] rounded-2xl flex items-center justify-between"
                    >
                      <div className="flex items-center gap-4">
                        <Globe size={18} className="text-[var(--muted)]" />
                        <div>
                          <p className="text-xs font-black uppercase italic leading-none mb-1">
                            {server.name}
                          </p>
                          <p className="text-[9px] text-[var(--muted)] font-bold uppercase tracking-tighter">
                            {server.location}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {data.status === 'checking' ? (
                          <Loader2
                            size={16}
                            className="animate-spin text-[var(--muted)] ml-auto"
                          />
                        ) : data.status === 'online' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold text-green-500">
                              {data.latency}ms
                            </span>
                            <CheckCircle2
                              size={16}
                              className="text-green-500"
                            />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-red-500">
                            <span className="text-[10px] font-black uppercase">
                              Timed Out
                            </span>
                            <XCircle size={16} />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={runDiagnostics}
                disabled={globalStatus === 'checking'}
                className="w-full racing-gradient py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-purple-500/20 active:scale-95 transition-all disabled:opacity-50"
              >
                {globalStatus === 'checking'
                  ? 'Pinging Nodes...'
                  : 'Refresh Connections'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function FooterLink({ href, children }: any) {
  return (
    <Link
      href={href}
      className="text-sm text-[var(--muted)] hover:text-[var(--accent)] transition-all flex items-center gap-2 group"
    >
      <div className="w-1 h-1 bg-transparent group-hover:bg-[var(--accent)] rounded-full transition-all" />
      {children}
    </Link>
  );
}
