'use client';

import { useEffect, useState, useRef } from 'react';
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
  AlertTriangle,
  Image as ImageIcon,
  Type,
  Bold,
  Italic,
  Link as LinkIcon,
} from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();

  // Data States
  const [userId, setUserId] = useState('');
  const [originalUsername, setOriginalUsername] = useState('');
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [steamGuid, setSteamGuid] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [bio, setBio] = useState('');

  // Loading States
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Toggles
  const [showSteamTutorial, setShowSteamTutorial] = useState(false);

  // Ref for Bio Textarea to handle Markdown insertion
  const bioInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    async function fetchProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return router.push('/login');

      setUserId(session.user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select(
          'username, display_name, steam_guid, avatar_url, banner_url, bio',
        )
        .eq('id', session.user.id)
        .single();

      if (data) {
        setUsername(data.username || '');
        setOriginalUsername(data.username || '');
        setDisplayName(data.display_name || '');
        setSteamGuid(data.steam_guid || '');
        setAvatarUrl(data.avatar_url || '');
        setBannerUrl(data.banner_url || '');
        setBio(data.bio || '');
      }
      setLoading(false);
    }
    fetchProfile();
  }, [router]);

  // --- FUNGSI UPLOAD KE CLOUDFLARE R2 ---
  const uploadToR2 = async (file: File, folder: string) => {
    // 1. Dapatkan Presigned URL dari route.ts kita
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        folder: folder,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to get upload URL');

    // 2. Upload langsung ke R2 menggunakan Presigned URL
    const uploadRes = await fetch(data.signedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    if (!uploadRes.ok) throw new Error('Failed to upload file');

    return data.publicUrl;
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    type: 'avatar' | 'banner',
  ) => {
    try {
      if (type === 'avatar') setUploadingAvatar(true);
      else setUploadingBanner(true);

      setErrorMsg('');

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('Pilih gambar terlebih dahulu.');
      }

      const file = event.target.files[0];

      // Validasi Ukuran (Max 4MB)
      if (file.size > 4 * 1024 * 1024)
        throw new Error('Ukuran gambar maksimal 4MB.');

      // Gunakan fungsi Upload R2 (folder 'avatars' atau 'banners')
      const publicUrl = await uploadToR2(
        file,
        type === 'avatar' ? 'avatars' : 'banners',
      );

      if (type === 'avatar') {
        setAvatarUrl(publicUrl);
        setSuccessMsg('Foto profil berhasil diunggah!');
      } else {
        setBannerUrl(publicUrl);
        setSuccessMsg('Banner profil berhasil diunggah!');
      }

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (error: any) {
      setErrorMsg(error.message || 'Gagal mengunggah foto.');
    } finally {
      if (type === 'avatar') setUploadingAvatar(false);
      else setUploadingBanner(false);
    }
  };

  // --- FUNGSI MARKDOWN UNTUK BIO ---
  const insertMarkdown = (prefix: string, suffix: string = '') => {
    if (!bioInputRef.current) return;
    const textarea = bioInputRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = bio.substring(start, end);

    const newText =
      bio.substring(0, start) +
      prefix +
      selectedText +
      suffix +
      bio.substring(end);

    if (newText.length <= 200) {
      setBio(newText);
      // Pindahkan kursor setelah update state
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + prefix.length, end + prefix.length);
      }, 0);
    } else {
      setErrorMsg(
        'Bio tidak boleh melebihi 200 karakter dengan penambahan format ini.',
      );
      setTimeout(() => setErrorMsg(''), 3000);
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
    const cleanBio = bio.trim();

    if (cleanUser.length < 3)
      return throwError('Username minimal 3 karakter tanpa spasi.');
    if (cleanDisplay.length < 3)
      return throwError('Display Name minimal 3 karakter.');
    if (cleanBio.length > 200) return throwError('Bio maksimal 200 karakter.');
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
          banner_url: bannerUrl,
          bio: cleanBio,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      setSuccessMsg('Pengaturan Profil Berhasil Disimpan!');
      setUsername(cleanUser);
      setOriginalUsername(cleanUser);
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
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-[var(--accent)]"></div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto px-6 py-20 text-[var(--foreground)] transition-colors duration-300">
      <Link
        href={`/profile/${username}`}
        className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] mb-8 transition font-bold uppercase text-[10px] tracking-widest"
      >
        <ChevronLeft size={16} /> Back to Profile
      </Link>

      <div className="bg-[var(--card)] border border-[var(--card-border)] p-8 md:p-12 rounded-[3rem] shadow-2xl">
        <h1 className="text-3xl md:text-4xl font-black italic uppercase mb-10 flex items-center gap-4 text-[var(--foreground)]">
          <Fingerprint className="text-[var(--accent)]" size={36} /> Driver
          Settings
        </h1>

        {/* Notifikasi */}
        {errorMsg && (
          <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-2xl text-sm font-bold">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-8 p-4 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl text-sm font-bold">
            {successMsg}
          </div>
        )}

        <div className="space-y-12">
          {/* SECTION 1: PUBLIC IDENTITY & MEDIA */}
          <section>
            <h3 className="text-sm font-black uppercase tracking-widest text-[var(--accent)] mb-6 border-b border-[var(--card-border)] pb-2">
              Public Identity
            </h3>

            {/* Banner Upload */}
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase text-[var(--muted)] ml-1 mb-2 block tracking-widest">
                Profile Banner
              </label>
              <div className="relative group w-full h-40 md:h-56 rounded-3xl overflow-hidden border-2 border-[var(--card-border)] bg-[var(--background)]">
                <img
                  src={
                    bannerUrl ||
                    'https://images.unsplash.com/photo-1547038577-c866986e2eb9?q=80&w=2000&auto=format&fit=crop'
                  }
                  className="w-full h-full object-cover opacity-80"
                  alt="Banner"
                />
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <label className="cursor-pointer flex flex-col items-center p-4 bg-[var(--glass-bg)] backdrop-blur-md rounded-2xl border border-[var(--glass-border)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-white transition-colors">
                    {uploadingBanner ? (
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-current"></div>
                    ) : (
                      <>
                        <ImageIcon size={24} className="mb-1" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          Change Banner
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, 'banner')}
                          disabled={uploadingBanner}
                        />
                      </>
                    )}
                  </label>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Photo Upload */}
              <div className="flex flex-col items-center gap-4 shrink-0 -mt-16 md:-mt-20 ml-6 relative z-10">
                <div className="relative group w-32 h-32 md:w-40 md:h-40 rounded-full overflow-hidden border-4 border-[var(--card)] bg-[var(--background)] shadow-xl">
                  <img
                    src={
                      avatarUrl ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${steamGuid || 'driver'}`
                    }
                    className="w-full h-full object-cover"
                    alt="Avatar"
                  />
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <label className="cursor-pointer flex flex-col items-center">
                      {uploadingAvatar ? (
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
                            onChange={(e) => handleFileUpload(e, 'avatar')}
                            disabled={uploadingAvatar}
                          />
                        </>
                      )}
                    </label>
                  </div>
                </div>
              </div>

              {/* Text Inputs */}
              <div className="flex-1 space-y-6 w-full pt-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-[var(--muted)] ml-1 mb-2 block tracking-widest">
                    Username (No Spaces)
                  </label>
                  <div className="relative">
                    <User
                      className="absolute left-4 top-4 text-[var(--accent)]"
                      size={18}
                    />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--card-border)] p-4 pl-12 rounded-2xl text-[var(--foreground)] focus:border-[var(--accent)] outline-none transition shadow-inner"
                      placeholder="nismara_racer"
                    />
                  </div>

                  {username !== originalUsername && (
                    <div className="mt-3 flex items-start gap-3 bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2">
                      <AlertTriangle
                        size={18}
                        className="text-orange-500 shrink-0 mt-0.5"
                      />
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-1">
                          Peringatan Perubahan URL
                        </p>
                        <p className="text-xs text-[var(--muted)] font-medium leading-relaxed">
                          Tautan lama profilmu tidak akan berfungsi lagi. Profil
                          baru dapat diakses melalui:
                          <br />
                          <span className="font-bold text-[var(--foreground)] mt-2 block">
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
                  <label className="text-[10px] font-black uppercase text-[var(--muted)] ml-1 mb-2 block tracking-widest">
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
                      className="w-full bg-[var(--background)] border border-[var(--card-border)] p-4 pl-12 rounded-2xl text-[var(--foreground)] focus:border-blue-500 outline-none transition shadow-inner"
                      placeholder="Max Verstappen"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bio Input (Rich Text / Markdown) */}
            <div className="mt-8">
              <label className="text-[10px] font-black uppercase text-[var(--muted)] ml-1 mb-2 flex justify-between tracking-widest">
                <span>Driver Bio</span>
                <span
                  className={
                    bio.length > 200 ? 'text-red-500' : 'text-[var(--muted)]'
                  }
                >
                  {bio.length}/200
                </span>
              </label>
              <div className="bg-[var(--background)] border border-[var(--card-border)] rounded-2xl overflow-hidden focus-within:border-[var(--accent)] transition-colors shadow-inner">
                {/* Formatting Toolbar */}
                <div className="flex gap-1 p-2 bg-[var(--card)] border-b border-[var(--card-border)]">
                  <button
                    onClick={() => insertMarkdown('**', '**')}
                    className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] rounded-lg transition"
                    title="Bold"
                  >
                    <Bold size={16} />
                  </button>
                  <button
                    onClick={() => insertMarkdown('*', '*')}
                    className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] rounded-lg transition"
                    title="Italic"
                  >
                    <Italic size={16} />
                  </button>
                  <div className="w-px h-6 bg-[var(--card-border)] my-auto mx-1"></div>
                  <button
                    onClick={() => insertMarkdown('[', '](https://)')}
                    className="p-2 text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--background)] rounded-lg transition"
                    title="Add Link"
                  >
                    <LinkIcon size={16} />
                  </button>
                  <div className="ml-auto flex items-center pr-2">
                    <Type size={14} className="text-[var(--muted)] mr-1" />
                    <span className="text-[9px] uppercase tracking-widest font-bold text-[var(--muted)]">
                      Markdown Supported
                    </span>
                  </div>
                </div>

                <textarea
                  ref={bioInputRef}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={200}
                  className="w-full p-4 bg-transparent text-[var(--foreground)] outline-none resize-none min-h-[100px] text-sm custom-scrollbar"
                  placeholder="I am a speed demon. Catch me if you can... **VRRROOOM**!"
                />
              </div>
            </div>
          </section>

          {/* SECTION 2: GAME INTEGRATION */}
          <section>
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-6 border-b border-[var(--card-border)] pb-2">
              Game Integration
            </h3>

            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-[var(--muted)] ml-1 mb-2 flex justify-between items-end tracking-widest">
                  <span>Steam GUID (SteamID64)</span>
                  <button
                    onClick={() => setShowSteamTutorial(!showSteamTutorial)}
                    className="text-blue-500 flex items-center gap-1 hover:text-blue-600"
                  >
                    <HelpCircle size={12} /> How to find?
                  </button>
                </label>
                <div className="relative">
                  <Monitor
                    className="absolute left-4 top-4 text-emerald-500"
                    size={18}
                  />
                  <input
                    type="text"
                    value={steamGuid}
                    onChange={(e) => setSteamGuid(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] p-4 pl-12 rounded-2xl text-emerald-500 font-mono focus:border-emerald-500 outline-none transition shadow-inner placeholder:text-emerald-500/30"
                    placeholder="7656119xxxxxxxxxx"
                  />
                </div>
              </div>

              {/* STEAM GUID TUTORIAL */}
              {showSteamTutorial && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6 text-sm text-[var(--foreground)] animate-in fade-in slide-in-from-top-4">
                  <h4 className="font-black italic text-blue-500 uppercase mb-3 flex items-center gap-2">
                    <HelpCircle size={16} /> Cara Menemukan Steam GUID
                  </h4>
                  <ol className="list-decimal list-inside space-y-2 text-[11px] font-medium leading-relaxed opacity-80">
                    <li>
                      Buka aplikasi Steam atau website Steam di browser kamu.
                    </li>
                    <li>
                      Pergi ke halaman <strong>Profile</strong> kamu.
                    </li>
                    <li>
                      Jika URL kamu belum di-custom, kamu akan melihat angka 17
                      digit di link browser: <br />
                      <code className="bg-[var(--card)] border border-[var(--card-border)] text-blue-500 p-1.5 rounded mt-1 inline-block">
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
                        className="text-blue-500 font-bold underline inline-flex items-center gap-1"
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
            disabled={saving || uploadingAvatar || uploadingBanner}
            className="w-full flex justify-center items-center gap-3 py-5 bg-[var(--accent)] hover:bg-purple-500 text-white rounded-2xl font-black uppercase tracking-widest transition-all shadow-[0_0_20px_var(--accent-glow)] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
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
