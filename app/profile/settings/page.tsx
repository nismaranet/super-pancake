'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Fingerprint,
  Save,
  ChevronLeft,
  User,
  IdCard,
  Camera,
  Monitor,
  HelpCircle,
  ExternalLink,
  AlertTriangle, // Import ikon Alert
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();

  // Data States
  const [userId, setUserId] = useState('');
  const [originalUsername, setOriginalUsername] = useState(''); // State untuk mendeteksi perubahan username
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [steamGuid, setSteamGuid] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Toggles
  const [showSteamTutorial, setShowSteamTutorial] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      setUserId(session.user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('username, display_name, steam_guid, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setUsername(data.username || '');
        setOriginalUsername(data.username || ''); // Simpan username asli saat load
        setDisplayName(data.display_name || '');
        setSteamGuid(data.steam_guid || '');
        setAvatarUrl(data.avatar_url || '');
      }
      setLoading(false);
    }
    fetchProfile();
  }, [router]);

  // --- FUNGSI UPLOAD FOTO ---
  const uploadAvatar = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setErrorMsg('');

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Pilih gambar terlebih dahulu.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);

      setAvatarUrl(data.publicUrl);
      setSuccessMsg(
        'Foto profil berhasil diunggah! Jangan lupa klik Save Configuration.',
      );

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal mengunggah foto.');
    } finally {
      setUploading(false);
    }
  };

  // --- FUNGSI SAVE SETTINGS ---
  const handleSave = async () => {
    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    const cleanUser = username.trim().toLowerCase().replace(/\s+/g, '');
    const cleanDisplay = displayName.trim();
    const cleanSteam = steamGuid.trim() || null;

    if (cleanUser.length < 3)
      return throwError('Username minimal 3 karakter tanpa spasi.');
    if (cleanDisplay.length < 3)
      return throwError('Display Name minimal 3 karakter.');
    if (cleanSteam && !/^[0-9]{17}$/.test(cleanSteam))
      return throwError(
        'Steam GUID harus berupa 17 digit angka (SteamID64) atau kosongkan saja.',
      );

    try {
      let query = `username.eq.${cleanUser},display_name.eq.${cleanDisplay}`;
      if (cleanSteam) query += `,steam_guid.eq.${cleanSteam}`;

      const { data: duplicate } = await supabase
        .from('profiles')
        .select('username, display_name, steam_guid')
        .or(query)
        .not('id', 'eq', userId)
        .maybeSingle();

      if (duplicate) {
        if (duplicate.username === cleanUser)
          return throwError('Username sudah dipakai.');
        if (duplicate.display_name === cleanDisplay)
          return throwError('Display Name sudah dipakai.');
        if (cleanSteam && duplicate.steam_guid === cleanSteam)
          return throwError('Steam GUID sudah terdaftar di akun lain.');
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          username: cleanUser,
          display_name: cleanDisplay,
          steam_guid: cleanSteam,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setSuccessMsg('Pengaturan Profil Berhasil Disimpan!');
      setUsername(cleanUser);
      setOriginalUsername(cleanUser); // Update original username setelah save berhasil (supaya warning hilang)
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err: any) {
      setErrorMsg('Gagal menyimpan profil. Coba lagi nanti.');
    } finally {
      setSaving(false);
    }
  };

  const throwError = (msg: string) => {
    setErrorMsg(msg);
    setSaving(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-purple-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-current"></div>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto px-6 py-20 text-white">
      <Link
        href={`/profile`}
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-8 transition font-bold uppercase text-[10px] tracking-widest"
      >
        <ChevronLeft size={16} /> Back to Profile
      </Link>

      <div className="bg-white/5 border border-white/10 p-8 md:p-12 rounded-[3rem] backdrop-blur-xl shadow-2xl">
        <h1 className="text-3xl md:text-4xl font-black italic uppercase mb-10 flex items-center gap-4">
          <Fingerprint className="text-purple-500" size={36} /> Driver Settings
        </h1>

        {/* Notifikasi */}
        {errorMsg && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-2xl text-sm font-bold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-2xl text-sm font-bold">
            {successMsg}
          </div>
        )}

        <div className="space-y-12">
          {/* SECTION 1: PUBLIC PROFILE */}
          <section>
            <h3 className="text-sm font-black uppercase tracking-widest text-purple-400 mb-6 border-b border-white/5 pb-2">
              Public Identity
            </h3>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-4 shrink-0">
                <div className="relative group w-32 h-32 rounded-[2rem] overflow-hidden border-2 border-white/10">
                  <img
                    src={
                      avatarUrl ||
                      'https://api.dicebear.com/7.x/avataaars/svg?seed=driver'
                    }
                    className="w-full h-full object-cover"
                    alt="Avatar"
                  />

                  {/* Upload Overlay */}
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="cursor-pointer flex flex-col items-center">
                      {uploading ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-white"></div>
                      ) : (
                        <>
                          <Camera size={24} className="text-white mb-1" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-white">
                            Change
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={uploadAvatar}
                            disabled={uploading}
                          />
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <p className="text-[9px] text-gray-500 uppercase font-bold tracking-widest">
                  Profile Photo
                </p>
              </div>

              {/* Text Inputs */}
              <div className="flex-1 space-y-6 w-full">
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-1 mb-2 block tracking-widest">
                    Username (No Spaces)
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-4 text-purple-500"
                      size={18}
                    />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-white focus:border-purple-500 outline-none transition"
                      placeholder="nismara_racer"
                    />
                  </div>

                  {/* --- WARNING URL BERUBAH (HANYA MUNCUL JIKA USERNAME DIUBAH) --- */}
                  {username !== originalUsername && (
                    <div className="mt-3 flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                      <AlertTriangle
                        size={18}
                        className="text-orange-500 shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-400 mb-1">
                          Peringatan Perubahan URL
                        </p>
                        <p className="text-xs text-orange-300/80 font-medium leading-relaxed">
                          Kamu akan mengubah URL profil publikmu. Tautan lama
                          tidak akan berfungsi lagi. Profil barumu akan dapat
                          diakses melalui:
                          <br />
                          <span className="font-bold text-orange-300 mt-2 block">
                            nismara.com/profile/
                            {username
                              .trim()
                              .toLowerCase()
                              .replace(/\s+/g, '') || '...'}
                          </span>
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase text-gray-500 ml-1 mb-2 block tracking-widest">
                    Display Name
                  </label>
                  <div className="relative">
                    <IdCard
                      className="absolute left-4 top-4 text-blue-500"
                      size={18}
                    />
                    <input
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-white focus:border-blue-500 outline-none transition"
                      placeholder="Max Verstappen"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* SECTION 2: GAME INTEGRATION */}
          <section>
            <h3 className="text-sm font-black uppercase tracking-widest text-green-400 mb-6 border-b border-white/5 pb-2">
              Game Integration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-gray-500 ml-1 mb-2 flex justify-between items-end tracking-widest">
                  <span>Steam GUID (SteamID64)</span>
                  <button
                    onClick={() => setShowSteamTutorial(!showSteamTutorial)}
                    className="text-blue-400 flex items-center gap-1 hover:text-blue-300"
                  >
                    <HelpCircle size={12} /> How to find?
                  </button>
                </label>
                <div className="relative">
                  <Monitor
                    className="absolute left-4 top-4 text-green-500"
                    size={18}
                  />
                  <input
                    type="text"
                    value={steamGuid}
                    onChange={(e) => setSteamGuid(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 p-4 pl-12 rounded-2xl text-green-400 font-mono focus:border-green-500 outline-none transition placeholder:text-green-900/50"
                    placeholder="7656119xxxxxxxxxx"
                  />
                </div>
              </div>

              {/* STEAM GUID TUTORIAL */}
              {showSteamTutorial && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-sm text-blue-100/80 animate-in fade-in slide-in-from-top-4">
                  <h4 className="font-black italic text-blue-400 uppercase mb-3 flex items-center gap-2">
                    <HelpCircle size={16} /> Cara Menemukan Steam GUID
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-[11px] font-medium leading-relaxed">
                    <li>
                      Buka aplikasi Steam atau website Steam di browser kamu.
                    </li>
                    <li>
                      Pergi ke halaman <strong>Profile</strong> kamu.
                    </li>
                    <li>
                      Jika URL kamu belum di-custom, kamu akan melihat angka 17
                      digit di link browser: <br />{' '}
                      <code className="bg-black/40 text-blue-300 p-1 rounded mt-1 inline-block">
                        steamcommunity.com/profiles/
                        <strong>76561198xxxxxxxxx</strong>
                      </code>
                    </li>
                    <li>Angka 17 digit itulah Steam GUID (SteamID64) kamu.</li>
                    <li className="pt-2">
                      <strong>Cara Alternatif:</strong> Jika kamu menggunakan
                      custom URL, copy link profile Steam kamu, lalu paste di
                      website seperti{' '}
                      <a
                        href="https://steamid.io/"
                        target="_blank"
                        rel="noreferrer"
                        className="text-white font-bold underline inline-flex items-center gap-1"
                      >
                        steamid.io <ExternalLink size={10} />
                      </a>{' '}
                      untuk melihat <strong>steamID64</strong>.
                    </li>
                  </ol>
                </div>
              )}
            </div>
          </section>

          {/* ACTION BUTTON */}
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="w-full flex justify-center items-center gap-3 py-5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-2xl font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-purple-500/25 active:scale-[0.98] disabled:opacity-50"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
            ) : (
              <>
                <Save size={20} /> Save Configuration
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
