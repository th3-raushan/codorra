import { Link, useNavigate } from 'react-router-dom';
import logoIcon from "../../assets/truthlens-logo.png";
import heroIllustration from "../../assets/hero-illustration.png";
import "./LandingPage.css";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="landing-page">
      <nav className="navbar">
        <div className="logo-section">
          <img src={logoIcon} alt="TruthLens Logo" className="logo-icon" />
        </div>
        <div className="auth-section">
          <Link to='/signIn' className='sign-in-link'>Sign In</Link>
          <Link to='/signUp' className='btn btn-primary'>Create Account</Link>
        </div>
      </nav>
      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-content">
          <h1>
            Verify AI-Generated
            <br />
            Content. Detect
            <br />
            Hallucinations Instantly.
          </h1>
          <p>
            Build trust in AI-powered information. TruthLens automatically
            analyzes claims, checks citations, and identifies factual errors to
            ensure authenticity.
          </p>
          <div className="hero-buttons">
            <button className="btn btn-primary" onClick={() => navigate('/verification')}>Try Verification</button>
            <button className="btn btn-secondary" onClick={() => navigate('/signIn')}>Sign In</button>
          </div>
        </div>
        <div className="hero-illustration">
          <img
            src={heroIllustration}
            alt="AI Verification Illustration"
            className="illustration-img"
          />
        </div>
      </header>

    
    </div>
  );
}
