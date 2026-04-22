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
  Coins,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';

export default function EventRegistration({
  eventId,
  eventCars,
  isPassed,
  isRegistrationOpen,
  maxParticipants,
  currentParticipants,
  entryFee,
  eventName,
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
  const userCoins = profile?.nrc_coin || 0;
  const hasEnoughCoins = entryFee > 0 ? userCoins >= entryFee : true;

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
        .select('*')
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

  const sendDiscordNotification = async (regData: any) => {
    const webhookUrl = process.env.NEXT_PUBLIC_DISCORD_WEBHOOK_URL;
    if (!webhookUrl) return;

    const carName =
      eventCars?.find((c: any) => c.cars.id === selectedCarId)?.cars.name ||
      'Unknown Car';

    const embed = {
      title: '🏁 New Event Registration!',
      color: 0x7c3aed,
      fields: [
        { name: 'Event', value: eventName || 'Nismara Race', inline: false },
        {
          name: 'Driver',
          value: profile?.display_name || profile?.username || 'Unknown',
          inline: true,
        },
        {
          name: 'Steam GUID',
          value: profile?.steam_guid || 'Not Linked',
          inline: true,
        },
        {
          name: 'Discord ID',
          value: profile?.discord_id
            ? `<@${profile.discord_id}>`
            : 'Not Linked',
          inline: true,
        },
        { name: 'Number', value: `#${driverNumber}`, inline: true },
        { name: 'Car', value: carName, inline: true },
        { name: 'Team', value: teamName || '-', inline: true },
        {
          name: 'Entry Fee',
          value: entryFee > 0 ? `Paid (${entryFee} NRC)` : 'Free Entry',
          inline: false,
        },
      ],
      timestamp: new Date().toISOString(),
      footer: { text: 'Nismara Racing Hub' },
    };

    try {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embeds: [embed] }),
      });
    } catch (err) {
      console.error('Webhook Error:', err);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const { data: eventData } = await supabase
      .from('events')
      .select('*')
      .eq('id', eventId)
      .single();

    try {
      const selectedCarData = eventCars.find(
        (c: any) => c.cars.id === selectedCarId,
      );
      if (!selectedCarData) throw new Error('Pilih kendaraan yang valid.');
      if (!hasEnoughCoins) return alert('NRC tidak cukup!');

      const driverName = profile?.display_name || profile?.username;

      const { error } = await supabase.from('event_participants').insert({
        event_id: eventId,
        user_id: session.user.id,
        driver_number: driverNumber,
        driver_name: driverName,
        team_name: teamName || 'Privateer',
        car_name: selectedCarData.cars.name,
        car_image: selectedCarData.cars.image_url,
        car_id: selectedCarId,
        status: entryFee > 0 ? 'pending_payment' : 'registered',
      });

      if (error) throw error;

      if (entryFee > 0) {
        const newBalance = userCoins - entryFee;
        await supabase
          .from('profiles')
          .update({ nrc_coin: newBalance })
          .eq('id', session.user.id);

        // Update state lokal agar UI langsung menyesuaikan tanpa reload
        setProfile({ ...profile, nrc_coin: newBalance });
      }

      await sendDiscordNotification({ driverNumber, teamName });
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
      {/* MODAL PENDAFTARAN */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[var(--card)] border border-[var(--card-border)] w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-2xl font-black italic text-[var(--foreground)] uppercase tracking-tighter">
                    Entry Form
                  </h3>
                  <p className="text-xs text-[var(--muted)] font-medium">
                    Complete your racing credentials
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 hover:bg-[var(--background)] rounded-full text-[var(--muted)]"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleRegister} className="space-y-5">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">
                    Select Car
                  </label>
                  <select
                    required
                    value={selectedCarId}
                    onChange={(e) => setSelectedCarId(e.target.value)}
                    className="w-full bg-[var(--background)] border border-[var(--card-border)] text-[var(--foreground)] p-4 rounded-xl outline-none focus:border-[var(--accent)] transition-all"
                  >
                    <option value="">-- Choose your weapon --</option>
                    {eventCars?.map((c: any) => (
                      <option key={c.cars.id} value={c.cars.id}>
                        {c.cars.brand} {c.cars.name}
                      </option>
                    ))}
                  </select>
                </div>

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
                    <label className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)] ml-1">
                      Team Name
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

                {/* LOGIKA NRC COIN */}
                {entryFee > 0 && (
                  <div
                    className={`p-4 rounded-xl flex flex-col gap-2 border ${hasEnoughCoins ? 'bg-purple-500/10 border-purple-500/20' : 'bg-red-500/10 border-red-500/20'}`}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                        Entry Fee
                      </span>
                      <span className="text-sm font-black text-[var(--foreground)] flex items-center gap-1">
                        <Coins size={14} className="text-yellow-500" />{' '}
                        {entryFee} NRC
                      </span>
                    </div>
                    <div className="flex justify-between items-center w-full">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[var(--muted)]">
                        Your Balance
                      </span>
                      <span
                        className={`text-sm font-black flex items-center gap-1 ${hasEnoughCoins ? 'text-emerald-500' : 'text-red-500'}`}
                      >
                        <Coins
                          size={14}
                          className={
                            hasEnoughCoins ? 'text-emerald-500' : 'text-red-500'
                          }
                        />{' '}
                        {userCoins} NRC
                      </span>
                    </div>

                    {!hasEnoughCoins && (
                      <div className="mt-2 pt-2 border-t border-red-500/20 flex items-start gap-2 text-red-500">
                        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
                        <p className="text-[10px] font-bold">
                          Saldo NRC tidak mencukupi untuk mendaftar event ini.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting || !hasEnoughCoins}
                  className={`w-full py-4 text-white rounded-xl font-black uppercase tracking-widest shadow-lg transition-all mt-4 flex justify-center items-center gap-2
                    ${hasEnoughCoins && !submitting ? 'bg-[var(--accent)] hover:opacity-90' : 'bg-gray-600 cursor-not-allowed opacity-50'}
                  `}
                >
                  {submitting
                    ? 'Processing...'
                    : !hasEnoughCoins
                      ? 'Insufficient NRC'
                      : entryFee > 0
                        ? `Pay ${entryFee} NRC & Join`
                        : 'Confirm Registration'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
