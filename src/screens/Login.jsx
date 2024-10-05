import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth'; // Import Firebase auth methods
import { auth, db } from './Firebase'; // Firebase config
import './Login.css';

function Login() {
  const [isSeller, setIsSeller] = useState(false); // Toggle between Buyer and Seller
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // Authenticate using Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Here, you can implement role-based logic by checking the role (buyer/seller)
      // For example, if you store user roles in Firestore, you can fetch the user document to check
      if (isSeller) {
        navigate('/seller'); // Redirect seller
      } else {
        navigate('/buyer'); // Redirect buyer
      }

      alert(`Logged in as ${isSeller ? 'Seller' : 'Buyer'}: ${email}`);
    } catch (error) {
      setError('Failed to login. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <h2>Login to Circular Economy Platform</h2>

      <div className="toggle-buttons">
        <button
          onClick={() => setIsSeller(false)}
          className={`px-4 py-2 mr-2 font-bold ${!isSeller ? 'bg-blue-600 text-white' : 'bg-gray-300'} rounded-lg`}
        >
          Buyer Login
        </button>
        <button
          onClick={() => setIsSeller(true)}
          className={`px-4 py-2 font-bold ${isSeller ? 'bg-blue-600 text-white' : 'bg-gray-300'} rounded-lg`}
        >
          Seller Login
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {error && <p style={{ color: 'red' }}>{error}</p>}

        <div className="input-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label>Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="login-button">
          {isSeller ? 'Login as Seller' : 'Login as Buyer'}
        </button>

        <p>
          Not registered? <Link to="/signUp">Sign Up here</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
