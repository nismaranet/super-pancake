'use client';

// ... (semua import tetap sama) ...
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  LogIn,
  LogOut,
  LayoutDashboard,
  Home,
  Calendar,
  Gamepad2,
  Car,
  MapPin,
  Server,
  Menu,
  X,
  User,
} from 'lucide-react';
import {
  DiscordIcon,
  InstagramIcon,
  YoutubeIcon,
} from '@/components/icons/social';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State untuk menyimpan data user dan status admin
  const [user, setUser] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Flag untuk mencegah update state jika komponen di-unmount
    let isMounted = true;

    // Fungsi asinkronus untuk mengambil data
    const getUserData = async () => {
      try {
        // 1. Ambil sesi saat ini
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session && session.user) {
          setUser(session.user);

          // 2. Ambil profile untuk mengecek role
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single();

          if (isMounted) {
            if (profile && profile.role === 'admin') {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          }
        } else {
          // Reset jika tidak ada sesi
          setUser(null);
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    // Jalankan pengecekan pertama kali
    getUserData();

    // Set up listener untuk perubahan auth (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      if (event === 'SIGNED_IN' && session) {
        setUser(session.user);

        // Cek role saat login
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();

        if (isMounted) {
          setIsAdmin(profile?.role === 'admin');
        }
      } else if (event === 'SIGNED_OUT') {
        // Reset saat logout
        setUser(null);
        setIsAdmin(false);
      }
    });

    // Fungsi cleanup
    return () => {
      isMounted = false; // Tandai komponen sudah di-unmount
      subscription.unsubscribe(); // Hapus listener auth
    };
  }, []); // Array dependensi kosong agar hanya jalan sekali saat mount

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsMobileMenuOpen(false);
    router.push('/login');
    router.refresh(); // Refresh untuk membersihkan state router
  };

  const navLinks = [
    { href: '/', label: 'Home', icon: <Home size={16} /> },
    { href: '/events', label: 'Events', icon: <Calendar size={16} /> },
    { href: '/cars', label: 'Cars', icon: <Car size={16} /> },
    { href: '/tracks', label: 'Circuits', icon: <MapPin size={16} /> },
    { href: '/servers', label: 'Servers', icon: <Server size={16} /> },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur-md border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Kontainer flexbox utama untuk baris navigasi */}
        <div className="flex justify-between items-center h-16">
          {/* Bagian kiri: Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Gamepad2 className="text-blue-500" size={24} />
            <span className="font-black italic text-xl text-white uppercase tracking-tighter">
              Nismara Racing<span className="text-blue-500">.</span>
            </span>
          </Link>

          {/* Bagian kanan: Sosial, Auth, dan Tombol Mobile */}
          <div className="flex justify-between items-center gap-30">
            {/* Desktop Nav Links (hidden on mobile) */}
            <div className="hidden md:flex space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.href}
                  href={link.href}
                  icon={link.icon}
                  active={pathname === link.href}
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Right Section (Socials & Auth) */}
            <div className="hidden md:flex items-center gap-4">
              <div className="flex items-center gap-3">
                <SocialIcon
                  href="https://link.nismara.web.id/discord"
                  icon={<DiscordIcon />}
                  color="hover:text-[#5865F2]"
                />
                <SocialIcon
                  href="https://link.nismara.web.id/instagram"
                  icon={<InstagramIcon />}
                  color="hover:text-[#E4405F]"
                />
                <SocialIcon
                  href="https://link.nismara.web.id/youtube"
                  icon={<YoutubeIcon />}
                  color="hover:text-[#FF0000]"
                />
              </div>
              {/* User Actions */}
              <div className="h-4 w-[1px] bg-gray-800" /> {/* Divider */}
              {user ? (
                <div className="flex items-center gap-3">
                  {isAdmin && (
                    <Link
                      href="/admin"
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <LayoutDashboard size={20} />
                    </Link>
                  )}
                  <Link
                    href="/profile"
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <User size={20} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white bg-blue-600 px-4 py-2 rounded-full hover:bg-blue-700 transition-all"
                >
                  <LogIn size={14} />
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button - Sekarang di dalam kontainer flex utama */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-400 hover:text-white focus:outline-none"
              >
                {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>{' '}
        {/* <-- Sekarang ini menutup h-16 dengan benar */}
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 border-t border-gray-800">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                  pathname === link.href
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}

            <div className="pt-4 border-t border-gray-800 flex flex-col gap-2">
              {user ? (
                <>
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white"
                    >
                      <LayoutDashboard size={18} /> Dashboard Admin
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 text-red-500 font-bold"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold justify-center"
                >
                  <LogIn size={18} /> Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

// ... (helpers `NavLink` dan `SocialIcon` tetap sama) ...
function NavLink({ href, children, icon, active }: any) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-2 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
        active
          ? 'bg-blue-600 text-white shadow-lg'
          : 'text-gray-400 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

function SocialIcon({ href, icon, color }: any) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`text-gray-400 transition-colors ${color}`}
    >
      {icon}
    </a>
  );
}
