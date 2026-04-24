import React from 'react';
import {
  ShieldCheck,
  Info,
  Lock,
  Globe,
  Settings,
  ExternalLink,
  AlertCircle,
  MousePointer2,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cookies Policy | Nismara Racing',
  description:
    'Informasi kebijakan cookie Nismara Racing mengenai penggunaan cookie dan teknologi serupa untuk meningkatkan layanan',
  openGraph: {
    title: 'Cookies Policy - Nismara Racing',
    description:
      'Informasi kebijakan cookie Nismara Racing mengenai penggunaan cookie dan teknologi serupa untuk meningkatkan layanan',
    images: ['https://i.imgur.com/WTq93jI.png'],
  },
  keywords: [
    'Nismara Racing',
    'Nismara Group',
    'Cookies Policy Nismara Racing',
  ],
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
    },
  },
};

export default function CookiesPolicy() {
  return (
    <div className="min-h-screen bg-[var(--background)] py-20 px-6">
      <div className="max-w-4xl mx-auto">
        {/* --- HEADER --- */}
        <div className="mb-16 text-center">
          <div className="inline-flex items-center gap-2 bg-[var(--accent-glow)] border border-[var(--accent)]/20 px-4 py-1 rounded-full mb-6">
            <ShieldCheck size={14} className="text-[var(--accent)]" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              Privacy & Transparency
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter text-[var(--foreground)] mb-4">
            Cookies{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-[var(--accent)]">
              Policy
            </span>
          </h1>
          <p className="text-[var(--muted)] font-bold uppercase tracking-widest text-xs">
            Terakhir Diperbarui: 19 April 2026
          </p>
        </div>

        <div className="space-y-10">
          {/* --- APA ITU COOKIES --- */}
          <section className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2rem] relative overflow-hidden shadow-sm">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Info size={120} />
            </div>
            <h2 className="text-xl font-black uppercase tracking-widest mb-4 flex items-center gap-3 text-[var(--foreground)]">
              <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
              Apa itu Cookies?
            </h2>
            <p className="text-[var(--muted)] leading-relaxed text-sm md:text-base relative z-10">
              Cookies adalah file teks kecil yang dikirimkan ke browser kamu
              oleh website yang kamu kunjungi. Mereka membantu website mengingat
              informasi tentang kunjungan kamu, seperti preferensi bahasa dan
              pengaturan lainnya. Di{' '}
              <span className="text-[var(--foreground)] font-bold">
                Nismara Racing
              </span>
              , kami menggunakan ini untuk memastikan sistem autentikasi driver
              dan proteksi keamanan Cloudflare berjalan dengan sempurna.
            </p>
          </section>

          {/* --- COOKIES YANG KAMI GUNAKAN --- */}
          <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2rem]">
              <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-6 text-blue-500">
                <Globe size={24} />
              </div>
              <h3 className="font-black uppercase tracking-widest text-sm mb-3 text-[var(--foreground)]">
                Cloudflare Security
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Kami menggunakan cookie fungsional dari Cloudflare (seperti{' '}
                <code className="text-[var(--accent)]">__cf_bm</code>) untuk
                mengidentifikasi trafik bot berbahaya dan mencegah serangan DDoS
                pada server balap kami. Ini bersifat wajib demi keamanan data
                driver.
              </p>
            </div>

            <div className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2rem]">
              <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center mb-6 text-[var(--accent)]">
                <Lock size={24} />
              </div>
              <h3 className="font-black uppercase tracking-widest text-sm mb-3 text-[var(--foreground)]">
                Supabase Auth
              </h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed">
                Cookie ini menyimpan token sesi terenkripsi yang memungkinkan
                kamu tetap login ke dashboard driver. Tanpa ini, kamu harus
                memasukkan kredensial setiap kali berpindah halaman.
              </p>
            </div>
          </section>

          {/* --- CARA MENGONTROL COOKIES (FULL GUIDE) --- */}
          <section className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2rem]">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                <Settings size={20} />
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-widest text-[var(--foreground)]">
                  Cara Mengontrol Cookies
                </h2>
                <p className="text-[10px] text-[var(--muted)] font-bold uppercase tracking-widest">
                  Manajemen Preferensi Browser
                </p>
              </div>
            </div>

            <p className="text-[var(--muted)] text-sm mb-8 leading-relaxed">
              Kamu memiliki kendali penuh untuk menghapus atau menolak cookies
              melalui pengaturan browser kamu. Berikut adalah panduan
              langkah-demi-langkah untuk melakukannya di berbagai platform:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Google Chrome */}
              <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--accent)]/30 transition-colors group">
                <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center justify-between text-[var(--foreground)]">
                  Google Chrome
                  <MousePointer2
                    size={12}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </h4>
                <ol className="text-[11px] text-[var(--muted)] space-y-2 list-decimal ml-4">
                  <li>
                    Buka <strong>Settings</strong> (ikon tiga titik).
                  </li>
                  <li>
                    Pilih <strong>Privacy and security</strong>.
                  </li>
                  <li>
                    Klik <strong>Cookies and other site data</strong>.
                  </li>
                  <li>Di sini kamu bisa menghapus atau memblokir cookies.</li>
                </ol>
              </div>

              {/* Mozilla Firefox */}
              <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--accent)]/30 transition-colors group">
                <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center justify-between text-[var(--foreground)]">
                  Mozilla Firefox
                  <MousePointer2
                    size={12}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </h4>
                <ol className="text-[11px] text-[var(--muted)] space-y-2 list-decimal ml-4">
                  <li>
                    Klik menu (tiga garis) dan pilih <strong>Settings</strong>.
                  </li>
                  <li>
                    Pilih panel <strong>Privacy & Security</strong>.
                  </li>
                  <li>
                    Cari bagian <strong>Cookies and Site Data</strong>.
                  </li>
                  <li>
                    Pilih <strong>Manage Data</strong> atau blokir sesuai
                    keinginan.
                  </li>
                </ol>
              </div>

              {/* Safari (macOS/iOS) */}
              <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--accent)]/30 transition-colors group">
                <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center justify-between text-[var(--foreground)]">
                  Safari
                  <MousePointer2
                    size={12}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </h4>
                <ol className="text-[11px] text-[var(--muted)] space-y-2 list-decimal ml-4">
                  <li>
                    Buka <strong>Preferences</strong> (macOS) atau{' '}
                    <strong>Settings</strong> (iOS).
                  </li>
                  <li>
                    Klik pada tab <strong>Privacy</strong>.
                  </li>
                  <li>
                    Klik <strong>Manage Website Data</strong>.
                  </li>
                  <li>Pilih untuk menghapus semua atau website tertentu.</li>
                </ol>
              </div>

              {/* Microsoft Edge */}
              <div className="p-5 rounded-2xl bg-[var(--background)] border border-[var(--card-border)] hover:border-[var(--accent)]/30 transition-colors group">
                <h4 className="text-xs font-black uppercase tracking-widest mb-3 flex items-center justify-between text-[var(--foreground)]">
                  Microsoft Edge
                  <MousePointer2
                    size={12}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </h4>
                <ol className="text-[11px] text-[var(--muted)] space-y-2 list-decimal ml-4">
                  <li>
                    Klik <strong>Settings and more</strong> (tiga titik).
                  </li>
                  <li>
                    Pilih <strong>Settings</strong> {'>'}{' '}
                    <strong>Cookies and site permissions</strong>.
                  </li>
                  <li>
                    Klik{' '}
                    <strong>Manage and delete cookies and site data</strong>.
                  </li>
                </ol>
              </div>
            </div>

            <div className="mt-8 p-4 bg-orange-500/5 border border-orange-500/20 rounded-xl flex gap-3">
              <AlertCircle size={18} className="text-orange-500 shrink-0" />
              <p className="text-[10px] text-orange-500/80 leading-relaxed font-bold uppercase tracking-wide">
                Peringatan: Memblokir semua cookies dapat menyebabkan kamu tidak
                bisa login ke akun driver Nismara atau mengakses fitur eksklusif
                member lainnya.
              </p>
            </div>
          </section>

          {/* --- KONTAK --- */}
          <footer className="text-center pt-12 border-t border-[var(--card-border)]">
            <p className="text-sm text-[var(--muted)] mb-6 font-medium italic">
              "Keep it clean on track, keep it safe in data."
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="https://discord.gg/nismara"
                target="_blank"
                className="flex items-center gap-2 px-6 py-3 bg-[var(--card)] border border-[var(--card-border)] rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:border-[var(--accent)] transition-all"
              >
                Help Desk <ExternalLink size={12} />
              </a>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
