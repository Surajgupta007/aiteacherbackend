const fs = require('fs');
const pdf = require('pdf-parse');
const https = require('https');
const http = require('http');

const fetchBuffer = (url) => {
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https') ? https : http;
        client.get(url, (res) => {
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        }).on('error', reject);
    });
};

exports.extractTextFromPDF = async (filePath) => {
    try {
        let dataBuffer;
        if (filePath.startsWith('http')) {
            // Fetch from Cloudinary URL
            dataBuffer = await fetchBuffer(filePath);
        } else {
            // Legacy: read from local disk
            dataBuffer = fs.readFileSync(filePath);
        }
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error("Error extracting text from PDF", error);
        throw new Error("Could not extract text from document");
    }
};
