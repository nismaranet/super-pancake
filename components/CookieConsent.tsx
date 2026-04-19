'use client';

import { useState, useEffect } from 'react';
import { Cookie, X, Zap, ChevronLeft } from 'lucide-react';
import Link from 'next/link';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('nismara_cookies_accepted');
    if (!consent) {
      setShouldRender(true);
      // Kasih sedikit delay supaya animasi transisinya kelihatan saat muncul
      setTimeout(() => setIsVisible(true), 100);
    }
  }, []);

  const handleAccept = () => {
    setIsVisible(false);
    // Tunggu animasi selesai baru hapus dari DOM
    setTimeout(() => {
      localStorage.setItem('nismara_cookies_accepted', 'true');
      setShouldRender(false);
    }, 500);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed bottom-6 left-6 right-6 md:left-auto md:max-w-md z-[100] transition-all duration-700 ease-out transform ${
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0'
      }`}
    >
      <div className="bg-[var(--glass-bg)] backdrop-blur-xl border border-[var(--glass-border)] p-6 rounded-3xl shadow-2xl shadow-purple-500/10 relative overflow-hidden group">
        {/* Background Glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-[var(--accent)] opacity-10 blur-3xl rounded-full"></div>

        <div className="flex items-start gap-4 relative z-10">
          <div className="bg-gradient-to-br from-blue-600 to-[var(--accent)] p-3 rounded-2xl text-white shadow-lg shadow-purple-500/20">
            <Cookie size={22} />
          </div>

          <div className="flex-1">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--foreground)] mb-1 flex items-center gap-2">
              Cookie Policy{' '}
              <Zap size={10} className="text-blue-500 fill-blue-500" />
            </h3>
            <p className="text-[10px] md:text-xs text-[var(--muted)] font-medium leading-relaxed mb-4">
              We use cookies to boost your experience in{' '}
              <span className="text-[var(--accent)] font-bold">
                Nismara Racing
              </span>
              . By clicking accept, you're ready to hit the track with us.
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleAccept}
                className="flex-1 bg-gradient-to-r from-blue-600 to-[var(--accent)] hover:opacity-90 text-white text-[10px] font-black uppercase tracking-widest py-3 rounded-xl transition-all shadow-md active:scale-95"
              >
                Accept All
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="px-4 py-3 border border-[var(--card-border)] hover:bg-white/5 text-[var(--muted)] text-[10px] font-black uppercase tracking-widest rounded-xl transition-all"
              >
                Decline
              </button>
            </div>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="text-[var(--muted)] hover:text-[var(--foreground)] transition-colors p-1"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
