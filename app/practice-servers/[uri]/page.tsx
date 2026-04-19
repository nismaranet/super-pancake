import { supabase } from '@/lib/supabaseClient';
import LiveServerInfo from '@/components/LiveServerInfo';

export default async function PracticeServerPage({ params }: any) {
  const resolvedParams = await params;
  const uri = resolvedParams.uri;

  // FETCH: Data Practice beserta relasi mobilnya (Many-to-Many)
  const { data: practice } = await supabase
    .from('practices')
    .select(
      `
      *,
      practice_cars (
        cars (*)
      )
    `,
    )
    .eq('uri', uri)
    .single();

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 text-gray-200">
      {/* HEADER SECTION */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-2">
          <span className="bg-blue-600 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">
            Practice Session
          </span>
          <div className="h-[1px] flex-grow bg-blue-600/30"></div>
        </div>
        <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white">
          {practice?.name}
        </h1>
        <p className="text-gray-500 mt-2 font-mono text-sm">
          CAPACITY:{' '}
          <span className="text-blue-400">
            {practice?.max_players || '24'} SLOTS
          </span>
        </p>
      </div>

      {/* CIRCUIT CARD */}
      <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden mb-12 shadow-2xl relative">
        {/* Decorative corner element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-600/10 blur-3xl rounded-full -mr-10 -mt-10"></div>

        <div className="flex flex-col lg:flex-row">
          {/* Image Side */}
          <div className="lg:w-2/3 relative h-64 lg:h-auto overflow-hidden">
            <img
              src={practice?.circuit_image || 'https://picsum.photos/800/450'}
              className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition duration-700"
              alt="Track Preview"
            />
          </div>

          {/* Info Side */}
          <div className="lg:w-1/3 p-8 flex flex-col justify-center">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-6 text-white leading-tight">
              {practice?.circuit_name || 'Generic Track'}
            </h2>

            <div className="space-y-3">
              {practice?.circuit_download_url && (
                <a
                  href={practice.circuit_download_url}
                  target="_blank"
                  className="flex items-center justify-between bg-gray-800 border border-gray-700 p-4 rounded-xl group hover:border-blue-500 transition-all"
                >
                  <span className="font-bold text-sm tracking-widest uppercase">
                    Download Track
                  </span>
                  <span className="bg-blue-600 p-1 rounded group-hover:px-4 transition-all text-xs font-black italic">
                    GET
                  </span>
                </a>
              )}

              {practice?.full_pack_url && (
                <a
                  href={practice.full_pack_url}
                  target="_blank"
                  className="flex items-center justify-between bg-blue-600 p-4 rounded-xl group hover:bg-blue-500 transition-all shadow-lg shadow-blue-900/20"
                >
                  <span className="font-bold text-sm tracking-widest uppercase text-white">
                    Download Car Pack
                  </span>
                  <span className="bg-red-600 p-1 rounded group-hover:px-4 transition-all text-xs font-black italic">
                    GET
                  </span>
                </a>
              )}

              {practice?.join_link && (
                <a
                  href={practice.join_link}
                  className="flex items-center justify-center bg-white text-black font-black uppercase italic tracking-widest py-4 rounded-xl hover:bg-gray-200 transition active:scale-95 shadow-xl shadow-white/5"
                >
                  Join Practice Sessions
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* LIVE SERVER DATA */}
      <div className="mb-16">
        <LiveServerInfo apiUrl={practice?.live_api_url} />
      </div>

      {/* VEHICLE FLEET SECTION */}
      <div className="flex items-center gap-4 mb-8">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
          List Vehicles
        </h2>
        <div className="h-[2px] flex-grow bg-gradient-to-r from-blue-600 to-transparent opacity-20"></div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {practice?.practice_cars?.length > 0 ? (
          practice.practice_cars.map((item: any) => {
            const car = item.cars;
            return (
              <div
                key={car.id}
                className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all duration-500 shadow-xl flex flex-col"
              >
                {/* Car Preview */}
                <div className="h-40 relative overflow-hidden bg-black">
                  <img
                    src={car.image_url || 'https://picsum.photos/400/225'}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-700 opacity-80 group-hover:opacity-100"
                    alt={car.name}
                  />
                </div>

                <div className="p-5 flex-grow">
                  <h4 className="font-black text-white text-lg uppercase tracking-tighter mb-6 leading-none group-hover:text-blue-400 transition">
                    {car.name}
                  </h4>

                  <div className="grid grid-cols-1 gap-2">
                    <a
                      href={car.download_url}
                      className="bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition shadow-lg shadow-blue-900/40 text-center"
                    >
                      Download Car Mod
                    </a>

                    {car.skin_url && (
                      <a
                        href={car.skin_url}
                        className="bg-transparent border border-gray-700 text-gray-400 hover:border-blue-400 hover:text-blue-400 py-2.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition text-center"
                      >
                        Download Official Skin
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-12 text-center bg-gray-900 rounded-3xl border border-dashed border-gray-800">
            <p className="text-gray-600 italic font-mono uppercase tracking-widest">
              No vehicles assigned to this session.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
