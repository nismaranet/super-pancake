import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

export default async function PracticeServerListPage() {
  // Ambil data server dari database
  const { data: practices } = await supabase
    .from('practices')
    .select('*')
    .order('name', { ascending: true })

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      {/* HEADER SECTION */}
      <div className="mb-12 border-b border-gray-800 pb-8">
        <h1 className="text-4xl font-extrabold text-white mb-3">
          Explore <span className="text-blue-500">Servers</span>
        </h1>
        <p className="text-gray-400 max-w-2xl">
          Pilih server favoritmu untuk melihat statistik real-time, daftar driver yang sedang online, dan download mod pack yang diperlukan.
        </p>
      </div>

      {/* SERVER GRID */}
      {practices && practices.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {practices.map((practices) => (
            <Link
              key={practices.id}
              href={`/practice-servers/${practices.id}`}
              className="group bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden hover:border-blue-500/50 hover:shadow-[0_0_30px_-10px_rgba(59,130,246,0.3)] transition-all duration-300"
            >
              {/* Image Thumbnail */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={practices.image_url || 'https://picsum.photos/600/300'}
                  alt={practices.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 right-3">
                  <span className="bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/20 uppercase tracking-widest">
                    Assetto Corsa
                  </span>
                </div>
              </div>

              {/* Content Details */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-white group-hover:text-blue-400 transition mb-2">
                  {practices.name}
                </h2>
                
                <div className="flex items-center justify-between mt-6">
                  <span className="text-sm text-gray-500 font-medium">View Server Details</span>
                  <div className="h-8 w-8 rounded-full bg-gray-800 flex items-center justify-center group-hover:bg-blue-600 transition">
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className="h-4 w-4 text-white" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-gray-900/50 rounded-3xl border border-dashed border-gray-800">
          <p className="text-gray-500 italic">Belum ada server yang terdaftar.</p>
        </div>
      )}
    </div>
  )
}