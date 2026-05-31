import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_BASE_URL from '../../config/api';
import './HomePage.css';
import logoIcon from '../../assets/truthlens-logo.png';

const HomePage = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleVerify = async () => {
        const trimmed = content.trim();
        if (!trimmed) {
            setError('Please paste some AI-generated content before verifying.');
            return;
        }

        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/verify`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: trimmed,
            });

            // Guard against empty/non-JSON responses (e.g. proxy timeout)
            const text = await response.text();
            if (!text) {
                throw new Error('Server returned an empty response. The request may have timed out — please try again.');
            }

            let data;
            try {
                data = JSON.parse(text);
            } catch {
                throw new Error('Server returned an invalid response. Please try again.');
            }

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Verification failed. Please try again.');
            }

            // Guard: server returned success but no verifiable claims
            if (!data.data?.verification || !data.data.verification.results?.length) {
                setError(data.message || 'No verifiable claims were found in the content. Please try different content.');
                return;
            }

            navigate('/results', {
                state: {
                    apiData: data,
                    originalContent: trimmed,
                },
            });
        } catch (err) {
            setError(err.message || 'Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="home-page">
            <div className="home-container">
                <div className="logo-section">
                    <img src={logoIcon} alt="TruthLens" className="logo" />
                </div>

                <h1 className="headline">
                    Verify AI-generated content before you trust it.
                </h1>
                <p className="subheadline">
                    We check claims, citations, and evidence for accuracy.
                </p>

                <div className="input-section">
                    <textarea
                        className="content-textarea"
                        placeholder="Paste any AI-generated text here for analysis..."
                        value={content}
                        onChange={(e) => {
                            setContent(e.target.value);
                            if (error) setError('');
                        }}
                        disabled={isLoading}
                    />
                    <p className="helper-text">
                        For example, paste an answer from a chatbot, a generated article, or summary.
                    </p>
                </div>

                {error && <p className="error-message">{error}</p>}

                <button
                    className={`verify-button ${isLoading ? 'verify-button--loading' : ''}`}
                    onClick={handleVerify}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <>
                            <span className="spinner" />
                            Analyzing Content...
                        </>
                    ) : (
                        'Verify Content'
                    )}
                </button>
            </div>
        </main>
    );
};

export default HomePage;
