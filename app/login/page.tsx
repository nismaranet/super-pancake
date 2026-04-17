'use client';

import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import {
  Zap,
  ShieldCheck,
  AlertTriangle,
  User,
  IdCard,
  ArrowRight,
  Monitor,
  LogOut,
} from 'lucide-react';

const NISMARA_GUILD_ID = '863959415702028318';

export default function LoginPage() {
  const router = useRouter();
  const isVerifying = useRef(false);

  const [step, setStep] = useState<
    'login' | 'checking' | 'denied' | 'onboarding'
  >('login');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [steamGuid, setSteamGuid] = useState(''); // Opsional
  const [sessionData, setSessionData] = useState<any>(null);

  useEffect(() => {
    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) verifyUserAccess(session);
    };
    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === 'SIGNED_IN' && session) verifyUserAccess(session);
      },
    );

    return () => authListener.subscription.unsubscribe();
  }, []);

  const verifyUserAccess = async (session: any) => {
    if (isVerifying.current) return;
    isVerifying.current = true;

    setStep('checking');
    setSessionData(session);

    try {
      // 1. CEK DISCORD MEMBERSHIP
      if (session.provider_token) {
        const guildRes = await fetch(
          'https://discord.com/api/users/@me/guilds',
          {
            headers: { Authorization: `Bearer ${session.provider_token}` },
          },
        );

        if (guildRes.ok) {
          const guilds = await guildRes.json();
          const isMember = guilds.some(
            (guild: any) => guild.id === NISMARA_GUILD_ID,
          );

          if (!isMember) {
            setStep('denied');
            await supabase.auth.signOut();
            isVerifying.current = false;
            return;
          }
        }
      }

      // 2. CEK KELENGKAPAN DATA PROFIL
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('username, display_name, steam_guid')
        .eq('id', session.user.id)
        .maybeSingle();

      if (error) throw error;

      // Pengecekan: Hanya Username dan Display Name yang WAJIB di awal
      const isMissingCriticalData =
        !profile || !profile.username || !profile.display_name;

      if (isMissingCriticalData) {
        const discordName =
          session.user.user_metadata?.full_name ||
          session.user.user_metadata?.name ||
          '';
        const suggestedUser = discordName
          .replace(/\s+/g, '')
          .toLowerCase()
          .substring(0, 20);

        setUsername((prev) => prev || suggestedUser);
        setDisplayName((prev) => prev || discordName.substring(0, 30));
        setStep('onboarding');
      } else {
        router.push('/'); // Hanya ke home jika data kritis sudah ada
      }
    } catch (err: any) {
      console.error('Verification Error:', err);
      setErrorMsg('Gagal memverifikasi akun.');
      setStep('login');
    } finally {
      isVerifying.current = false;
    }
  };

  const handleCancel = async () => {
    await supabase.auth.signOut();
    setStep('login');
    window.location.reload();
  };

  const handleOnboardingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanDisplay = displayName.trim();
    const cleanSteam = steamGuid.trim() || null; // Jika kosong, set NULL

    // Validasi Steam GUID hanya jika diisi
    if (cleanSteam && !/^[0-9]{17}$/.test(cleanSteam)) {
      setErrorMsg('Steam GUID harus 17 digit atau kosongkan saja dahulu.');
      setLoading(false);
      return;
    }

    try {
      // Pengecekan Duplikat (Hanya jika data diisi)
      let query = `username.eq.${cleanUser},display_name.eq.${cleanDisplay}`;
      if (cleanSteam) query += `,steam_guid.eq.${cleanSteam}`;

      const { data: duplicate } = await supabase
        .from('profiles')
        .select('username, display_name, steam_guid')
        .or(query)
        .not('id', 'eq', sessionData.user.id)
        .maybeSingle();

      if (duplicate) {
        if (duplicate.username === cleanUser)
          setErrorMsg('Username sudah digunakan.');
        else if (duplicate.display_name === cleanDisplay)
          setErrorMsg('Display Name sudah digunakan.');
        else if (cleanSteam && duplicate.steam_guid === cleanSteam)
          setErrorMsg('Steam GUID sudah terdaftar.');
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: cleanUser,
          display_name: cleanDisplay,
          steam_guid: cleanSteam,
          updated_at: new Date().toISOString(),
        })
        .eq('id', sessionData.user.id);

      if (error) throw error;
      router.push('/');
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan profil.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-transparent relative overflow-hidden">
      <div className="max-w-md w-full relative z-10">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl">
          {step === 'onboarding' ? (
            <div className="text-left animate-in fade-in duration-500">
              <h2 className="text-2xl font-black text-white uppercase mb-2 italic text-center">
                Driver Setup
              </h2>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest text-center mb-6">
                Lengkapi identitas balapmu
              </p>

              {errorMsg && (
                <p className="text-red-400 text-[10px] font-bold mb-4 bg-red-400/10 p-2 rounded-lg border border-red-400/20">
                  {errorMsg}
                </p>
              )}

              <form onSubmit={handleOnboardingSubmit} className="space-y-4">
                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase ml-2 tracking-widest">
                    Username *
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-3 text-purple-500"
                      size={16}
                    />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl pl-11 pr-4 py-3 outline-none focus:border-purple-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase ml-2 tracking-widest">
                    Display Name *
                  </label>
                  <div className="relative">
                    <IdCard
                      className="absolute left-4 top-3 text-blue-500"
                      size={16}
                    />
                    <input
                      type="text"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 text-white text-sm rounded-xl pl-11 pr-4 py-3 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black text-gray-500 uppercase ml-2 tracking-widest text-white/30 italic">
                    Steam GUID (Optional)
                  </label>
                  <div className="relative">
                    <Monitor
                      className="absolute left-4 top-3 text-green-500/50"
                      size={16}
                    />
                    <input
                      type="text"
                      value={steamGuid}
                      onChange={(e) => setSteamGuid(e.target.value)}
                      className="w-full bg-black/20 border border-white/10 text-white/50 text-sm rounded-xl pl-11 pr-4 py-3 outline-none"
                      placeholder="Isi nanti di profil jika belum ada"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
                  >
                    <LogOut size={14} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-[2] bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Finish Setup'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="text-center">
              <div className="mb-8 flex justify-center">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-3xl shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-500">
                  <Zap size={32} className="text-white" fill="white" />
                </div>
              </div>

              {step === 'login' && (
                <>
                  <h1 className="text-3xl font-black italic text-white uppercase tracking-tighter mb-10">
                    Nismara <span className="text-blue-500">Hub</span>
                  </h1>
                  <button
                    onClick={() => {
                      setLoading(true);
                      supabase.auth.signInWithOAuth({
                        provider: 'discord',
                        options: {
                          scopes: 'identify email guilds',
                          redirectTo: `${window.location.origin}/auth/callback?next=/login`,
                        },
                      });
                    }}
                    className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-4 rounded-2xl font-black uppercase tracking-widest transition-all"
                  >
                    Login with Discord
                  </button>
                </>
              )}

              {step === 'checking' && (
                <div className="py-10">
                  <div className="w-10 h-10 mx-auto border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4" />
                  <h2 className="text-xs font-black text-white uppercase tracking-widest">
                    Checking Driver Profile...
                  </h2>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
