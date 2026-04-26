'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Save,
  UploadCloud,
  Shield,
  Image as ImageIcon,
  AlertTriangle,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';

export default function TeamSettingsHQ() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [myTeam, setMyTeam] = useState<any>(null);

  // Form States
  const [editName, setEditName] = useState('');
  const [editTag, setEditTag] = useState('');
  const [editUri, setEditUri] = useState('');
  const [editBio, setEditBio] = useState('');

  // File Upload States
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState('');
  const [bannerPreview, setBannerPreview] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkOwnership();
  }, []);

  const checkOwnership = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return router.push('/auth/login');

    const { data: membership } = await supabase
      .from('team_members')
      .select('role, teams(*)')
      .eq('profile_id', session.user.id)
      .eq('role', 'owner')
      .maybeSingle();

    if (membership && membership.teams) {
      // Penanganan tipe Array dari Supabase
      const team = Array.isArray(membership.teams)
        ? membership.teams[0]
        : membership.teams;

      if (team) {
        setMyTeam(team);
        setEditName(team.name || '');
        setEditTag(team.tag || '');
        setEditUri(team.uri || '');
        setEditBio(team.bio || '');
        setLogoPreview(team.logo_url || '');
        setBannerPreview(team.banner_url || '');
      } else {
        router.push('/teams');
      }
    } else {
      // Bukan owner atau tidak punya tim
      router.push('/teams');
    }
    setLoading(false);
  };

  // ================= R2 UPLOAD LOGIC =================
  const uploadToR2 = async (file: File, folder: string) => {
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder: folder,
        }),
      });

      const { signedUrl, publicUrl, error } = await res.json();
      if (error) throw new Error(error);

      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadRes.ok) throw new Error('Failed to upload to R2 storage');

      return publicUrl;
    } catch (err: any) {
      console.error(err);
      alert('Error uploading file: ' + err.message);
      return null;
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let finalLogoUrl = myTeam.logo_url;
    let finalBannerUrl = myTeam.banner_url;

    if (logoFile) {
      const url = await uploadToR2(logoFile, 'teams/logos');
      if (url) finalLogoUrl = url;
    }

    if (bannerFile) {
      const url = await uploadToR2(bannerFile, 'teams/banners');
      if (url) finalBannerUrl = url;
    }

    // Format URI agar selalu lowercase dan tanpa spasi (diganti hyphen)
    const formattedUri = editUri.toLowerCase().replace(/\s+/g, '-');

    const { error } = await supabase
      .from('teams')
      .update({
        name: editName,
        tag: editTag.toUpperCase(),
        uri: formattedUri,
        bio: editBio,
        logo_url: finalLogoUrl,
        banner_url: finalBannerUrl,
      })
      .eq('id', myTeam.id);

    if (error) {
      alert('Gagal mengupdate: ' + error.message);
    } else {
      alert('✅ Team Profile Berhasil Diperbarui!');
      router.push(`/teams/${formattedUri || myTeam.id}`);
    }

    setIsSubmitting(false);
  };

  // ================= UI HANDLERS =================
  const MAX_FILE_SIZE = 4 * 1024 * 1024;

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validasi ukuran file
      if (file.size > MAX_FILE_SIZE) {
        alert('Ukuran file Logo terlalu besar! Maksimal 4MB.');
        e.target.value = ''; // Reset input agar user bisa memilih ulang file yang sama
        return;
      }

      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validasi ukuran file
      if (file.size > MAX_FILE_SIZE) {
        alert('Ukuran file Banner terlalu besar! Maksimal 4MB.');
        e.target.value = ''; // Reset input agar user bisa memilih ulang file yang sama
        return;
      }

      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  if (loading)
    return (
      <div className="min-h-screen pt-32 text-center text-[var(--foreground)] font-black uppercase">
        Authenticating...
      </div>
    );

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Shield size={32} className="text-purple-500" />
        <h1 className="text-3xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
          HQ Settings
        </h1>
      </div>

      <form
        onSubmit={handleUpdateTeam}
        className="space-y-8 bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2.5rem] shadow-xl"
      >
        {/* IDENTITAS TIM */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">
              Team Name
            </label>
            <input
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] p-4 rounded-xl outline-none focus:border-[var(--accent)] transition-all font-bold"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1">
              Tag (Max 4 Chars)
            </label>
            <input
              required
              maxLength={4}
              value={editTag}
              onChange={(e) => setEditTag(e.target.value)}
              className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] p-4 rounded-xl outline-none focus:border-[var(--accent)] transition-all font-black uppercase tracking-widest"
            />
          </div>
        </div>

        {/* TEAM URI */}
        <div className="space-y-2 border-b border-[var(--card-border)] pb-8">
          <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
            <LinkIcon size={12} /> Team URL / URI
          </label>
          <div className="flex bg-[var(--background)] border border-[var(--card-border)] rounded-xl overflow-hidden focus-within:border-[var(--accent)] transition-all">
            <span className="px-4 py-4 text-[var(--muted)] font-medium bg-black/20 border-r border-[var(--card-border)] text-sm">
              racing.nismara.web.id/teams/
            </span>
            <input
              required
              value={editUri}
              onChange={(e) => setEditUri(e.target.value)}
              placeholder="nama-tim-keren"
              className="w-full bg-transparent text-[var(--foreground)] p-4 outline-none font-bold"
            />
          </div>
          <p className="text-[10px] text-amber-500 font-medium ml-1">
            *Mengubah URI akan merubah tautan publik tim Anda. Gunakan huruf dan
            tanda hubung (-).
          </p>
        </div>

        {/* TEAM BIO (MARKDOWN) */}
        <div className="space-y-2 border-b border-[var(--card-border)] pb-8">
          <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1 flex items-center gap-2">
            <FileText size={12} /> Team Bio (Markdown Supported)
          </label>
          <textarea
            value={editBio}
            onChange={(e) => setEditBio(e.target.value)}
            rows={6}
            placeholder="Ceritakan tentang tim Anda di sini. Mendukung styling dengan Markdown (contoh: **Tebal**, *Miring*, atau list)..."
            className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] p-4 rounded-xl outline-none focus:border-[var(--accent)] transition-all font-medium resize-y"
          />
        </div>

        {/* TEAM LOGO UPLOAD */}
        <div className="border-b border-[var(--card-border)] pb-8">
          <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1 mb-4 block">
            Team Logo (Square 1:1)
          </label>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-[var(--background)] rounded-2xl border-2 border-dashed border-[var(--card-border)] flex items-center justify-center overflow-hidden shrink-0">
              {logoPreview ? (
                <img src={logoPreview} className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="text-[var(--muted)]" />
              )}
            </div>
            <div className="flex-1">
              <label className="cursor-pointer bg-[var(--accent)] hover:opacity-90 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition inline-flex items-center gap-2 shadow-lg">
                <UploadCloud size={16} /> Choose Image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleLogoChange}
                />
              </label>
              <p className="text-[10px] text-[var(--muted)] mt-2 font-medium italic">
                Direkomendasikan format PNG transparan atau JPG 512x512px.
              </p>
            </div>
          </div>
        </div>

        {/* TEAM BANNER UPLOAD */}
        <div className="pb-4">
          <label className="text-[10px] font-black text-[var(--muted)] uppercase tracking-widest ml-1 mb-4 block">
            Team Banner (Landscape)
          </label>
          <div className="space-y-4">
            <div className="w-full h-40 bg-[var(--background)] rounded-2xl border-2 border-dashed border-[var(--card-border)] flex items-center justify-center overflow-hidden relative">
              {bannerPreview ? (
                <img
                  src={bannerPreview}
                  className="w-full h-full object-cover opacity-70"
                />
              ) : (
                <ImageIcon className="text-[var(--muted)] opacity-50" />
              )}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-[10px] font-black uppercase tracking-widest bg-black/50 text-white px-3 py-1 rounded backdrop-blur-sm">
                  Banner Preview
                </span>
              </div>
            </div>

            <label className="cursor-pointer bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] hover:bg-[var(--accent)] hover:text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition inline-flex items-center gap-2 shadow-sm w-full justify-center">
              <UploadCloud size={16} /> Upload New Banner
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerChange}
              />
            </label>
          </div>
        </div>

        {/* SUBMIT */}
        <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex items-start gap-3 mt-4">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <p className="text-[10px] text-amber-500 font-bold leading-relaxed">
            Gambar yang diunggah akan disimpan di infrastruktur Nismara.
            Dilarang mengunggah konten yang melanggar ketentuan.
          </p>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[var(--accent)] hover:opacity-90 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50 transition-all mt-8"
        >
          {isSubmitting ? (
            'Uploading to Nismara Server & Saving...'
          ) : (
            <>
              <Save size={18} /> Update Team Assets
            </>
          )}
        </button>
      </form>
    </div>
  );
}
