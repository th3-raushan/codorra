import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import '../VerificationResult/VerificationResult.css';
import logoIcon from "./../../assets/truthlens-logo.png"

// ─── Verdict helpers (same as VerificationPage) ────────────────────
const getStatus = (verdict) => {
    switch (verdict) {
        case 'TRUE': return 'verified';
        case 'PARTIALLY_TRUE': return 'uncertain';
        case 'FALSE': return 'hallucinated';
        default: return null;
    }
};

const getStatusLabel = (verdict) => {
    switch (verdict) {
        case 'TRUE': return 'Verified';
        case 'PARTIALLY_TRUE': return 'Uncertain';
        case 'FALSE': return 'Hallucinated';
        default: return verdict;
    }
};

const getStatusIcon = (status) => {
    switch (status) {
        case 'verified': return '✓';
        case 'uncertain': return '?';
        case 'hallucinated': return '✕';
        default: return '';
    }
};

const getScoreColor = (score) => {
    if (score >= 75) return '#006644';
    if (score >= 50) return '#998100';
    return '#DE350B';
};

const getConfidencePercent = (confidence) => Math.round(confidence * 100) + '%';

const normalize = (text) =>
    text.toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();

const sentenceMatchesClaim = (sentence, claim) => {
    const normSentence = normalize(sentence);
    const normClaim = normalize(claim);

    if (normSentence.includes(normClaim) || normClaim.includes(normSentence)) {
        return true;
    }

    const sentenceWords = normSentence.split(' ');
    const claimWords = normClaim.split(' ');

    let matchCount = 0;
    for (const word of claimWords) {
        if (word.length > 2 && sentenceWords.includes(word)) {
            matchCount++;
        }
    }

    const significantWords = claimWords.filter(w => w.length > 2).length;
    if (significantWords === 0) return false;

    return matchCount / significantWords >= 0.65;
};

const buildHighlightedContent = (text, results, onClaimClick) => {
    const lines = text.split('\n');

    return lines.map((line, lineIdx) => {
        if (line.trim() === '') {
            return <br key={`br-${lineIdx}`} />;
        }

        const sentences = line.match(/[^.!?]+[.!?]+/g) || [line];

        const lineContent = sentences.map((sentence, sIdx) => {
            const trimmed = sentence.trim();
            if (!trimmed) return null;

            let matchedResult = null;
            let matchedIndex = -1;
            for (let i = 0; i < results.length; i++) {
                if (sentenceMatchesClaim(trimmed, results[i].originalClaim)) {
                    matchedResult = results[i];
                    matchedIndex = i;
                    break;
                }
            }

            if (matchedResult) {
                const status = getStatus(matchedResult.verdict);
                return (
                    <span key={`${lineIdx}-${sIdx}`}>
                        <span
                            className={`highlight ${status}`}
                            onClick={() => onClaimClick(matchedIndex)}
                            style={{ cursor: 'pointer' }}
                        >
                            {trimmed}
                        </span>
                        {' '}
                    </span>
                );
            }

            return <span key={`${lineIdx}-${sIdx}`}>{trimmed + ' '}</span>;
        });

        return (
            <div key={`line-${lineIdx}`} className="content-line">
                {lineContent}
            </div>
        );
    });
};

