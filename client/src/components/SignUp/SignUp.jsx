import React, { useState } from 'react';
import {Link, useNavigate} from 'react-router-dom'
import API_BASE_URL from '../../config/api';
import truthLensLogo from '../../assets/truthlens-logo.png'
import googleIcon from '../../assets/google-icon-logo.svg'
import './SignUp.css';

const TruthLensSignup = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error when user starts typing
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // --- Client-side validation ---
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreed) {
      setError('You must agree to the Terms & Conditions.');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Registration failed. Please try again.');
        return;
      }

      // Registration successful
      setSuccess('Account created successfully! Redirecting to sign in...');

      // Redirect to sign in page after a short delay
      setTimeout(() => {
        navigate('/signIn');
      }, 1500);

    } catch (err) {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signup-page">

      <main className="signup-content">
        <div className="auth-card">
          <h2 className="card-headline">Create your TruthLens account</h2>
          <p className="card-subtitle">Start verifying AI-generated content with confidence.</p>

          {error && <div className="form-message form-error">{error}</div>}
          {success && <div className="form-message form-success">{success}</div>}

          <form className="signup-form" onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="fullName" className="input-label">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="text-input"
                placeholder=""
                aria-required="true"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="emailAddress" className="input-label">Email Address</label>
              <input
                type="email"
                id="emailAddress"
                name="email"
                className="text-input"
                placeholder=""
                aria-required="true"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div className="input-group">
              <label htmlFor="password" className="input-label">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                className="text-input"
                placeholder=""
                aria-required="true"
                minLength="6"
                value={formData.password}
                onChange={handleChange}
              />
              <span className="helper-text">Must be at least 6 characters.</span>
            </div>

            <div className="input-group">
              <label htmlFor="confirmPassword" className="input-label">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                className="text-input"
                placeholder=""
                aria-required="true"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>

            <div className="terms-container">
              <input
                type="checkbox"
                id="termsCheckbox"
                name="termsAgreement"
                checked={agreed}
                onChange={() => setAgreed(!agreed)}
                className="checkbox-input"
              />
              <label htmlFor="termsCheckbox" className="terms-label">
                I agree to the <a href="#" className="terms-link">Terms & Conditions</a>
              </label>
            </div>

            <button type="submit" className="create-account-btn" disabled={loading}>
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
            
            <button type="button" className="google-signup-btn">
              <img src={googleIcon} alt="Google Logo" className="google-icon" />
              Continue with Google
            </button>
          </form>

          <div className="signin-footer">
            <p className="signin-text">
            Already have an account? <Link to='/signIn' className="signin-link">Sign in</Link>
            </p>
          </div>
        </div>
      </main>

      <div className="decorative-sparkle"></div>
    </div>
  );
};

export default TruthLensSignup;
