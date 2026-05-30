import React, { useState } from 'react';
import {Link} from 'react-router-dom'
import truthLensLogo from '../../assets/truthlens-logo.png'
import googleIcon from '../../assets/google-icon-logo.svg'
import './SignUp.css';

const TruthLensSignup = () => {
  const [agreed, setAgreed] = useState(false);

  return (
    <div className="signup-page">

      <main className="signup-content">
        <div className="auth-card">
          <h2 className="card-headline">Create your TruthLens account</h2>
          <p className="card-subtitle">Start verifying AI-generated content with confidence.</p>

          <form className="signup-form">
            <div className="input-group">
              <label htmlFor="fullName" className="input-label">Full Name</label>
              <input
                type="text"
                id="fullName"
                name="fullName"
                className="text-input"
                placeholder=""
                aria-required="true"
              />
            </div>

            <div className="input-group">
              <label htmlFor="emailAddress" className="input-label">Email Address</label>
              <input
                type="email"
                id="emailAddress"
                name="emailAddress"
                className="text-input"
                placeholder=""
                aria-required="true"
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
                minLength="8"
              />
              <span className="helper-text">Must be at least 8 characters.</span>
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

            <button type="submit" className="create-account-btn">Create Account</button>
            
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