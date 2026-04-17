'use client';

import Link from 'next/link';
import {
  ChevronLeft,
  Scale,
  Gavel,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';

export default function TermsOfService() {
  return (
    <div className="min-h-screen bg-black text-white selection:bg-purple-500/30">
      {/* Background Decoration */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]"></div>
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
            <div className="p-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
              <Scale size={20} className="text-purple-400" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-purple-400">
              Community Standards
            </span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black italic uppercase tracking-tighter leading-none mb-6">
            Terms of <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
              Service
            </span>
          </h1>
          <p className="text-gray-500 text-sm font-medium">
            Last Updated: March 2024
          </p>
        </header>

        {/* Content */}
        <div className="space-y-12">
          {/* Section 1: Acceptance */}
          <section className="relative p-8 bg-white/5 border border-white/10 rounded-[2.5rem] backdrop-blur-md">
            <h2 className="text-xl font-black italic uppercase tracking-wider mb-4 flex items-center gap-3">
              <ShieldCheck className="text-blue-400" size={24} />
              1. Penerimaan Ketentuan
            </h2>
            <p className="text-gray-400 leading-relaxed text-sm">
              Dengan mengakses website Nismara Racing atau bergabung ke dalam
              server kami (Assetto Corsa, ETS2, ATS, MSFS), Anda setuju untuk
              terikat oleh Ketentuan Layanan ini. Sebagai bagian dari{' '}
              <span className="text-white">Nismara Group</span>, kepatuhan
              terhadap aturan komunitas adalah mutlak demi kenyamanan bersama.
            </p>
          </section>

          {/* Section 2: Racing Rules */}
          <section className="grid md:grid-cols-2 gap-8">
            <div className="p-8 border border-white/5 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent">
              <h3 className="text-sm font-black uppercase tracking-widest text-blue-400 mb-4 flex items-center gap-2">
                <Gavel size={16} /> Code of Conduct
              </h3>
              <ul className="space-y-4 text-xs text-gray-400 leading-relaxed">
                <li>
                  <strong className="text-gray-200">Sportmanship:</strong>{' '}
                  Menjunjung tinggi sportivitas di dalam maupun di luar lintasan
                  balap.
                </li>
                <li>
                  <strong className="text-gray-200">No Harassment:</strong>{' '}
                  Larangan keras terhadap segala bentuk diskriminasi, bullying,
                  atau toxic behavior.
                </li>
                <li>
                  <strong className="text-gray-200">Cheating:</strong>{' '}
                  Penggunaan modifikasi ilegal atau cheat akan berakibat ban
                  permanen dari seluruh ekosistem Nismara Group.
                </li>
              </ul>
            </div>

            <div className="p-8 border border-white/5 rounded-[2rem] bg-gradient-to-b from-white/5 to-transparent">
              <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-4 flex items-center gap-2">
                <AlertCircle size={16} /> Virtual Company Assets
              </h3>
              <ul className="space-y-4 text-xs text-gray-400 leading-relaxed">
                <li>
                  <strong className="text-gray-200">
                    Intellectual Property:
                  </strong>{' '}
                  Seluruh livery, logo, dan konten media Nismara Group adalah
                  milik kami dan tidak boleh digunakan tanpa izin.
                </li>
                <li>
                  <strong className="text-gray-200">Mod Distribution:</strong>{' '}
                  Dilarang menyebarluaskan mod privat milik komunitas kepada
                  pihak eksternal.
                </li>
              </ul>
            </div>
          </section>

          {/* Section 3: Liability */}
          <section className="space-y-6 px-4">
            <h2 className="text-xl font-black italic uppercase tracking-wider pl-4 border-l-2 border-purple-500">
              3. Batasan Tanggung Jawab
            </h2>
            <div className="text-gray-400 text-sm leading-relaxed space-y-4">
              <p>
                Nismara Racing tidak bertanggung jawab atas kegagalan teknis,
                kehilangan data pada pihak ketiga (seperti Steam atau Discord),
                atau konflik antar member di luar platform resmi kami.
              </p>
              <p>
                Kami berhak untuk mengubah, menangguhkan, atau menghentikan
                akses member ke server kami kapan saja jika ditemukan
                pelanggaran terhadap{' '}
                <span className="text-white italic">Community Standards</span>{' '}
                yang telah ditetapkan oleh manajemen{' '}
                <span className="text-white">Nismara Group</span>.
              </p>
            </div>
          </section>

          {/* Footer of Content */}
          <div className="pt-12 border-t border-white/5 text-center">
            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.5em]">
              Drive Fast, Drive Fair — Nismara Racing
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
