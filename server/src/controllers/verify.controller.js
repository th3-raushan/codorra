const claimExtractionService = require('./../services/claimExtraction.service');
const { verifyExtractedClaims } = require('./../services/claimVerification.service');

const MAX_CONTENT_LENGTH = 50000; // ~10,000 words

const verifyContent = async (req, res) => {
    const content = req.body;

    if (!content || typeof content !== 'string' || !content.trim()) {
        return res.status(400).json({
            success: false,
            error: 'Content is required and must be a non-empty string',
            timestamp: new Date().toISOString()
        });
    }

    if (content.length > MAX_CONTENT_LENGTH) {
        return res.status(400).json({
            success: false,
            error: `Content exceeds the maximum allowed length of ${MAX_CONTENT_LENGTH.toLocaleString()} characters. Please shorten your input.`,
            timestamp: new Date().toISOString()
        });
    }

    try {
        console.log('Extracting claims...');
        const extractionResult = await claimExtractionService(content);

        if (!extractionResult.success) {
            return res.status(400).json({
                success: false,
                error: extractionResult.error || 'Failed to extract claims',
                timestamp: new Date().toISOString()
            });
        }

        const claims = extractionResult.claims;

        if (!claims || claims.length === 0) {
            return res.status(200).json({
                success: true,
                timestamp: new Date().toISOString(),
                message: 'No verifiable claims found in the content',
                data: {
                    extractedClaims: [],
                    verification: null
                }
            });
        }

        console.log(`Verifying ${claims.length} claims...`);
        const verificationResult = await verifyExtractedClaims(claims);

        return res.status(200).json({
            success: true,
            timestamp: new Date().toISOString(),
            data: {
                extractedClaims: claims,
                verification: verificationResult
            }
        });
    }
    catch (err) {
        console.error('Verification controller error:', err);
        return res.status(500).json({
            success: false,
            error: err.message || 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
};

module.exports = verifyContent;