// ─── Component ─────────────────────────────────────────────────────
export default function TruthLensDashboard() {
    const navigate = useNavigate();

    // Auth guard
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    useEffect(() => {
        if (!token) {
            navigate('/signIn');
        }
    }, [token, navigate]);

    // Parse user
    const user = storedUser ? JSON.parse(storedUser) : null;
    const userName = user?.name || 'User';
    const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    // State
    const [history, setHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [content, setContent] = useState('');
    const [isVerifying, setIsVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState('');
    const [activeView, setActiveView] = useState('input'); // 'input' | 'results'
    const [currentResult, setCurrentResult] = useState(null);
    const [originalContent, setOriginalContent] = useState('');
    const [activeHistoryId, setActiveHistoryId] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [selectedClaimIdx, setSelectedClaimIdx] = useState(0);

    // ─── Fetch history on mount ─────────────────────────────────────
    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/history', {
                headers: { 'Authorization': `Bearer ${token}` },
                cache: 'no-store'
            });
            const data = await res.json();
            if (data.success) {
                setHistory(data.data);
            }
        } catch (err) {
            console.error('Failed to fetch history:', err);
        } finally {
            setHistoryLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchHistory();
    }, [token]);

    // ─── Verify content ─────────────────────────────────────────────
    const handleVerify = async () => {
        const trimmed = content.trim();
        if (!trimmed) {
            setVerifyError('Please paste some content to verify.');
            return;
        }

        setVerifyError('');
        setIsVerifying(true);

        try {
            const response = await fetch('/api/verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                    'Authorization': `Bearer ${token}`
                },
                body: trimmed
            });

            const text = await response.text();
            if (!text) throw new Error('Server returned an empty response.');

            let data;
            try { data = JSON.parse(text); } catch { throw new Error('Invalid server response.'); }

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Verification failed.');
            }

            if (!data.data?.verification) {
                setVerifyError('No verifiable claims found in the content.');
                setIsVerifying(false);
                return;
            }

            setCurrentResult(data);
            setOriginalContent(trimmed);
            setActiveView('results');
            setActiveHistoryId(null);
            setSelectedClaimIdx(0);

            // Refresh history
            fetchHistory();

        } catch (err) {
            setVerifyError(err.message || 'Something went wrong.');
        } finally {
            setIsVerifying(false);
        }
    };

    // ─── Load a history item ────────────────────────────────────────
    const loadHistoryItem = async (id) => {
        try {
            setActiveHistoryId(id);
            setVerifyError('');

            const res = await fetch(`/api/history/${id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();

            if (data.success) {
                setCurrentResult(data.data.apiResponse);
                setOriginalContent(data.data.originalContent);
                setActiveView('results');
                setSelectedClaimIdx(0);
                setContent('');
            }
        } catch (err) {
            console.error('Failed to load verification:', err);
        }
    };

    // ─── New Verification ───────────────────────────────────────────
    const handleNewVerification = () => {
        setActiveView('input');
        setCurrentResult(null);
        setOriginalContent('');
        setContent('');
        setVerifyError('');
        setActiveHistoryId(null);
        setSelectedClaimIdx(0);
    };

    // ─── Logout ─────────────────────────────────────────────────────
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/signIn');
    };

    // ─── Results computation ────────────────────────────────────────
    const results = currentResult?.data?.verification?.results || [];
    const summary = currentResult?.data?.verification?.summary || {};
    const score = summary.overallTrustScore || 0;
    const scoreColor = getScoreColor(score);

    const verdictCounts = useMemo(() => {
        let verified = 0, uncertain = 0, hallucinated = 0;
        results.forEach(r => {
            if (r.verdict === 'TRUE') verified++;
            else if (r.verdict === 'PARTIALLY_TRUE') uncertain++;
            else if (r.verdict === 'FALSE') hallucinated++;
        });
        return { verified, uncertain, hallucinated };
    }, [results]);

    // Donut chart
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const dashArray = (score / 100) * circumference;

    const selectedResult = results[selectedClaimIdx];

    // Highlighted content (same logic as VerificationPage)
    const highlightedContent = useMemo(
        () => originalContent ? buildHighlightedContent(originalContent, results, setSelectedClaimIdx) : null,
        [originalContent, results]
    );

    if (!token) return null;

    return (
        <div className="truthlens-app">
            {/* ── Sidebar ─────────────────────────────── */}
            <aside className={`truthlens-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="brand-row">
                    <img src={logoIcon} alt="TruthLens Logo" className="logo-icon" />
                    <button
                        className="sidebar-collapse-btn"
                        type="button"
                        aria-label="Collapse sidebar"
                        onClick={() => setSidebarCollapsed(true)}
                    >
                        ‹
                    </button>
                </div>

                <button className="new-verification-btn" type="button" onClick={handleNewVerification}>
                    <span className="btn-plus">+</span>
                    <span>New Verification</span>
                </button>

                <div className="sidebar-section">
                    <div className="sidebar-section-title">Previous Verifications</div>
                    <ul className="verification-list">
                        {historyLoading ? (
                            <li className="verification-item history-loading">Loading...</li>
                        ) : history.length === 0 ? (
                            <li className="verification-item history-empty">No verifications yet</li>
                        ) : (
                            history.map((item) => (
                                <li
                                    key={item._id}
                                    className={`verification-item ${activeHistoryId === item._id ? 'active' : ''}`}
                                    onClick={() => loadHistoryItem(item._id)}
                                >
                                    <span className="verification-caret">›</span>
                                    <span className="verification-item-text">{item.title}</span>
                                </li>
                            ))
                        )}
                    </ul>
                </div>



                <div className="user-profile-block">
                    <div className="user-profile-title-row">
                        <div className="user-profile-title">User Profile</div>
                        <div className="user-profile-doublechev">«</div>
                    </div>

                    <div className="user-info">
                        <div className="avatar avatar-large initials-avatar" aria-hidden="true">
                            {userInitials}
                        </div>
                        <div className="user-name">{userName}</div>
                    </div>

                    <button className="settings-row logout-btn" type="button" onClick={handleLogout}>
                        <span className="settings-gear">⏻</span>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* ── Sidebar Toggle (visible when collapsed) ──── */}
            <button
                className={`sidebar-toggle-btn ${sidebarCollapsed ? 'visible' : ''}`}
                type="button"
                aria-label="Toggle sidebar"
                onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            >
                ☰
            </button>

            {/* ── Main Content ────────────────────────── */}
            <main className="truthlens-main">

                {activeView === 'input' ? (
                    /* ── Input View ─────────────────────── */
                    <>
                    <header className="topbar">
                        <div className="topbar-spacer" />
                        <div className="topbar-profile">
                            <div className="avatar avatar-small initials-avatar" aria-hidden="true">
                                {userInitials}
                            </div>
                            <span className="topbar-user-name">{userName}</span>
                        </div>
                    </header>
                    <section className="hero-panel">
                        <h1>What would you like to verify today?</h1>

                        <div className="verify-card">
                            <textarea
                                className="verify-input"
                                placeholder="Paste AI-generated content to verify..."
                                aria-label="Paste AI-generated content to verify"
                                value={content}
                                onChange={(e) => {
                                    setContent(e.target.value);
                                    if (verifyError) setVerifyError('');
                                }}
                                disabled={isVerifying}
                            />
                            <div className="verify-card-footer">
                                {verifyError && <span className="verify-error">{verifyError}</span>}
                                <button
                                    className="verify-btn"
                                    type="button"
                                    onClick={handleVerify}
                                    disabled={isVerifying}
                                >
                                    {isVerifying ? (
                                        <>
                                            <span className="verify-spinner"></span>
                                            Analyzing...
                                        </>
                                    ) : 'Verify'}
                                </button>
                            </div>
                        </div>

                        <div className="results-divider" />
                        <section className="results-placeholder" aria-hidden="true">
                            <div className="results-line" />
                            <div className="results-line" />
                            <div className="results-line" />
                            <div className="results-line" />
                            <div className="results-line" />
                            <div className="results-line" />
                        </section>
                    </section>
                    </>
                ) : (
                    /* ── Results View (VerificationPage layout) ── */
                    <div className="dashboard-results-wrapper">

                        <div className="main-content">
                            {/* Trust Score Card */}
                            <section className="card trust-score-card">
                                <div className="donut-chart-container">
                                    <svg viewBox="0 0 100 100">
                                        <circle className="donut-track" cx="50" cy="50" r={radius} />
                                        <circle
                                            className="donut-progress"
                                            cx="50" cy="50" r={radius}
                                            stroke={scoreColor}
                                            strokeDasharray={`${dashArray} ${circumference}`}
                                        />
                                    </svg>
                                    <div className="donut-center-text">
                                        <span className="score-number">{score}</span>
                                        <span className="score-denominator">/ 100</span>
                                    </div>
                                </div>
                                <div className="trust-score-details">
                                    <span className="trust-score-badge">Trust Score</span>
                                    <p className="trust-description">
                                        {summary.credibilityComment}
                                    </p>
                                    <div className="verdict-summary">
                                        <div className="verdict-summary-item">
                                            <span className="verdict-dot verified"></span>
                                            <span>Verified: {verdictCounts.verified}</span>
                                        </div>
                                        <div className="verdict-summary-item">
                                            <span className="verdict-dot uncertain"></span>
                                            <span>Uncertain: {verdictCounts.uncertain}</span>
                                        </div>
                                        <div className="verdict-summary-item">
                                            <span className="verdict-dot hallucinated"></span>
                                            <span>Hallucinated: {verdictCounts.hallucinated}</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* AI-Generated Content & Verification Card */}
                            <section className="card content-card">
                                <h3 className="card-heading">AI-Generated Content &amp; Verification</h3>
                                <div className="content-body">
                                    <div className="content-paragraph">
                                        {highlightedContent}
                                    </div>
                                </div>
                                <div className="content-legend">
                                    <div className="legend-item">
                                        <span className="legend-color green"></span>
                                        <span>Green: Verified</span>
                                    </div>
                                    <div className="legend-item">
                                        <span className="legend-color yellow"></span>
                                        <span>Yellow: Uncertain</span>
                                    </div>
                                    <div className="legend-item">
                                        <span className="legend-color red"></span>
                                        <span>Red: Hallucinated</span>
                                    </div>
                                </div>
                            </section>

                            {/* Right Column: Claims + Explanation */}
                            <div className="right-column">
                                <section className="card claims-card">
                                    <h3 className="card-heading">Claims Analysis</h3>
                                    <div className="claims-list">
                                        {results.map((result, index) => {
                                            const status = getStatus(result.verdict);
                                            const isSelected = index === selectedClaimIdx;
                                            return (
                                                <div
                                                    key={result.claimId || index}
                                                    className={`claim-item verdict-${result.verdict.toLowerCase()} ${isSelected ? 'selected' : ''}`}
                                                    onClick={() => setSelectedClaimIdx(index)}
                                                >
                                                    <div className="claim-header">
                                                        <span className={`claim-status-badge ${status}`}>
                                                            <span className="claim-status-icon">{getStatusIcon(status)}</span>
                                                            {getStatusLabel(result.verdict)}
                                                        </span>
                                                    </div>
                                                    <p className="claim-text">{result.originalClaim}</p>
                                                    <div className="claim-meta">
                                                        <div className="claim-meta-item">
                                                            <span className="claim-meta-label">Citation</span>
                                                            <span className="claim-meta-value">
                                                                {result.sources?.[0]?.title?.substring(0, 35) || 'No credible source found'}
                                                                {result.sources?.[0]?.title?.length > 35 ? '...' : ''}
                                                            </span>
                                                        </div>
                                                        <div className="claim-meta-item">
                                                            <span className="claim-meta-label">Confidence</span>
                                                            <span className="claim-meta-value">{getConfidencePercent(result.confidence)}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>

                                <section className="card explanation-card">
                                    <h3 className="card-heading">Detailed Explanation &amp; Evidence</h3>
                                    {selectedResult && (
                                        <div className="explanation-body">
                                            <p className="explanation-claim-label">
                                                Explanation for Claim {selectedClaimIdx + 1}:
                                            </p>
                                            <p className="explanation-text">
                                                {selectedResult.explanation}
                                            </p>
                                            <div className="evidence-status">
                                                <span className="evidence-status-label">Evidence Status: </span>
                                                <span className={`evidence-status-value ${selectedResult.confidence >= 0.9 ? 'strong' :
                                                    selectedResult.confidence >= 0.7 ? 'moderate' : 'weak'
                                                    }`}>
                                                    {selectedResult.confidence >= 0.9 ? 'Strong' :
                                                        selectedResult.confidence >= 0.7 ? 'Moderate' : 'Weak'}
                                                </span>
                                            </div>
                                            <div className="sources-section">
                                                <h4 className="sources-heading">Sources:</h4>
                                                {selectedResult.sources?.map((source, sIdx) => (
                                                    <div key={sIdx} className="source-item">
                                                        <p className="source-title">
                                                            <a href={source.url} target="_blank" rel="noopener noreferrer">
                                                                {source.title}
                                                            </a>
                                                        </p>
                                                        <p className="source-snippet">{source.snippet}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </section>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
