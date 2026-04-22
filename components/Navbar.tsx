'use client';

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
  Zap,
  Sun, // Tambahkan ini
  Moon, // Tambahkan ini
} from 'lucide-react';
import {
  DiscordIcon,
  InstagramIcon,
  YoutubeIcon,
} from '@/components/icons/social';
import { useTheme } from 'next-themes';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [mounted, setMounted] = useState(false);

  // LOGIKA TETAP SAMA SEPERTI SEBELUMNYA
  useEffect(() => {
    setMounted(true);
    let isMounted = true;

    const getUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session) {
          setUser(session.user);

          // Ambil data profile berdasarkan ID user yang sedang login
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role, username') // Ambil role untuk admin, username untuk link profile
            .eq('id', session.user.id)
            .single();

          if (profileData) {
            setProfile(profileData); // Simpan data profile ke state

            // Cek Admin
            if (
              profileData.role === 'admin' ||
              profileData.role === 'moderator'
            ) {
              setIsAdmin(true);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching user:', error);
      }
    };

    getUserData();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
          setIsAdmin(false);
        }
      },
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    setIsMobileMenuOpen(false);
  };

  // Mencegah hydration mismatch
  if (!mounted) return null;

  return (
    <nav className="fixed top-0 w-full z-[100] glass transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo Section */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-600 to-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Zap size={18} className="text-white fill-white" />
          </div>
          <span className="font-black italic text-xl tracking-tighter uppercase">
            NISMARA<span className="text-[var(--accent)]">RACING</span>
          </span>
        </Link>

        {/* Desktop Links (UI Only Change) */}
        <div className="hidden lg:flex items-center gap-2 bg-white/5 p-1.5 rounded-2xl border border-[var(--glass-border)]">
          <NavLink href="/" active={pathname === '/'}>
            Home
          </NavLink>
          <NavLink href="/servers" active={pathname === '/servers'}>
            Servers
          </NavLink>
          <NavLink href="/events" active={pathname === '/events'}>
            Events
          </NavLink>
          <NavLink href="/leaderboard" active={pathname === '/leaderboard'}>
            Standings
          </NavLink>
          <NavLink href="/cars" active={pathname === '/cars'}>
            Vehicles
          </NavLink>
          <NavLink href="/tracks" active={pathname === '/tracks'}>
            Tracks
          </NavLink>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2.5 rounded-xl bg-white/5 border border-[var(--glass-border)] hover:border-[var(--accent)] transition-all"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? (
              <Sun size={18} className="text-yellow-400" />
            ) : (
              <Moon size={18} className="text-blue-500" />
            )}
          </button>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="p-2.5 text-[var(--accent)] bg-[var(--accent-glow)] rounded-xl transition-all border border-transparent hover:border-[var(--accent)]"
                  >
                    <LayoutDashboard size={18} />
                  </Link>
                )}
                <Link
                  href={`/profile/${profile?.username}`}
                  className="w-10 h-10 rounded-full border-2 border-[var(--accent)] p-0.5 overflow-hidden transition-transform hover:scale-105"
                >
                  <img
                    src={
                      profile?.avatar_url ||
                      user.user_metadata?.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.id}`
                    }
                    alt="profile"
                    className="w-full h-full rounded-full object-cover shadow-md"
                  />
                </Link>
                <button
                  onClick={handleLogout}
                  className="p-2.5 text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all"
              >
                Login
              </Link>
            )}
          </div>

          {/* Hamburger Mobile */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-[var(--muted)]"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-16 left-0 w-full glass border-t border-[var(--glass-border)] animate-in slide-in-from-top duration-300">
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <MobileNavLink
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Home
              </MobileNavLink>
              <MobileNavLink
                href="/events"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Events
              </MobileNavLink>
              <MobileNavLink
                href="/leaderboard"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Standings
              </MobileNavLink>
              <MobileNavLink
                href="/cars"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Vehicles
              </MobileNavLink>
              <MobileNavLink
                href="/tracks"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Tracks
              </MobileNavLink>
              <MobileNavLink
                href="/servers"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Servers
              </MobileNavLink>
            </div>

            <div className="pt-6 border-t border-[var(--glass-border)] flex flex-col gap-3">
              {user ? (
                <>
                  <Link
                    href={`/profile/${user.user_metadata?.username}`}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl font-bold uppercase text-[10px] tracking-widest text-[var(--foreground)]"
                  >
                    <User size={18} /> My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 bg-red-500/10 text-red-500 rounded-xl font-bold uppercase text-[10px] tracking-widest"
                  >
                    <LogOut size={18} /> Logout
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 bg-[var(--accent)] text-white rounded-xl font-bold justify-center uppercase text-[10px] tracking-widest"
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

// Sub-components untuk konsistensi CSS
function NavLink({ href, children, active }: any) {
  return (
    <Link
      href={href}
      className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
        active
          ? 'bg-[var(--accent)] text-white shadow-lg shadow-purple-500/30'
          : 'text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-white/5'
      }`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, children, onClick }: any) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="px-4 py-3 bg-white/5 border border-[var(--glass-border)] rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--muted)] text-center transition-active active:bg-[var(--accent)] active:text-white"
    >
      {children}
    </Link>
  );
}
