import { useState } from "react";
import { useAuth } from "@/shared/contexts/AuthContext";
// AuthModal removed from here

interface NavbarProps {
  onAuthClick: () => void;
}

const Navbar = ({ onAuthClick }: NavbarProps) => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();


  return (
    <nav className="w-full bg-gray-950/80 backdrop-blur-md border-b border-gray-800 sticky top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-600/20">
             <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
             </svg>
          </div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-500">
            ApitTest
          </span>
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Workspace</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Collections</a>
          <a href="#" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Docs</a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Logged in as</span>
                <span className="text-sm font-medium text-blue-400">{user.email}</span>
              </div>
              <button 
                onClick={logout}
                className="px-4 py-2 bg-gray-900 border border-gray-800 text-gray-300 rounded-xl hover:bg-gray-800 hover:text-white transition-all text-sm font-bold"
              >
                LOGOUT
              </button>
            </div>
          ) : (
            <button 
              onClick={onAuthClick}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-all shadow-lg shadow-blue-600/20 text-sm font-bold transform active:scale-95"
            >
              LOGIN / SIGNUP
            </button>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-gray-400"
          onClick={() => setOpen(!open)}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={open ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden border-t border-gray-800 bg-gray-950 px-6 py-6 space-y-6">
          <a href="#" className="block text-gray-400 hover:text-white">Workspace</a>
          <a href="#" className="block text-gray-400 hover:text-white">Collections</a>
          {user ? (
             <div className="pt-4 border-t border-gray-800 space-y-4">
               <p className="text-sm text-blue-400">{user.email}</p>
               <button onClick={logout} className="block w-full text-left text-gray-400">Logout</button>
             </div>
          ) : (
            <button 
              onClick={() => { onAuthClick(); setOpen(false); }}
              className="block w-full text-left text-blue-400 font-bold"
            >
              Login / Sign Up
            </button>
          )}
        </div>
      )}

      {/* Modal moved to App.tsx */}
    </nav>
  );
};

export default Navbar;
