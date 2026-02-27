const fs = require('fs');
const pdf = require('pdf-parse');

exports.extractTextFromPDF = async (filePath) => {
    try {
        let dataBuffer = fs.readFileSync(filePath);
        const data = await pdf(dataBuffer);
        return data.text;
    } catch (error) {
        console.error("Error extracting text from PDF", error);
        throw new Error("Could not extract text from document");
    }
};
