import React, { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-blue-600 p-4">
      <div className="container mx-auto flex justify-between items-center">
        {/* Logo */}
        <div className="text-white text-2xl font-bold">
          <Link to="/">Circular Economy</Link>
        </div>

        {/* Links for larger screens */}
        <div className="hidden md:flex space-x-6">
          <Link to="/" className="text-white hover:text-gray-300">Home</Link>
          <Link to="/login" className="text-white hover:text-gray-300">Login</Link>
        </div>

        {/* Hamburger Icon for mobile screens */}
        <div className="md:hidden">
          <button onClick={toggleMenu} className="text-white focus:outline-none">
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M4 6h16M4 12h16m-7 6h7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden bg-blue-600">
          <Link to="/" className="block px-4 py-2 text-white hover:bg-blue-700">Home</Link>
          <Link to="/about" className="block px-4 py-2 text-white hover:bg-blue-700">About</Link>
          <Link to="/login" className="block px-4 py-2 text-white hover:bg-blue-700">Login</Link>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
