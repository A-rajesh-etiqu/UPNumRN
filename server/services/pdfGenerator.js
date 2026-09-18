const PDFDocument = require('pdfkit');

function generateInvoicePDF(invoiceData) {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50, size: 'A4' });
            const buffers = [];
            
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });
            doc.on('error', reject);

            const {
                invoiceNo = "INV-000000",
                planName = "UpNum Plan",
                amount = "0.00",
                date = new Date().toLocaleDateString("en-IN"),
                billingCycle = "Monthly",
                userName = "Customer",
                upiId = "N/A",
                transactionId = "N/A",
                status = "SUCCESS",
            } = invoiceData;

            // Header
            doc.fillColor('#7C3AED').fontSize(24).font('Helvetica-Bold').text('UpNum', 50, 50);
            doc.fillColor('#64748B').fontSize(10).font('Helvetica').text('Smart Finance Management', 50, 78);
            
            doc.fillColor('#0F172A').fontSize(20).font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
            doc.fillColor('#64748B').fontSize(10).font('Helvetica').text(`# ${invoiceNo}`, 400, 78, { align: 'right' });
            
            doc.moveTo(50, 110).lineTo(545, 110).lineWidth(1).strokeColor('#E2E8F0').stroke();

            // Invoice details
            doc.moveDown(2);
            doc.fillColor('#0F172A').fontSize(12).font('Helvetica-Bold').text('Billed To:');
            doc.fillColor('#64748B').font('Helvetica').text(userName);
            
            doc.font('Helvetica-Bold').fillColor('#0F172A').text('Date:', 400, 140);
            doc.font('Helvetica').fillColor('#64748B').text(date, 480, 140);
            
            doc.font('Helvetica-Bold').fillColor('#0F172A').text('Status:', 400, 160);
            doc.font('Helvetica').fillColor('#10B981').text(status, 480, 160);

            doc.moveTo(50, 210).lineTo(545, 210).lineWidth(1).strokeColor('#E2E8F0').stroke();

            // Table Header
            doc.font('Helvetica-Bold').fillColor('#64748B').fontSize(10).text('DESCRIPTION', 50, 230);
            doc.text('BILLING CYCLE', 250, 230);
            doc.text('AMOUNT', 480, 230);
            
            doc.moveTo(50, 250).lineTo(545, 250).lineWidth(1).strokeColor('#E2E8F0').stroke();

            // Table Row
            doc.font('Helvetica-Bold').fillColor('#0F172A').fontSize(12).text(planName, 50, 270);
            doc.font('Helvetica').fillColor('#64748B').fontSize(12).text(billingCycle, 250, 270);
            doc.font('Helvetica-Bold').fillColor('#0F172A').fontSize(12).text(`INR ${amount}`, 480, 270);
            
            doc.moveTo(50, 310).lineTo(545, 310).lineWidth(1).strokeColor('#E2E8F0').stroke();

            // Total
            doc.font('Helvetica-Bold').fillColor('#0F172A').fontSize(14).text('Total', 350, 330);
            doc.fillColor('#7C3AED').fontSize(16).text(`INR ${amount}`, 450, 330);

            // Payment Details
            doc.rect(50, 390, 495, 100).fillAndStroke('#F5F3FF', '#E2E8F0');
            doc.fillColor('#7C3AED').font('Helvetica-Bold').fontSize(10).text('PAYMENT DETAILS', 70, 410);
            
            doc.fillColor('#64748B').font('Helvetica').fontSize(10).text('UPI ID:', 70, 435);
            doc.fillColor('#0F172A').font('Helvetica-Bold').text(upiId, 150, 435);
            
            doc.fillColor('#64748B').font('Helvetica').text('Transaction ID:', 70, 455);
            doc.fillColor('#0F172A').font('Helvetica-Bold').text(transactionId, 150, 455);

            // Footer
            doc.fontSize(10).fillColor('#94A3B8').font('Helvetica').text('Thank you for choosing UpNum! If you have any questions, contact support@upnum.in', 50, 750, { align: 'center' });
            
            doc.end();
        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generateInvoicePDF };
