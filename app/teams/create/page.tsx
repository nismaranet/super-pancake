'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import {
  Shield,
  ChevronLeft,
  AlertCircle,
  Save,
  Upload,
  Image as ImageIcon,
  Bold,
  Italic,
  List,
  Link as LinkIcon,
  Eye,
  Edit3,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';

export default function CreateTeamPage() {
  const router = useRouter();
  const fileInputLogo = useRef<HTMLInputElement>(null);
  const fileInputBanner = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [checkingTeam, setCheckingTeam] = useState(true);
  const [uploading, setUploading] = useState<'logo' | 'banner' | null>(null);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [user, setUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    tag: '',
    uri: '',
    bio: '',
    logo_url: '',
    banner_url: '',
  });

  useEffect(() => {
    const checkUserAndTeam = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      setUser(user);

      // Cek apakah user sudah terdaftar di team manapun (sebagai owner atau member)
      const { data: membership, error: memberError } = await supabase
        .from('team_members')
        .select(
          `
          team_id,
          teams (
            uri
          )
        `,
        )
        .eq('profile_id', user.id)
        .maybeSingle();

      if (membership && membership.teams) {
        // Jika sudah punya tim, redirect ke halaman tim mereka sendiri
        // @ts-ignore - Handle deep join typing
        router.replace(`/teams/${membership.teams.uri}`);
      } else {
        // Jika belum punya tim, izinkan melihat form
        setCheckingTeam(false);
      }
    };

    checkUserAndTeam();
  }, [router]);

  // Fungsi Upload ke R2 via API Route Anda
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: 'logo' | 'banner',
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi ukuran (misal max 2MB)
    if (file.size > 4 * 1024 * 1024) {
      setError(`File ${type} terlalu besar. Maksimal 4MB.`);
      return;
    }

    setUploading(type);
    setError('');

    try {
      // 1. Ambil Presigned URL dari API Anda
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileType: file.type,
          folder: `teams/${type}s`, // misal: teams/logos atau teams/banners
        }),
      });

      const { signedUrl, publicUrl } = await res.json();

      // 2. Upload langsung ke R2 menggunakan signedUrl
      await fetch(signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      // 3. Simpan public URL ke state
      setFormData((prev) => ({ ...prev, [`${type}_url`]: publicUrl }));
    } catch (err) {
      console.error(err);
      setError(`Gagal mengunggah ${type}.`);
    } finally {
      setUploading(null);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData({
      ...formData,
      name: newName,
      uri: newName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, ''),
    });
  };

  // Helper untuk menyisipkan Markdown
  const insertMarkdown = (syntax: string) => {
    const textarea = document.getElementById(
      'bio-textarea',
    ) as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.bio;
    const before = text.substring(0, start);
    const after = text.substring(end, text.length);
    const selected = text.substring(start, end);

    let newText = '';
    if (syntax === 'bold')
      newText = `${before}**${selected || 'bold text'}**${after}`;
    if (syntax === 'italic')
      newText = `${before}_${selected || 'italic text'}_${after}`;
    if (syntax === 'list')
      newText = `${before}\n- ${selected || 'list item'}${after}`;
    if (syntax === 'link')
      newText = `${before}[${selected || 'link text'}](https://)${after}`;

    setFormData({ ...formData, bio: newText });
    textarea.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    setError('');

    try {
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert([
          {
            name: formData.name,
            tag: formData.tag.toUpperCase(),
            uri: formData.uri,
            bio: formData.bio,
            logo_url: formData.logo_url,
            banner_url: formData.banner_url,
            owner_id: user.id,
          },
        ])
        .select()
        .single();

      if (teamError) throw teamError;

      await supabase.from('team_members').insert([
        {
          team_id: teamData.id,
          profile_id: user.id,
          role: 'owner',
          status: 'active',
        },
      ]);

      router.push(`/teams/${teamData.uri}`);
    } catch (err: any) {
      setError(
        err.code === '23505' ? 'Nama/URI sudah digunakan.' : err.message,
      );
    } finally {
      setLoading(false);
    }
  };

  if (checkingTeam) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-[var(--accent)] animate-spin" />
        <p className="text-[var(--muted)] font-bold animate-pulse uppercase tracking-widest text-xs">
          Verifying Eligibility...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-28 pb-12 px-4 max-w-4xl mx-auto">
      <Link
        href="/teams"
        className="inline-flex items-center gap-2 text-[var(--muted)] hover:text-[var(--foreground)] transition-colors mb-8 font-semibold text-sm"
      >
        <ChevronLeft size={16} /> Kembali ke Teams
      </Link>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Banner Uploader Section */}
        <div className="relative h-48 w-full rounded-2xl border-2 border-dashed border-[var(--glass-border)] bg-white/5 overflow-hidden group">
          {formData.banner_url ? (
            <img
              src={formData.banner_url}
              alt="Banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-[var(--muted)]">
              <ImageIcon size={40} className="mb-2 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">
                Upload Team Banner
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={() => fileInputBanner.current?.click()}
            className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white font-bold text-sm"
          >
            {uploading === 'banner' ? (
              'Uploading...'
            ) : (
              <>
                <Upload size={18} /> Change Banner
              </>
            )}
          </button>
          <input
            type="file"
            ref={fileInputBanner}
            hidden
            accept="image/*"
            onChange={(e) => handleFileUpload(e, 'banner')}
          />
        </div>

        <div className="bg-[var(--background)] border border-[var(--glass-border)] rounded-2xl shadow-xl backdrop-blur-md relative">
          {/* Logo Uploader (Floating) */}
          <div className="absolute -top-12 left-8 z-10">
            <div className="relative w-24 h-24 rounded-2xl border-4 border-[var(--background)] bg-[#1a1a1a] overflow-hidden group shadow-2xl">
              {formData.logo_url ? (
                <img
                  src={formData.logo_url}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[var(--muted)]">
                  <Shield size={32} />
                </div>
              )}
              <button
                type="button"
                onClick={() => fileInputLogo.current?.click()}
                className="absolute inset-0 bg-[var(--accent)]/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white"
              >
                {uploading === 'logo' ? '...' : <Upload size={20} />}
              </button>
              <input
                type="file"
                ref={fileInputLogo}
                hidden
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'logo')}
              />
            </div>
          </div>

          <div className="p-6 pt-16 border-b border-[var(--glass-border)] bg-white/5 rounded-t-2xl">
            <h1 className="text-2xl font-black italic tracking-tighter uppercase">
              Team Registration
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Lengkapi identitas tim balap Anda.
            </p>
          </div>

          <div className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-xl flex items-start gap-3 text-red-500">
                <AlertCircle size={20} className="shrink-0 mt-0.5" />
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  Team Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={handleNameChange}
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[var(--glass-border)] focus:border-[var(--accent)] outline-none"
                  placeholder="Nismara Racing Team"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  Team Tag
                </label>
                <input
                  type="text"
                  required
                  maxLength={4}
                  value={formData.tag}
                  onChange={(e) =>
                    setFormData({ ...formData, tag: e.target.value })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[var(--glass-border)] focus:border-[var(--accent)] outline-none uppercase"
                  placeholder="NRT"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                  Team URI
                </label>
                <input
                  type="text"
                  required
                  value={formData.uri}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      uri: e.target.value.toLowerCase(),
                    })
                  }
                  className="w-full px-4 py-3 rounded-xl bg-black/20 border border-[var(--glass-border)] focus:border-[var(--accent)] outline-none"
                  placeholder="nismara-racing"
                />
              </div>

              {/* Markdown Bio Section */}
              <div className="space-y-2 md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold uppercase tracking-widest text-[var(--muted)]">
                    Team Bio (Markdown)
                  </label>
                  <div className="flex gap-1 bg-white/5 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setPreviewMode(false)}
                      className={`p-1.5 rounded-md transition-all ${!previewMode ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`}
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewMode(true)}
                      className={`p-1.5 rounded-md transition-all ${previewMode ? 'bg-[var(--accent)] text-white' : 'text-[var(--muted)]'}`}
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </div>

                {!previewMode ? (
                  <div className="space-y-2">
                    {/* Markdown Toolbar */}
                    <div className="flex gap-2 p-2 border border-[var(--glass-border)] bg-black/20 rounded-t-xl border-b-0">
                      <button
                        type="button"
                        onClick={() => insertMarkdown('bold')}
                        className="p-2 hover:bg-white/10 rounded-lg text-[var(--muted)] hover:text-white"
                      >
                        <Bold size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('italic')}
                        className="p-2 hover:bg-white/10 rounded-lg text-[var(--muted)] hover:text-white"
                      >
                        <Italic size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('list')}
                        className="p-2 hover:bg-white/10 rounded-lg text-[var(--muted)] hover:text-white"
                      >
                        <List size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => insertMarkdown('link')}
                        className="p-2 hover:bg-white/10 rounded-lg text-[var(--muted)] hover:text-white"
                      >
                        <LinkIcon size={16} />
                      </button>
                    </div>
                    <textarea
                      id="bio-textarea"
                      rows={6}
                      value={formData.bio}
                      onChange={(e) =>
                        setFormData({ ...formData, bio: e.target.value })
                      }
                      className="w-full px-4 py-3 rounded-b-xl bg-black/20 border border-[var(--glass-border)] focus:border-[var(--accent)] outline-none resize-none font-mono text-sm"
                      placeholder="Gunakan markdown untuk menebalkan teks, list, dll..."
                    />
                  </div>
                ) : (
                  <div className="w-full min-h-[188px] px-4 py-3 rounded-xl bg-black/20 border border-[var(--glass-border)] prose prose-invert prose-sm max-w-none overflow-y-auto">
                    <ReactMarkdown>
                      {formData.bio || '*Belum ada deskripsi...*'}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-[var(--glass-border)] flex items-center justify-end gap-4">
              <Link
                href="/teams"
                className="px-6 py-2.5 rounded-xl font-bold text-sm text-[var(--muted)] hover:text-white"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading || !!uploading}
                className="flex items-center gap-2 px-8 py-2.5 rounded-xl bg-[var(--accent)] text-white font-bold text-sm hover:opacity-90 transition-all disabled:opacity-50 shadow-lg shadow-[var(--accent)]/20"
              >
                {loading ? (
                  <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Save size={18} /> Create Team
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
