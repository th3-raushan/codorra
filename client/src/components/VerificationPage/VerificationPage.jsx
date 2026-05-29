import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './VerificationPage.css';

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

    // Direct substring match (either direction)
    if (normSentence.includes(normClaim) || normClaim.includes(normSentence)) {
        return true;
    }

    // Word overlap — count shared significant words as a ratio
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

export default function VerificationPage() {
    const location = useLocation();
    const navigate = useNavigate();

    if (!location.state?.apiData || !location.state?.originalContent) {
        return (
            <div className="verification-page" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexDirection: 'column', gap: '16px', fontFamily: "'Inter', sans-serif"
            }}>
                <p style={{ color: '#5E6C84', fontSize: '16px' }}>
                    No verification data found. Please submit content first.
                </p>
                <button
                    onClick={() => navigate('/')}
                    style={{
                        padding: '12px 32px', backgroundColor: '#565E69', color: '#fff',
                        border: 'none', borderRadius: '24px', cursor: 'pointer',
                        fontSize: '15px', fontWeight: 500
                    }}
                >
                    Go to Homepage
                </button>
            </div>
        );
    }

    const { data } = location.state.apiData;
    const { verification } = data;
    const { summary, results } = verification;
    const originalContent = location.state.originalContent;

    const [selectedClaimIdx, setSelectedClaimIdx] = useState(0);

    const verdictCounts = useMemo(() => {
        let verified = 0, uncertain = 0, hallucinated = 0;
        results.forEach(r => {
            if (r.verdict === 'TRUE') verified++;
            else if (r.verdict === 'PARTIALLY_TRUE') uncertain++;
            else if (r.verdict === 'FALSE') hallucinated++;
        });
        return { verified, uncertain, hallucinated };
    }, [results]);

    const score = summary.overallTrustScore;
    const scoreColor = getScoreColor(score);
    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    const dashArray = (score / 100) * circumference;
    const dashOffset = circumference - dashArray;

    const selectedResult = results[selectedClaimIdx];

    const highlightedContent = useMemo(
        () => buildHighlightedContent(originalContent, results, setSelectedClaimIdx),
        [results]
    );

    return (
        <div className="verification-page">
            <main className="main-content">
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

                <div className="right-column">
                    <section className="card claims-card">
                        <h3 className="card-heading">Claims Analysis</h3>
                        <div className="claims-list">
                            {results.map((result, index) => {
                                const status = getStatus(result.verdict);
                                const isSelected = index === selectedClaimIdx;
                                return (
                                    <div
                                        key={result.claimId}
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
                    </section>
                </div>
            </main>
        </div>
    );
}
