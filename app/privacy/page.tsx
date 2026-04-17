'use client';

import Link from 'next/link';
import { ChevronLeft, Shield, Lock, Eye, FileText } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-blue-500/30">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-20">
        {/* Back Button */}
        <Link
          href="/"
          className="group flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-12"
        >
          <ChevronLeft
            size={20}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-[10px] font-black uppercase tracking-[0.3em]">
            Back to Home
          </span>
        </Link>

        {/* Header */}
        <header className="mb-16">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg border border-blue-500/20">
              <Shield size={20} className="text-blue-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-400">
              Legal Document
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">
            Privacy <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">
              Policy
            </span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Last Updated: March 2024
          </p>
        </header>

        {/* Content */}
        <div className="space-y-12">
          {/* Section 1 */}
          <section className="relative p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-md">
            <div className="flex items-start gap-6">
              <div className="hidden sm:block p-4 bg-white/5 rounded-2xl border border-white/10 text-gray-400">
                <Eye size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black italic uppercase tracking-wider mb-4">
                  1. Introduction
                </h2>
                <p className="text-gray-400 leading-relaxed text-sm">
                  Selamat datang di{' '}
                  <span className="text-white">Nismara Racing</span>, komunitas
                  Sim Racing yang dioperasikan oleh{' '}
                  <span className="text-white text-sm">Nismara Group</span>.
                  Kami berkomitmen untuk melindungi privasi Anda dan memastikan
                  data pribadi Anda ditangani dengan aman dan bertanggung jawab
                  dalam ekosistem simulasi kami.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="p-8 border border-white/5 rounded-[2rem] hover:border-blue-500/20 transition-colors group">
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                <FileText size={16} /> Information We Collect
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <span>
                    <strong className="text-gray-200">Account:</strong> Nama,
                    Email, dan Discord ID.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <span>
                    <strong className="text-gray-200">Sim Data:</strong>{' '}
                    SteamID, in-game nickname, dan statistik balap.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-blue-500">•</span>
                  <span>
                    <strong className="text-gray-200">Technical:</strong> Alamat
                    IP dan informasi perangkat.
                  </span>
                </li>
              </ul>
            </div>

            <div className="p-8 border border-white/5 rounded-[2rem] hover:border-purple-500/20 transition-colors group">
              <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-4 flex items-center gap-2">
                <Lock size={16} /> How We Use Data
              </h3>
              <ul className="space-y-3 text-sm text-gray-400">
                <li className="flex gap-2">
                  <span className="text-purple-500">•</span>
                  <span>Mengelola entri balapan dan klasemen kejuaraan.</span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-500">•</span>
                  <span>
                    Keamanan server dan mencegah kecurangan (anti-cheat).
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="text-purple-500">•</span>
                  <span>
                    Integrasi profil di seluruh divisi{' '}
                    <strong className="text-gray-200">Nismara Group</strong>.
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-6">
            <h2 className="text-xl font-black italic uppercase tracking-wider pl-4 border-l-2 border-blue-500">
              3. Data Sharing & Third Party
            </h2>
            <div className="text-gray-400 text-sm leading-relaxed space-y-4">
              <p>
                Kami tidak menjual data pribadi Anda. Namun, nama balap dan
                statistik Anda akan ditampilkan secara publik pada{' '}
                <span className="text-white italic">Leaderboard</span> website
                kami.
              </p>
              <p>
                Kami menggunakan layanan pihak ketiga seperti{' '}
                <span className="text-blue-400 font-bold tracking-widest text-[10px] uppercase">
                  Supabase
                </span>{' '}
                untuk database dan{' '}
                <span className="text-purple-400 font-bold tracking-widest text-[10px] uppercase">
                  Discord
                </span>{' '}
                untuk verifikasi identitas.
              </p>
            </div>
          </section>

          {/* Footer of Content */}
          <div className="pt-12 border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.5em]">
              Nismara Group Virtual Company © 2024
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
