'use client';

import { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Calendar,
  Info,
  CheckCircle2,
  Coins,
  ShieldAlert,
  X,
  CarFront,
  Users,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function ChampionshipDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const champId = resolvedParams.id;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [championship, setChampionship] = useState<any>(null);
  const [classes, setClasses] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [classCarsMap, setClassCarsMap] = useState<any>({}); // Menyimpan map { classId: [cars] }
  const [availableLiveries, setAvailableLiveries] = useState<any[]>([]);
  const [selectedLiveryId, setSelectedLiveryId] = useState('');

  // ================= STATES FOR REGISTRATION & USER =================
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isRegisteredFullSeason, setIsRegisteredFullSeason] = useState(false);
  const [activeTab, setActiveTab] = useState('info');

  // ================= STATES FOR MODAL FORM =================
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');
  const [driverNumber, setDriverNumber] = useState('');
  const [teamName, setTeamName] = useState('');

  // 1. Fetch Data Utama
  useEffect(() => {
    fetchData();
  }, [champId]);

  // 2. Fetch Liveries (Dipindah ke luar dari fetchData)
  useEffect(() => {
    const fetchLiveries = async () => {
      if (!selectedCarId) {
        setAvailableLiveries([]);
        return;
      }
      const { data } = await supabase
        .from('car_liveries')
        .select('*')
        .eq('car_id', selectedCarId);
      setAvailableLiveries(data || []);
      setSelectedLiveryId(''); // Reset pilihan livery
    };
    fetchLiveries();
  }, [selectedCarId]);

  // 3. Reset Mobil saat Kelas diganti (Dipindah ke luar dari fetchData)
  useEffect(() => {
    setSelectedCarId('');
  }, [selectedClassId]);

  const fetchData = async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    setSession(currentSession);

    // 1. Fetch Championship
    const { data: champ } = await supabase
      .from('championships')
      .select('*')
      .eq('id', champId)
      .single();
    setChampionship(champ);

    // 2. Fetch Classes beserta Mobil yang diizinkan
    const { data: cls } = await supabase
      .from('championship_classes')
      .select('*, championship_class_cars(cars(id, brand, name))')
      .eq('championship_id', champId);

    if (cls) {
      setClasses(cls);

      // Buat pemetaan (mapping) mobil per kelas agar UI cepat berganti
      const map: any = {};
      cls.forEach((c: any) => {
        map[c.id] = c.championship_class_cars.map((cc: any) => cc.cars);
      });
      setClassCarsMap(map);

      if (cls.length > 0) setSelectedClassId(cls[0].id);
    }

    // 3. Fetch Events
    const { data: evts } = await supabase
      .from('events')
      .select('id, title, date, uri, tracks(name)')
      .eq('championship_id', champId)
      .order('date', { ascending: true });
    if (evts) setEvents(evts);

    // 4. Fetch User Profile & Status
    if (currentSession) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentSession.user.id)
        .single();
      setProfile(prof);

      const { data: reg } = await supabase
        .from('championship_participants')
        .select('*')
        .eq('championship_id', champId)
        .eq('profile_id', currentSession.user.id)
        .maybeSingle();
      if (reg) setIsRegisteredFullSeason(true);
    }

    setLoading(false);
  };

  // Fungsi Pendaftaran di dalam Modal
  const submitRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return router.push('/auth/login');
    if (!selectedClassId || !selectedCarId || !driverNumber)
      return alert('Mohon lengkapi semua data wajib!');

    if (profile.nrc_coin < championship.entry_fee) {
      return alert('Saldo NRC kamu tidak mencukupi!');
    }

    setSubmitting(true);

    // 1. Insert ke database participants (Ditambahkan livery_id)
    const { error: regError } = await supabase
      .from('championship_participants')
      .insert([
        {
          championship_id: champId,
          profile_id: profile.id,
          class_id: selectedClassId,
          car_id: selectedCarId,
          livery_id: selectedLiveryId || null, // <--- PENAMBAHAN LIVERY DI SINI
          driver_number: driverNumber,
          team_name: teamName || 'Privateer',
          status: 'confirmed',
        },
      ]);

    if (regError) {
      alert('Gagal mendaftar: ' + regError.message);
      setSubmitting(false);
      return;
    }

    // 2. Potong NRC Coin jika berbayar
    if (championship.entry_fee > 0) {
      const newBalance = profile.nrc_coin - championship.entry_fee;
      await supabase
        .from('profiles')
        .update({ nrc_coin: newBalance })
        .eq('id', profile.id);
      setProfile({ ...profile, nrc_coin: newBalance });
    }

    setIsRegisteredFullSeason(true);
    setShowModal(false);
    setSubmitting(false);
  };

  const hasEnoughCoins = profile
    ? profile.nrc_coin >= (championship?.entry_fee || 0)
    : false;

  if (loading)
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 max-w-7xl mx-auto animate-pulse text-[var(--foreground)] font-black uppercase">
        Memuat Kejuaraan...
      </div>
    );
  if (!championship)
    return (
      <div className="min-h-screen pt-32 pb-20 px-4 text-[var(--foreground)]">
        Championship not found.
      </div>
    );

  return (
    <div className="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-[2.5rem] p-8 md:p-12 mb-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-lg border ${championship.is_active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-gray-500/10 text-gray-500 border-gray-500/20'}`}
              >
                {championship.is_active ? 'Active Season' : 'Archived'}
              </span>
              <div className="flex gap-2">
                {classes.map((cls) => (
                  <span
                    key={cls.id}
                    style={{ color: cls.color_hex, borderColor: cls.color_hex }}
                    className="px-2 py-1 text-[9px] font-black uppercase tracking-widest rounded bg-black/20 border"
                  >
                    {cls.name}
                  </span>
                ))}
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-2">
              {championship.name}
            </h1>
          </div>

          {/* REGISTRATION CARD */}
          <div className="bg-[var(--background)] border border-[var(--card-border)] p-6 rounded-3xl w-full md:w-auto min-w-[300px]">
            <p className="text-[10px] text-[var(--muted)] font-black uppercase tracking-widest mb-1">
              Full Season Entry
            </p>
            <div className="flex items-center gap-2 mb-4">
              <Coins size={20} className="text-yellow-500" />
              <span className="text-2xl font-black text-[var(--foreground)]">
                {championship.entry_fee} NRC
              </span>
            </div>

            {!session ? (
              <button
                onClick={() => router.push('/auth/login')}
                className="w-full py-3 bg-[var(--accent)] hover:opacity-90 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all"
              >
                Login to Register
              </button>
            ) : isRegisteredFullSeason ? (
              <div className="w-full py-3 bg-emerald-500/10 text-emerald-500 rounded-xl font-black uppercase tracking-widest text-center border border-emerald-500/20 flex items-center justify-center gap-2">
                <CheckCircle2 size={18} /> Registered
              </div>
            ) : championship.is_active ? (
              <button
                onClick={() => setShowModal(true)}
                className="w-full py-3 bg-[var(--accent)] hover:opacity-90 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all"
              >
                Join Full Season
              </button>
            ) : (
              <div className="w-full py-3 bg-gray-500/10 text-gray-500 rounded-xl font-black uppercase tracking-widest text-center border border-gray-500/20">
                Season Closed
              </div>
            )}

            {profile &&
              !isRegisteredFullSeason &&
              profile.nrc_coin < championship.entry_fee && (
                <p className="text-[9px] text-red-500 mt-2 flex items-center gap-1 font-bold">
                  <ShieldAlert size={10} /> Saldo NRC kurang ({profile.nrc_coin}{' '}
                  NRC)
                </p>
              )}
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex gap-4 mb-8 border-b border-[var(--card-border)] pb-4 overflow-x-auto custom-scrollbar">
        {['info', 'standings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-[var(--accent)] text-white shadow-lg'
                : 'bg-[var(--card)] text-[var(--muted)] hover:text-[var(--foreground)] border border-[var(--card-border)]'
            }`}
          >
            {tab === 'info'
              ? 'Season Info & Calendar'
              : 'Championship Standings'}
          </button>
        ))}
      </div>

      {/* TAB CONTENT: INFO */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-[var(--card)] border border-[var(--card-border)] p-8 rounded-[2rem]">
              <h2 className="text-xl font-black italic text-[var(--foreground)] uppercase tracking-tighter mb-6 flex items-center gap-3">
                <Info size={20} className="text-purple-500" /> Season Briefing
              </h2>
              <div className="prose prose-sm max-w-none text-[var(--muted)] prose-invert">
                <ReactMarkdown>
                  {championship.description || '*Belum ada deskripsi musim.*'}
                </ReactMarkdown>
              </div>
            </section>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-black italic text-[var(--foreground)] uppercase tracking-tighter flex items-center gap-2 ml-2">
              <Calendar size={18} className="text-purple-500" /> Event Calendar
            </h3>
            {events.map((evt, idx) => (
              <a
                href={`/events/${evt.uri}`}
                key={evt.id}
                className="block bg-[var(--card)] border border-[var(--card-border)] p-4 rounded-2xl hover:border-purple-500/50 transition group"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-purple-500">
                    Round {idx + 1}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--muted)]">
                    {new Date(evt.date).toLocaleDateString('id-ID')}
                  </span>
                </div>
                <h4 className="text-sm font-black text-[var(--foreground)] uppercase truncate">
                  {evt.title}
                </h4>
                <p className="text-[11px] text-[var(--muted)] truncate mt-1 flex items-center gap-1">
                  <Trophy size={10} /> {evt.tracks?.name || 'Unknown Track'}
                </p>
              </a>
            ))}
            {events.length === 0 && (
              <p className="text-sm text-[var(--muted)] italic pl-2">
                Kalender belum dirilis.
              </p>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT: STANDINGS */}
      {activeTab === 'standings' && (
        <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-[2rem] p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
          <Trophy size={48} className="text-purple-500/30 mb-4" />
          <h3 className="text-xl font-black uppercase text-[var(--foreground)] tracking-tighter">
            Standings & Results
          </h3>
          <p className="text-sm text-[var(--muted)] max-w-md mt-2">
            Tabel klasemen akan segera disinkronisasi.
          </p>
        </div>
      )}

      {/* ================= MODAL PENDAFTARAN FULL SEASON ================= */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[var(--card)] border border-[var(--card-border)] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl my-8 relative">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                    Season Entry Form
                  </h3>
                  <p className="text-xs text-[var(--muted)] font-medium">
                    Declare your class and weapon
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-[var(--background)] rounded-full text-[var(--muted)] transition"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={submitRegistration} className="space-y-5">
                {/* PILIH KELAS */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1 flex items-center gap-2">
                    <Trophy size={12} className="text-yellow-500" /> Select
                    Class
                  </label>
                  <select
                    required
                    value={selectedClassId}
                    onChange={(e) => setSelectedClassId(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] p-4 rounded-xl outline-none focus:border-[var(--accent)] transition-all font-bold uppercase text-sm"
                  >
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                    {classes.length === 0 && (
                      <option value="">No classes available</option>
                    )}
                  </select>
                </div>

                {/* PILIH MOBIL (Dinamis berdasarkan Kelas) */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1 flex items-center gap-2">
                    <CarFront size={12} className="text-blue-500" /> Select
                    Vehicle
                  </label>
                  <select
                    required
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] p-4 rounded-xl outline-none focus:border-[var(--accent)] transition-all"
                  >
                    <option value="">-- Choose your weapon --</option>
                    {classCarsMap[selectedClassId]?.map((car: any) => (
                      <option key={car.id} value={car.id}>
                        {car.brand} {car.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* PILIH LIVERY (Muncul setelah mobil dipilih) */}
                {selectedCarId && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">
                      Select Livery Design
                    </label>
                    <select
                      value={selectedLiveryId}
                      onChange={(e) => setSelectedLiveryId(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] p-4 rounded-xl outline-none focus:border-[var(--accent)] transition-all"
                    >
                      <option value="">-- Base / Default Livery --</option>
                      {availableLiveries.map((liv: any) => (
                        <option key={liv.id} value={liv.id}>
                          {liv.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* NOMOR & TIM */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">
                      Race Number
                    </label>
                    <input
                      required
                      type="number"
                      placeholder="e.g. 07"
                      value={driverNumber}
                      onChange={(e) => setDriverNumber(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] p-4 rounded-xl outline-none focus:border-[var(--accent)] transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1 flex items-center gap-2">
                      <Users size={12} className="text-purple-500" /> Team Name
                    </label>
                    <input
                      type="text"
                      placeholder="Optional"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] p-4 rounded-xl outline-none focus:border-[var(--accent)] transition-all"
                    />
                  </div>
                </div>

                {/* NRC PAYMENT INFO */}
                {championship.entry_fee > 0 && (
                  <div
                    className={`p-4 rounded-xl flex flex-col gap-2 border mt-2 ${hasEnoughCoins ? 'bg-purple-500/10 border-purple-500/20' : 'bg-red-500/10 border-red-500/20'}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                        Season Entry Fee
                      </span>
                      <span className="text-sm font-black text-[var(--foreground)] flex items-center gap-1">
                        <Coins size={14} className="text-yellow-500" />{' '}
                        {championship.entry_fee} NRC
                      </span>
                    </div>
                    {!hasEnoughCoins && (
                      <div className="mt-2 pt-2 border-t border-red-500/20 flex items-start gap-2 text-red-500">
                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold">
                          Saldo NRC tidak mencukupi untuk mendaftar musim ini.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !hasEnoughCoins}
                  className={`w-full py-4 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all mt-6 flex justify-center items-center gap-2
                    ${hasEnoughCoins && !submitting ? 'bg-[var(--accent)] hover:opacity-90' : 'bg-gray-600 cursor-not-allowed opacity-50'}
                  `}
                >
                  {submitting
                    ? 'Processing...'
                    : !hasEnoughCoins
                      ? 'Insufficient NRC'
                      : championship.entry_fee > 0
                        ? `Pay ${championship.entry_fee} NRC & Join`
                        : 'Confirm Full Season Entry'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
