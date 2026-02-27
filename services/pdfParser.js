const pdf = require('pdf-parse');
const https = require('https');
const http = require('http');

const fetchBuffer = (url) => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;

        client.get(url, (res) => {
            if (res.statusCode !== 200) {
                return reject(
                    new Error(`Failed to fetch PDF. Status: ${res.statusCode}`)
                );
            }

            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
};

exports.extractTextFromPDF = async (filePath) => {
    try {
        console.log("📖 Extracting from:", filePath);

        const buffer = await fetchBuffer(filePath);

        const data = await pdf(buffer);

        console.log("✅ Text Extracted");

        return data.text;

    } catch (error) {
        console.error("🔥 PDF Extraction Error:", error);
        throw new Error("Could not extract text from document");
    }
};