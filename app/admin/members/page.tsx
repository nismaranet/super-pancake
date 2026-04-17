'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import {
  Users,
  Search,
  Filter,
  ShieldAlert,
  ShieldCheck,
  Edit3,
  Trash2,
  X,
  Save,
  Monitor,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
} from 'lucide-react';

// --- HELPER: RANK SYSTEM ---
const getRankDetails = (sr: number) => {
  if (sr >= 80)
    return {
      label: 'ELITE',
      color: 'text-cyan-400',
      border: 'border-cyan-400/50',
      bg: 'bg-cyan-400/10',
    };
  if (sr >= 60)
    return {
      label: 'PRO',
      color: 'text-purple-400',
      border: 'border-purple-400/50',
      bg: 'bg-purple-400/10',
    };
  if (sr >= 40)
    return {
      label: 'SEMI-PRO',
      color: 'text-blue-400',
      border: 'border-blue-400/50',
      bg: 'bg-blue-400/10',
    };
  if (sr >= 20)
    return {
      label: 'AMATEUR',
      color: 'text-slate-300',
      border: 'border-slate-300/50',
      bg: 'bg-slate-300/10',
    };
  return {
    label: 'ROOKIE',
    color: 'text-orange-400',
    border: 'border-orange-400/50',
    bg: 'bg-orange-400/10',
  };
};

