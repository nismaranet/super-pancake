'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Plus,
  Trash2,
  Server,
  Globe,
  Hash,
  Save,
  X,
  ToggleLeft,
  ToggleRight,
  Edit3, // Icon baru untuk Edit
} from 'lucide-react';

export default function ServerManagement() {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [instanceId, setInstanceId] = useState(0);

  useEffect(() => {
    fetchServers();
  }, []);

  const fetchServers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('hotlap_sync_sources')
      .select('*')
      .order('created_at', { ascending: true });
    setServers(data || []);
    setLoading(false);
  };

  const resetForm = () => {
    setName('');
    setUrl('');
    setInstanceId(0);
    setEditingId(null);
    setShowForm(false);
  };

  const handleSubmit = async () => {
    if (!name || !url) return alert('Nama dan URL wajib diisi');

    if (editingId) {
      // LOGIKA EDIT
      const { error } = await supabase
        .from('hotlap_sync_sources')
        .update({
          name,
          api_base_url: url,
          instance_id: instanceId,
        })
        .eq('id', editingId);

      if (error) alert(error.message);
      else {
        resetForm();
        fetchServers();
      }
    } else {
      // LOGIKA TAMBAH BARU
      const { error } = await supabase
        .from('hotlap_sync_sources')
        .insert([{ name, api_base_url: url, instance_id: instanceId }]);

      if (error) alert(error.message);
      else {
        resetForm();
        fetchServers();
      }
    }
  };

  const handleEditClick = (s: any) => {
    setEditingId(s.id);
    setName(s.name);
    setUrl(s.api_base_url);
    setInstanceId(s.instance_id);
    setShowForm(true);
    // Scroll ke atas agar admin tahu form sudah terbuka
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase
      .from('hotlap_sync_sources')
      .update({ is_active: !current })
      .eq('id', id);
    fetchServers();
  };

  const deleteServer = async (id: string) => {
    if (!confirm('Hapus server ini?')) return;
    await supabase.from('hotlap_sync_sources').delete().eq('id', id);
    fetchServers();
  };

  return (
    <div className="p-8 max-w-5xl mx-auto text-white">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black italic uppercase tracking-tighter">
            Server Manager
          </h1>
          <p className="text-gray-500 text-[10px] uppercase font-bold tracking-[0.2em] mt-1">
            Kelola Source Sync Hotlaps
          </p>
        </div>
        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className={`${
            showForm ? 'bg-gray-800' : 'bg-purple-600 hover:bg-purple-700'
          } px-6 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition`}
        >
          {showForm ? <X size={14} /> : <Plus size={14} />}{' '}
          {showForm ? 'Batal' : 'Tambah Server'}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#111] border border-white/5 p-6 rounded-3xl mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
          <h2 className="text-[10px] font-black uppercase text-purple-500 mb-4 tracking-widest">
            {editingId
              ? 'Edit Server Configuration'
              : 'New Server Configuration'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Server Name
              </label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition"
                placeholder="Contoh: Nismara Server 1"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Base URL API
              </label>
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition"
                placeholder="https://assetto.nismara.web.id"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Instance ID
              </label>
              <div className="flex gap-3">
                <input
                  type="number"
                  value={instanceId}
                  onChange={(e) => setInstanceId(parseInt(e.target.value))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:border-purple-500 outline-none transition"
                />
                <button
                  onClick={handleSubmit}
                  className="bg-green-600 p-3 px-6 rounded-xl hover:bg-green-700 transition flex items-center gap-2 text-[10px] font-black uppercase"
                >
                  <Save size={16} /> {editingId ? 'Simpan' : 'Tambah'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {servers.length > 0 ? (
            servers.map((s) => (
              <div
                key={s.id}
                className="bg-[#111] border border-white/5 p-5 rounded-3xl flex items-center justify-between group hover:border-white/10 transition"
              >
                <div className="flex items-center gap-5">
                  <div
                    className={`p-4 rounded-2xl ${
                      s.is_active
                        ? 'bg-purple-600/10 text-purple-500'
                        : 'bg-gray-800 text-gray-600'
                    }`}
                  >
                    <Server size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg uppercase italic leading-none">
                      {s.name}
                    </h3>
                    <div className="flex gap-4 mt-2">
                      <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
                        <Globe size={12} /> {s.api_base_url}
                      </span>
                      <span className="text-[10px] text-gray-500 flex items-center gap-1 font-bold">
                        <Hash size={12} /> INSTANCE: {s.instance_id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEditClick(s)}
                    className="p-3 text-gray-500 hover:text-white hover:bg-white/5 rounded-xl transition"
                    title="Edit Configuration"
                  >
                    <Edit3 size={18} />
                  </button>
                  <button
                    onClick={() => toggleActive(s.id, s.is_active)}
                    className={`transition ${
                      s.is_active ? 'text-green-500' : 'text-gray-600'
                    }`}
                  >
                    {s.is_active ? (
                      <ToggleRight size={32} />
                    ) : (
                      <ToggleLeft size={32} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteServer(s.id)}
                    className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-500/5 rounded-xl transition"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-20 border border-dashed border-white/5 rounded-3xl">
              <p className="text-gray-600 text-[10px] uppercase font-black tracking-widest">
                Belum ada server yang dikonfigurasi
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
