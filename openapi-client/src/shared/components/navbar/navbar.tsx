import { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="w-full bg-white shadow-md fixed top-0 left-0 z-50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <div className="text-xl font-bold text-blue-600">
          TestAPI
        </div>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-8">
          <a href="#" className="text-gray-700 hover:text-blue-600 transition">Home</a>
          <a href="#" className="text-gray-700 hover:text-blue-600 transition">Services</a>
          <a href="#" className="text-gray-700 hover:text-blue-600 transition">About</a>
          <a href="#" className="text-gray-700 hover:text-blue-600 transition">Contact</a>
        </div>

        {/* Auth Buttons */}
        <div className="hidden md:flex items-center gap-4">
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            Login
          </button>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
            Sign Up
          </button>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-gray-700"
          onClick={() => setOpen(!open)}
        >
          ☰
        </button>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden text-gray-700 bg-white shadow-md px-6 py-4 space-y-4">
          <a href="#" className="block">Home</a>
          <a href="#" className="block">Services</a>
          <a href="#" className="block">About</a>
          <a href="#" className="block">Contact</a>
          <hr />
          <button className="block w-full text-left text-blue-600">Login</button>
          <button className="block w-full text-left text-blue-600 font-semibold">
            Sign Up
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
