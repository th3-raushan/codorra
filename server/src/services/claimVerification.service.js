const claimVerificationPrompt = require('./../prompts/claimVerification.prompt');

const VERDICT_WEIGHTS = {
    TRUE: 100,
    PARTIALLY_TRUE: 50,
    UNVERIFIABLE: 30,
    FALSE: 0,
};

const normalizeResponseText = (text) => {
    return String(text || '')
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();
};

const verifySingleClaim = async (claim) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
        throw new Error('PERPLEXITY_API_KEY is not configured');
    }

    try {
        const response = await fetch('https://api.perplexity.ai/chat/completions', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'sonar',
                messages: [
                    { role: 'system', content: claimVerificationPrompt },
                    { role: 'user', content: `Verify this claim: "${claim.claim}"` },
                ],
                temperature: 0.1,
                max_tokens: 1024,
            }),
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(`Perplexity API error: ${response.status} - ${errorData}`);
        }

        const data = await response.json();
        const responseText = normalizeResponseText(data?.choices?.[0]?.message?.content);

        const verificationResult = JSON.parse(responseText);

        return {
            claimId: claim.id,
            originalClaim: claim.claim,
            claimType: claim.claimType || 'other',
            ...verificationResult,
        };
    } catch (error) {
        console.error(`Error verifying claim ${claim.id}:`, error.message);
        return {
            claimId: claim.id,
            originalClaim: claim.claim,
            claimType: claim.claimType || 'other',
            verdict: 'UNVERIFIABLE',
            confidence: 0,
            explanation: `Verification failed: ${error.message}`,
            sources: [],
            error: true,
        };
    }
};

const runWithConcurrency = async (items, worker, concurrency = 4) => {
    if (!items?.length) return [];

    const results = new Array(items.length);
    let nextIndex = 0;

    const runners = Array.from(
        { length: Math.min(concurrency, items.length) },
        async () => {
            while (true) {
                const currentIndex = nextIndex++;
                if (currentIndex >= items.length) return;

                console.log(`Verifying claim ${currentIndex + 1}/${items.length}: ${items[currentIndex].id}`);
                results[currentIndex] = await worker(items[currentIndex]);
            }
        }
    );

    await Promise.all(runners);
    return results;
};

const verifyClaims = async (claims, concurrency = 4) => {
    if (!claims?.length) return [];

    return runWithConcurrency(claims, verifySingleClaim, concurrency);
};

const buildSummary = (claims, verificationResults, processingTimeMs) => {
    let verifiedCount = 0;
    let falseCount = 0;
    let partiallyTrueCount = 0;
    let unverifiableCount = 0;
    let confidenceSum = 0;

    for (const result of verificationResults) {
        const verdict = result?.verdict;

        if (verdict === 'TRUE') verifiedCount += 1;
        else if (verdict === 'FALSE') falseCount += 1;
        else if (verdict === 'PARTIALLY_TRUE') partiallyTrueCount += 1;
        else if (verdict === 'UNVERIFIABLE') unverifiableCount += 1;

        confidenceSum += Number(result?.confidence || 0);
    }

    const totalClaims = verificationResults.length;

    const overallTrustScore = totalClaims > 0
        ? Math.round(
            (
                (verifiedCount * VERDICT_WEIGHTS.TRUE) +
                (partiallyTrueCount * VERDICT_WEIGHTS.PARTIALLY_TRUE) +
                (unverifiableCount * VERDICT_WEIGHTS.UNVERIFIABLE) +
                (falseCount * VERDICT_WEIGHTS.FALSE)
            ) / totalClaims
        )
        : 0;

    let credibilityComment;
    if (overallTrustScore >= 90) {
        credibilityComment = 'Highly credible — the vast majority of claims are verified and well-supported by evidence.';
    } else if (overallTrustScore >= 70) {
        credibilityComment = 'Mostly credible — most claims check out, but some require further scrutiny.';
    } else if (overallTrustScore >= 50) {
        credibilityComment = 'Moderately credible — a significant portion of claims are unverified or only partially true.';
    } else if (overallTrustScore >= 30) {
        credibilityComment = 'Low credibility — many claims are false or unverifiable; treat this content with caution.';
    } else {
        credibilityComment = 'Very low credibility — the majority of claims are false or unsupported; this content is unreliable.';
    }

    return {
        totalClaims: claims.length,
        verified: verifiedCount,
        false: falseCount,
        partiallyTrue: partiallyTrueCount,
        unverifiable: unverifiableCount,
        averageConfidence: totalClaims > 0 ? confidenceSum / totalClaims : 0,
        overallTrustScore,
        credibilityComment,
        processingTimeMs,
    };
};

const verifyExtractedClaims = async (claims) => {
    const startTime = Date.now();

    try {
        const verificationResults = await verifyClaims(claims, 4);
        const summary = buildSummary(claims, verificationResults, Date.now() - startTime);

        return { success: true, summary, results: verificationResults };
    } catch (error) {
        console.error('Verification service error:', error.message);
        return { success: false, error: error.message, summary: null, results: [] };
    }
};

module.exports = { verifySingleClaim, verifyClaims, verifyExtractedClaims };