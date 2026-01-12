import React from 'react';

const Sidebar = ({ isAuthPage = false }) => {
  // Auth page sidebar - Enhanced with DARKER, more vibrant colors and WIDER to cover almost half screen
  if (isAuthPage) {
    return (
      <aside className="hidden lg:flex w-[35vw] bg-gradient-to-br from-[#0369A1] via-[#075985] to-[#0C4A6E] min-h-screen p-12 flex-col relative overflow-hidden shadow-2xl">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-15">
          <div 
            className="absolute top-0 left-0 w-full h-full animate-pulse"
            style={{
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(255,255,255,0.4) 0%, transparent 50%),
                radial-gradient(circle at 80% 80%, rgba(255,255,255,0.3) 0%, transparent 50%),
                linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.15) 55%, transparent 55%)
              `,
              backgroundSize: '100% 100%, 100% 100%, 40px 40px'
            }}
          />
        </div>

        {/* Decorative Elements - More visible */}
        <div className="absolute top-20 right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-40 left-10 w-40 h-40 bg-white opacity-10 rounded-full blur-3xl"></div>

        {/* Logo Section */}
        <div className="relative z-10 mb-8 flex flex-col items-center text-center">
          <div className="flex items-center gap-3 mb-12 justify-center">
            <div className="bg-white rounded-xl px-5 py-2.5 shadow-lg inline-flex">
              <span className="text-[#0284C7] font-bold text-2xl tracking-tight">Legal</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">City</span>
          </div>
          
          {/* Tagline with better styling */}
          <div className="space-y-2">
            <h2 className="text-white text-2xl font-semibold leading-tight">
              Discover the world's top
            </h2>
            <h2 className="text-white text-2xl font-semibold leading-tight">
              Lawyers
            </h2>
            <div className="w-16 h-0.5 bg-white/70 rounded-full mt-4 mx-auto"></div>
          </div>
        </div>

        {/* Feature badges - More visible */}
        <div className="relative z-10 mt-auto space-y-4">
          <div className="flex items-center gap-3 text-white/90 text-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>Trusted by 10,000+ users</span>
          </div>
          <div className="flex items-center gap-3 text-white/90 text-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>Verified legal professionals</span>
          </div>
          <div className="flex items-center gap-3 text-white/90 text-sm">
            <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
            <span>Secure & confidential</span>
          </div>
        </div>
      </aside>
    );
  }

  // Regular sidebar for other pages
  return (
    <aside className="w-64 bg-gradient-to-br from-blue-600 to-blue-700 text-white min-h-screen shadow-xl">
      {/* Your existing regular sidebar code */}
    </aside>
  );
};

export default Sidebar;