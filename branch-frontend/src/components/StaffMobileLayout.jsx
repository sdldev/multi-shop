import { Home, Users, User } from 'lucide-react';

export default function StaffMobileLayout({ children, currentView, onViewChange, branch, user }) {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Static Header - Always visible */}
      <div className="sticky top-0 z-30 bg-gradient-to-r from-orange-500 to-orange-600 text-white p-5 shadow-lg">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
              <span className="text-xl">🏪</span>
            </div>
            <div>
              <h1 className="text-base font-bold">{branch?.branch_name || 'Loading...'}</h1>
              <p className="text-xs opacity-90">{user?.full_name}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area - Flex grow to fill space */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-md mx-auto px-4 py-4 pb-20">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Fixed at bottom */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30 safe-area-bottom">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-around py-2 px-1">
            <button
              onClick={() => onViewChange('home')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-all duration-200 ${
                currentView === 'home' 
                  ? 'text-orange-500 bg-orange-50 scale-105' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
              aria-label="Beranda"
              aria-current={currentView === 'home' ? 'page' : undefined}
            >
              <Home className="h-6 w-6" />
              <span className="text-xs font-medium">Beranda</span>
            </button>
            
            <button
              onClick={() => onViewChange('customer')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-all duration-200 ${
                currentView === 'customer' 
                  ? 'text-orange-500 bg-orange-50 scale-105' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
              aria-label="Customer"
              aria-current={currentView === 'customer' ? 'page' : undefined}
            >
              <Users className="h-6 w-6" />
              <span className="text-xs font-medium">Customer</span>
            </button>
            
            <button
              onClick={() => onViewChange('profile')}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg flex-1 transition-all duration-200 ${
                currentView === 'profile' 
                  ? 'text-orange-500 bg-orange-50 scale-105' 
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
              aria-label="Profil"
              aria-current={currentView === 'profile' ? 'page' : undefined}
            >
              <User className="h-6 w-6" />
              <span className="text-xs font-medium">Profil</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  );
}