export default function MembersAdmin() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all'); // 'all', 'user', 'admin'

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Edit Modal State
  const [editingMember, setEditingMember] = useState<any>(null);
  const [editRole, setEditRole] = useState('user');
  const [editSteamGuid, setEditSteamGuid] = useState('');
  const [editSr, setEditSr] = useState<number>(0);
  const [editXp, setEditXp] = useState<number>(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('username', { ascending: true });

    if (!error && data) {
      setMembers(data);
    }
    setLoading(false);
  };

  // --- FILTERING LOGIC ---
  const filteredMembers = members.filter((member) => {
    const matchesSearch =
      member.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.display_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.steam_guid?.includes(searchQuery);

    const matchesRole = roleFilter === 'all' || member.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
  const currentMembers = filteredMembers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // --- ACTIONS ---
  const openEditModal = (member: any) => {
    setEditingMember(member);
    setEditRole(member.role || 'user');
    setEditSteamGuid(member.steam_guid || '');
    setEditSr(member.safety_rating || 0);
    setEditXp(member.total_xp || 0);
  };

  const handleUpdateMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      // Validasi Steam GUID jika diisi
      if (editSteamGuid && !/^[0-9]{17}$/.test(editSteamGuid)) {
        alert('Steam GUID harus berupa 17 digit angka (atau kosongkan).');
        setSaving(false);
        return;
      }

      // Hitung ulang level berdasarkan XP (opsional, jika ingin otomatis)
      const newLevel = Math.floor(editXp / 1000) + 1;

      const { error } = await supabase
        .from('profiles')
        .update({
          role: editRole,
          steam_guid: editSteamGuid || null,
          safety_rating: Math.max(0, Math.min(100, editSr)), // Cap SR antara 0 - 100
          total_xp: Math.max(0, editXp),
          driver_level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingMember.id);

      if (error) throw error;

      alert('Data pembalap berhasil diperbarui!');
      setEditingMember(null);
      fetchMembers();
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui data.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMember = async (id: string, username: string) => {
    const confirmDelete = window.confirm(
      `PERINGATAN KRITIS: Apakah Anda yakin ingin menghapus profil @${username} secara permanen? Statistik balapan mereka juga akan hilang.`,
    );
    if (!confirmDelete) return;

    try {
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) throw error;

      alert('Profil berhasil dihapus.');
      fetchMembers();
    } catch (err: any) {
      alert('Gagal menghapus profil: ' + err.message);
    }
  };

  return (
    <div className="p-8 pb-24 text-white">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black italic uppercase flex items-center gap-3">
            <Users className="text-purple-500" size={32} /> Driver Management
          </h1>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
            Total {filteredMembers.length} Registered Drivers
          </p>
        </div>
      </div>

      {/* CONTROLS (SEARCH & FILTER) */}
      <div className="bg-gray-800/50 p-4 rounded-2xl border border-white/5 flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Cari Username, Display Name, atau Steam GUID..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-gray-900 border border-white/10 text-white text-sm rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-purple-500 transition"
          />
        </div>
        <div className="relative w-full md:w-64">
          <Filter className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full bg-gray-900 border border-white/10 text-white text-sm rounded-xl pl-12 pr-4 py-3 appearance-none focus:outline-none focus:border-purple-500 cursor-pointer"
          >
            <option value="all">Semua Role</option>
            <option value="user">User / Driver</option>
            <option value="admin">Administrator</option>
          </select>
        </div>
      </div>

      {/* MEMBERS TABLE */}
      <div className="bg-gray-900 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {loading ? (
          <div className="py-20 flex justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-purple-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[900px]">
              <thead className="bg-[#120821]/80 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
                <tr>
                  <th className="px-6 py-5">Driver</th>
                  <th className="px-6 py-5">Steam GUID</th>
                  <th className="px-6 py-5 text-center">Class / SR</th>
                  <th className="px-6 py-5 text-center">Stats (Start/Win)</th>
                  <th className="px-6 py-5 text-center">Role</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {currentMembers.map((member) => {
                  const rank = getRankDetails(member.safety_rating || 0);

                  return (
                    <tr
                      key={member.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      {/* 1. Driver Info */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={
                              member.avatar_url ||
                              `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.username}`
                            }
                            className="w-10 h-10 rounded-xl object-cover border border-white/10"
                            alt=""
                          />
                          <div>
                            <p className="text-sm font-black italic uppercase text-white">
                              {member.display_name || member.username}
                            </p>
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                              @{member.username}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* 2. Steam GUID */}
                      <td className="px-6 py-4">
                        {member.steam_guid ? (
                          <div className="flex items-center gap-2 text-green-400 bg-green-500/10 w-max px-3 py-1.5 rounded-lg border border-green-500/20">
                            <Monitor size={12} />
                            <span className="font-mono text-xs">
                              {member.steam_guid}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-orange-400 bg-orange-500/10 w-max px-3 py-1.5 rounded-lg border border-orange-500/20">
                            <AlertTriangle size={12} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">
                              Not Linked
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 3. Class & SR */}
                      <td className="px-6 py-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span
                            className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded border ${rank.border} ${rank.color} ${rank.bg}`}
                          >
                            {rank.label}
                          </span>
                          <span className="text-xs font-black italic text-white">
                            SR: {(member.safety_rating || 0).toFixed(2)}
                          </span>
                        </div>
                      </td>

                      {/* 4. Stats */}
                      <td className="px-6 py-4 text-center">
                        <div className="text-xs font-black italic text-gray-300">
                          <span className="text-gray-500">
                            {member.total_starts || 0}
                          </span>{' '}
                          /{' '}
                          <span className="text-yellow-500">
                            {member.total_wins || 0}
                          </span>
                        </div>
                        <div className="text-[9px] text-blue-400 font-bold uppercase tracking-widest mt-1">
                          Level {member.driver_level || 1}
                        </div>
                      </td>

                      {/* 5. Role */}
                      <td className="px-6 py-4 text-center">
                        {member.role === 'admin' ? (
                          <span className="inline-flex items-center gap-1.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <ShieldAlert size={12} /> Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-white/5 text-gray-400 border border-white/10 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            <ShieldCheck size={12} /> User
                          </span>
                        )}
                      </td>

                      {/* 6. Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button
                            onClick={() => openEditModal(member)}
                            className="p-2 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-colors border border-blue-500/20"
                            title="Edit Driver Data"
                          >
                            <Edit3 size={16} />
                          </button>
                          <button
                            onClick={() =>
                              handleDeleteMember(member.id, member.username)
                            }
                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-colors border border-red-500/20"
                            title="Delete Profile"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {currentMembers.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-20 text-center text-gray-500 text-xs font-bold uppercase tracking-widest"
                    >
                      Tidak ada driver yang cocok dengan pencarian.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6 bg-gray-800/50 p-4 rounded-2xl border border-white/5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredMembers.length)} of{' '}
            {filteredMembers.length}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* EDIT MODAL POPUP */}
      {editingMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setEditingMember(null)}
          ></div>

          <div className="relative w-full max-w-lg bg-[#120821] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <div>
                <h3 className="text-xl font-black italic uppercase">
                  Edit Driver Data
                </h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  @{editingMember.username}
                </p>
              </div>
              <button
                onClick={() => setEditingMember(null)}
                className="text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 p-2 rounded-xl transition"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleUpdateMember} className="p-6 space-y-6">
              {/* Row 1: Role & Steam GUID */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    System Role
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                  >
                    <option value="user">User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Steam GUID
                  </label>
                  <input
                    type="text"
                    value={editSteamGuid}
                    onChange={(e) => setEditSteamGuid(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-green-500 font-mono"
                    placeholder="17 Digit..."
                  />
                </div>
              </div>

              {/* Row 2: SR & XP */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex justify-between">
                    Safety Rating
                    <span className="text-purple-400">Max: 100</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={editSr}
                    onChange={(e) => setEditSr(parseFloat(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 text-purple-400 font-black italic text-xl rounded-xl px-4 py-3 outline-none focus:border-purple-500"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 flex justify-between">
                    Total XP
                    <span className="text-blue-400">
                      Lvl {Math.floor(editXp / 1000) + 1}
                    </span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={editXp}
                    onChange={(e) => setEditXp(parseInt(e.target.value))}
                    className="w-full bg-black/40 border border-white/10 text-blue-400 font-black italic text-xl rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              {/* Info Banner */}
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                <AlertTriangle
                  size={16}
                  className="text-blue-400 shrink-0 mt-0.5"
                />
                <p className="text-[10px] text-blue-300/80 font-medium leading-relaxed">
                  Perubahan pada{' '}
                  <strong className="text-blue-300">Safety Rating</strong> dan{' '}
                  <strong className="text-blue-300">XP</strong> akan langsung
                  memengaruhi Kelas (Rookie-Elite) dan Posisi Leaderboard driver
                  ini. Gunakan fitur ini dengan bijak.
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={saving}
                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white py-4 rounded-xl font-black uppercase tracking-widest transition shadow-lg disabled:opacity-50"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                ) : (
                  <>
                    <Save size={18} /> Simpan Perubahan
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
