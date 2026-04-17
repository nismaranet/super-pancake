'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const router = useRouter();

  const [servers, setServers] = useState<any[]>([]);
  const [cars, setCars] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function checkUser() {
    const { data } = await supabase.auth.getUser();
    if (!data.user) router.push('/login');
    else setLoading(false);
  }

  useEffect(() => {
    checkUser();
    setLoading(false);
  }, []);

  if (loading) return <p>Loading...</p>;

  // 📊 CALC
  const totalServers = servers.length;
  const totalCars = cars.length;
  const totalPlayers = servers.reduce(
    (sum, s) => sum + (s.max_players || 0),
    0,
  );

  return (
    <div>
      {/* HEADER */}
      <h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

      {/* STATS */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-gray-400">Total Servers</h2>
          <p className="text-3xl font-bold">{totalServers}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-gray-400">Total Cars</h2>
          <p className="text-3xl font-bold">{totalCars}</p>
        </div>

        <div className="bg-gray-800 p-6 rounded-xl">
          <h2 className="text-gray-400">Total Player Slots</h2>
          <p className="text-3xl font-bold">{totalPlayers}</p>
        </div>
      </div>

      {/* RECENT SERVERS */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Recent Servers</h2>

        <div className="grid md:grid-cols-2 gap-4">
          {servers.slice(0, 4).map((server) => (
            <div key={server.id} className="bg-gray-800 p-4 rounded-lg">
              {server.image_url && (
                <img
                  src={server.image_url}
                  className="w-full h-32 object-cover rounded mb-2"
                />
              )}

              <h3 className="font-semibold">{server.name}</h3>

              <p className="text-sm text-gray-400">{server.circuit_name}</p>

              <p className="text-sm text-gray-400">
                Max: {server.max_players || '-'}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
