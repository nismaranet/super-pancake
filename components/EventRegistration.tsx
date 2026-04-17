'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  X,
  Car,
  AlertTriangle,
  LogIn,
  Monitor,
  Save,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

export default function EventRegistration({
  eventId,
  eventCars,
  isPassed,
  isRegistrationOpen,
  maxParticipants,
  currentParticipants,
}: any) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [driverNumber, setDriverNumber] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selectedCarId, setSelectedCarId] = useState('');

  const isFull = currentParticipants >= (maxParticipants || 40);

  useEffect(() => {
    checkStatus();
  }, [eventId]);

  const checkStatus = async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession();
    setSession(currentSession);

    if (currentSession) {
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('display_name, username, steam_guid')
        .eq('id', currentSession.user.id)
        .single();

      setProfile(userProfile);

      const { data: participation } = await supabase
        .from('event_participants')
        .select('id')
        .eq('event_id', eventId)
        .eq('user_id', currentSession.user.id)
        .maybeSingle();

      if (participation) setIsRegistered(true);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const selectedCarData = eventCars.find(
        (c: any) => c.cars.id === selectedCarId,
      );
      if (!selectedCarData) throw new Error('Pilih kendaraan yang valid.');

      const driverName = profile?.display_name || profile?.username;

      const { error } = await supabase.from('event_participants').insert({
        event_id: eventId,
        user_id: session.user.id,
        driver_number: driverNumber,
        driver_name: driverName,
        team_name: teamName || 'Privateer',
        car_name: selectedCarData.cars.name,
        car_image: selectedCarData.cars.image_url,
      });

      if (error) throw error;

      setIsRegistered(true);
      setShowModal(false);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Gagal mendaftar.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancelRegistration = async () => {
    const confirmCancel = window.confirm(
      'Yakin ingin membatalkan pendaftaran dari event ini?',
    );
    if (!confirmCancel) return;

    setLoading(true);
    await supabase
      .from('event_participants')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', session.user.id);

    setIsRegistered(false);
    setLoading(false);
    router.refresh();
  };

  if (loading)
    return (
      <div className="h-20 bg-gray-900/50 rounded-2xl animate-pulse w-full"></div>
    );
  if (isPassed) return null;

  return (
    <>
      {!session ? (
        <Link
          href="/login"
          className="flex items-center justify-center gap-3 w-full p-6 bg-gray-900/80 border border-gray-700 hover:bg-gray-800 text-white rounded-2xl shadow-xl transition-all"
        >
          <LogIn size={20} className="text-blue-500" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-0.5">
              Authentication Required
            </p>
            <p className="text-sm font-black uppercase tracking-widest">
              Login to Register
            </p>
          </div>
        </Link>
      ) : !profile?.steam_guid ? (
        <Link
          href="/profile/settings"
          className="flex items-center justify-center gap-3 w-full p-6 bg-orange-500/10 border border-orange-500/30 hover:bg-orange-500/20 text-white rounded-2xl shadow-xl transition-all"
        >
          <Monitor size={20} className="text-orange-500" />
          <div className="text-left">
            <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-0.5">
              Missing Identity
            </p>
            <p className="text-sm font-black uppercase tracking-widest">
              Link Steam GUID First
            </p>
          </div>
        </Link>
      ) : isRegistered ? (
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-3 w-full p-5 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-2xl">
            <CheckCircle2 size={24} />
            <p className="text-sm font-black uppercase tracking-widest">
              You are registered
            </p>
          </div>
          {isRegistrationOpen && (
            <button
              onClick={handleCancelRegistration}
              className="w-full py-3 text-[10px] font-black text-gray-500 uppercase tracking-widest hover:text-red-500 transition-colors"
            >
              Cancel Registration
            </button>
          )}
        </div>
      ) : !isRegistrationOpen ? (
        <div className="flex items-center justify-center gap-3 w-full p-6 bg-red-500/10 border border-red-500/30 text-red-500 rounded-2xl shadow-xl transition-all cursor-not-allowed">
          <X size={24} />
          <p className="text-lg font-black uppercase tracking-widest">
            Registration Closed
          </p>
        </div>
      ) : isFull ? (
        <div className="flex items-center justify-center gap-3 w-full p-6 bg-orange-500/10 border border-orange-500/30 text-orange-500 rounded-2xl shadow-xl transition-all cursor-not-allowed">
          <AlertCircle size={24} />
          <p className="text-lg font-black uppercase tracking-widest">
            Event Full
          </p>
        </div>
      ) : (
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center justify-center gap-3 w-full p-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl shadow-lg hover:shadow-emerald-500/25 transition-all transform active:scale-95"
        >
          <Car size={24} />
          <p className="text-lg font-black uppercase tracking-widest">
            Register Now
          </p>
        </button>
      )}

      {/* MODAL PENDAFTARAN TETAP SAMA SEPERTI SEBELUMNYA */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          ></div>
          <div className="relative w-full max-w-md bg-[#120821] border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
              <h3 className="text-xl font-black italic uppercase text-white">
                Event Entry
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleRegister} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Driver Number *
                  </label>
                  <input
                    type="number"
                    required
                    value={driverNumber}
                    onChange={(e) => setDriverNumber(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm font-black italic rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                    placeholder="e.g. 99"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Team Name
                  </label>
                  <input
                    type="text"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                  Select Vehicle *
                </label>
                <select
                  required
                  value={selectedCarId}
                  onChange={(e) => setSelectedCarId(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-emerald-500"
                >
                  <option value="" disabled>
                    Choose your car...
                  </option>
                  {eventCars?.map((c: any) => (
                    <option key={c.cars.id} value={c.cars.id}>
                      {c.cars.brand} {c.cars.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3 mt-4">
                <AlertTriangle
                  size={16}
                  className="text-blue-400 shrink-0 mt-0.5"
                />
                <p className="text-[10px] text-blue-300/80 font-medium leading-relaxed">
                  Dengan mendaftar, kamu setuju untuk mengikuti briefing event
                  dan balapan secara sportif sesuai peraturan Nismara Hub.
                </p>
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex justify-center items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 rounded-xl font-black uppercase tracking-widest shadow-lg disabled:opacity-50"
              >
                {submitting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-white"></div>
                ) : (
                  <>
                    <Save size={18} /> Submit Entry
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
