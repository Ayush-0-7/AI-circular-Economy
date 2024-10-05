import React from "react";
import './App.css';
import { useNavigate } from "react-router-dom";

function App() {
  const navigate = useNavigate();

  return (
    <div className="app flex flex-col items-center justify-center min-h-screen bg-gray-100 space-y-8">
      {/* First Section */}
      <header className="text-center bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">Welcome to the AI-Driven Circular Economy Platform</h1>
        <p className="text-gray-700 mb-6">
          Our platform leverages Generative AI to facilitate the re-use of industrial by-products or waste materials, enabling collaboration across industries and promoting a circular economy model. By connecting companies that have excess materials with those that can repurpose them, we aim to reduce landfill waste and create new revenue streams for businesses.
        </p>
        <button 
          className="login-button bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition duration-200"
          onClick={() => navigate('/login')}
        >
          Login
        </button>
      </header>

      {/* Second Section */}
      <header className="text-center bg-white p-8 rounded-lg shadow-lg w-full max-w-3xl">
        <h1 className="text-3xl font-bold mb-4">AI-Powered Product Design</h1>
        <p className="text-gray-700 mb-6">
          Unlock the power of AI to design eco-friendly products. Our platform allows users to generate product designs using AI that not only meet functional requirements but also minimize environmental impact. Whether you're looking for alternative materials or innovative product concepts, our AI-driven design tool helps bring your ideas to life with sustainability in mind.
        </p>
        <button 
          className="design-button bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700 transition duration-200"
          onClick={() => navigate('/design')}
        >
          Start Designing
        </button>
      </header>
    </div>
  );
}

export default App;
