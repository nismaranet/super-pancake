'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import RankBadge from '@/components/RankBadge';
import {
  Shield,
  Users,
  Target,
  ChevronLeft,
  ExternalLink,
  Crown,
  Medal,
  Star,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

export default function TeamPublicProfile() {
  const params = useParams();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [team, setTeam] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userMemberStatus, setUserMemberStatus] = useState<any>(null);

  useEffect(() => {
    if (params.uri) {
      fetchInitialData();
    }
  }, [params.uri]);

  const fetchInitialData = async () => {
    setLoading(true);

    // 1. Fetch Team Details
    const { data: teamData } = await supabase
      .from('teams')
      .select('*')
      .eq('uri', params.uri)
      .single();

    if (!teamData) {
      setLoading(false);
      return;
    }
    setTeam(teamData);

    // 2. Fetch Active Roster
    const { data: membersData } = await supabase
      .from('team_members')
      .select(
        `
        role,
        status,
        profiles:profile_id (
          id,
          username,
          avatar_url,
          safety_rating,
          driver_level
        )
      `,
      )
      .eq('team_id', teamData.id)
      .eq('status', 'active')
      .order('role', { ascending: false });

    if (membersData) setMembers(membersData);

    // 3. Check Current User Session & Membership
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setUserProfile(profile);

      // Cek status membership (baik aktif maupun pending)
      const { data: memberCheck } = await supabase
        .from('team_members')
        .select('*')
        .eq('profile_id', user.id)
        .in('status', ['active', 'pending'])
        .maybeSingle();

      setUserMemberStatus(memberCheck);
    }

    setLoading(false);
  };

  const handleJoinTeam = async () => {
    if (!userProfile || !team || isSubmitting) return;

    setIsSubmitting(true);

    const { error } = await supabase.from('team_members').insert([
      {
        team_id: team.id,
        profile_id: userProfile.id,
        role: 'member',
        status: 'pending',
        joined_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error('Error joining team:', error.message);
      alert('Gagal mengirim permintaan join: ' + error.message);
    } else {
      // Refresh data status member tanpa reload page
      const { data: newStatus } = await supabase
        .from('team_members')
        .select('*')
        .eq('profile_id', userProfile.id)
        .eq('team_id', team.id)
        .single();

      setUserMemberStatus(newStatus);
    }

    setIsSubmitting(false);
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <div className="text-[var(--foreground)] font-black uppercase italic animate-pulse tracking-tighter">
          Loading Team Profile...
        </div>
      </div>
    );

  if (!team)
    return (
      <div className="min-h-screen pt-32 text-center font-black uppercase">
        Team Not Found
      </div>
    );

  return (
    <div className="min-h-screen bg-[var(--background)] pb-20">
      {/* Hero Banner Section */}
      <div className="relative h-[350px] md:h-[450px] w-full overflow-hidden">
        {team.banner_url ? (
          <img
            src={team.banner_url}
            alt="Banner"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-900/40 via-zinc-900 to-blue-900/40" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--background)] via-transparent to-transparent" />

        <div className="absolute top-32 left-4 md:left-8">
          <Link
            href="/teams"
            className="group flex items-center gap-2 text-white/70 hover:text-white transition-all font-bold uppercase text-[10px] tracking-widest bg-black/20 backdrop-blur-md px-4 py-2 rounded-xl border border-white/5"
          >
            <ChevronLeft
              size={14}
              className="group-hover:-translate-x-1 transition-transform"
            />
            Back to Directory
          </Link>
        </div>
      </div>

      {/* Team Info Header */}
      <div className="max-w-7xl mx-auto px-4 -mt-24 relative z-10">
        <div className="flex flex-col md:flex-row items-end gap-6 md:gap-10 mb-12">
          {/* Logo */}
          <div className="w-40 h-40 md:w-52 md:h-52 bg-[var(--card)] rounded-[2.5rem] border-[10px] border-[var(--background)] shadow-2xl overflow-hidden flex items-center justify-center shrink-0">
            {team.logo_url ? (
              <img
                src={team.logo_url}
                alt={team.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Shield size={64} className="text-purple-500/20" />
            )}
          </div>

          <div className="flex-1 pb-4">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-lg uppercase tracking-widest">
                LVL {team.team_level || 1}
              </span>
              <span className="text-purple-400 text-[10px] font-black uppercase tracking-[0.2em]">
                [{team.tag}]
              </span>
            </div>
            <h1 className="text-4xl md:text-7xl font-black italic text-[var(--foreground)] uppercase tracking-tighter leading-[0.8] mb-4">
              {team.name}
            </h1>

            {/* Action Button: Join Team Logic */}
            {userProfile && (
              <div className="mt-4">
                {userMemberStatus ? (
                  userMemberStatus.status === 'active' ? (
                    userMemberStatus.team_id === team.id ? (
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/20 text-green-500 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                        <CheckCircle2 size={14} /> You are a member
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-zinc-700 text-zinc-500 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                        <Shield size={14} /> Already in another team
                      </div>
                    )
                  ) : (
                    // Tampilan jika status 'pending'
                    <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">
                      <Clock size={14} className="animate-pulse" /> Request
                      Pending
                    </div>
                  )
                ) : (
                  <button
                    onClick={handleJoinTeam}
                    disabled={!userProfile.steam_guid || isSubmitting}
                    className={`inline-flex items-center gap-2 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all shadow-lg ${
                      userProfile.steam_guid
                        ? isSubmitting
                          ? 'bg-zinc-700 text-zinc-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:scale-105 shadow-purple-500/20'
                        : 'bg-red-600 text-white cursor-not-allowed'
                    }`}
                  >
                    {userProfile.steam_guid ? (
                      isSubmitting ? (
                        'Processing...'
                      ) : (
                        <>
                          <Plus size={16} /> Request to Join
                        </>
                      )
                    ) : (
                      <>
                        <AlertCircle size={16} /> Assign Steam GUID First
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 pb-4 w-full md:w-auto">
            <div className="flex-1 md:flex-none bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-[2rem] text-center min-w-[140px] shadow-xl">
              <p className="text-[var(--muted)] text-[9px] font-black uppercase tracking-widest mb-1">
                Cumulative XP
              </p>
              <p className="text-3xl font-black text-purple-500 italic leading-none">
                {team.total_xp?.toLocaleString('id-ID') || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Content Roster */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8">
            <h2 className="text-3xl font-black uppercase italic tracking-tighter flex items-center gap-3 mb-8">
              <Users size={28} className="text-purple-500" /> Active Roster
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {members.length > 0 ? (
                members.map((member, index) => (
                  <div
                    key={index}
                    className="group bg-[var(--card)] border border-[var(--card-border)] p-5 rounded-[2rem] flex items-center gap-5 hover:border-purple-500/40 transition-all"
                  >
                    <div className="relative shrink-0">
                      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-zinc-900 border-2 border-zinc-800">
                        <img
                          src={
                            member.profiles?.avatar_url ||
                            `https://api.dicebear.com/7.x/bottts/svg?seed=${member.profiles?.username}`
                          }
                          className="w-full h-full object-cover"
                          alt="Driver"
                        />
                      </div>
                      {member.role === 'owner' && (
                        <div className="absolute -top-2 -left-2 bg-yellow-500 text-black p-1 rounded-lg">
                          <Crown size={10} fill="currentColor" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-black uppercase tracking-tight text-[var(--foreground)]">
                        {member.profiles?.username}
                      </h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[10px] font-black text-orange-500 uppercase flex items-center gap-1">
                          <Medal size={12} />{' '}
                          <RankBadge sr={member.profiles?.safety_rating || 0} />
                        </span>
                        <span className="text-[10px] font-bold text-[var(--muted)] uppercase">
                          LV {member.profiles?.driver_level || 1}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-10 text-center border border-dashed border-[var(--card-border)] rounded-3xl text-[var(--muted)] uppercase font-bold">
                  No active drivers yet.
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-4">
            <section className="bg-[var(--card)] border border-[var(--card-border)] rounded-[2.5rem] p-8 shadow-sm">
              <h2 className="text-sm font-black uppercase italic tracking-widest mb-6 flex items-center gap-2 text-purple-500">
                <Target size={18} /> Team Identity
              </h2>
              <div className="space-y-4">
                <div className="bg-[var(--background)] p-4 rounded-2xl border border-[var(--card-border)] text-center">
                  <p className="text-[10px] font-black uppercase text-[var(--muted)] mb-1">
                    Verified Member of
                  </p>
                  <p className="font-bold text-sm text-[var(--foreground)] uppercase tracking-tighter italic">
                    Nismara Racing Group
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
