import fs from 'fs';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

/**
 * Xử lý file template .docx
 * @param {string} templatePath Đường dẫn tới file template .docx
 * @param {object} data Dữ liệu (chứa Text và URL) để thay thế vào template
 * @returns {Buffer} Buffer của file .docx đã chèn dữ liệu
 */
export function generateDocxBuffer(templatePath, data) {
    try {
        const content = fs.readFileSync(templatePath, 'binary');
        const zip = new PizZip(content);
        
        const doc = new Docxtemplater(zip, {
            paragraphLoop: true,
            linebreaks: true,
        });

        // Chèn dữ liệu vào template
        doc.render(data);

        // Sinh ra buffer để đẩy lên Drive
        const buf = doc.getZip().generate({
            type: 'nodebuffer',
            compression: 'DEFLATE',
        });

        return buf;
    } catch (error) {
        console.error('Lỗi khi render Docx Template:', error);
        throw error;
    }
}
