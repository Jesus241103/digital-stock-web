const PDFDocument = require('pdfkit');

/**
 * Generar PDF de Factura/Nota
 * @param {Object} data - Datos de la factura (cabecera, detalles, cliente/proveedor)
 * @param {string} type - Tipo de movimiento ('Compra' o 'Venta')
 * @returns {Promise<Buffer>} - Buffer del PDF generado
 */
function createInvoicePDF(data, type) {
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
            const pdfData = Buffer.concat(buffers);
            resolve(pdfData);
        });

        // --- Encabezado ---
        doc.fillColor('#444444')
            .fontSize(20)
            .text('DIGITAL STOCK', 50, 57)
            .fontSize(10)
            .text('Sistema de Inventario', 50, 80)
            .text('digitalstock2025ve@gmail.com', 200, 65, { align: 'right' })
            .text('Generado: ' + new Date().toLocaleString(), 200, 80, { align: 'right' })
            .moveDown();

        // --- Título del Documento ---
        // Venta: Factura (Para el cliente)
        // Compra: Comprobante de Recepción (Para el proveedor, confirmando que recibimos su venta)
        const title = type === 'Compra' ? 'COMPROBANTE DE RECEPCIÓN' : 'FACTURA DE VENTA';
        doc.fillColor('#000000')
            .fontSize(15)
            .text(title, 50, 125, { align: 'center' });

        // --- Información ---
        doc.moveDown();
        doc.fontSize(10)
            .text(`Número de Control: ${String(data.id).padStart(6, '0')}`, 50, 160)
            .text(`Fecha: ${data.fecha} ${data.hora}`, 50, 175)
            .text(`${type === 'Compra' ? 'Proveedor' : 'Cliente'}: ${data.entidad.nombre}`, 50, 190)
            .text(`Cédula/RIF: ${data.entidad.codigo || data.entidad.cedula}`, 50, 205)
            .text(`Email: ${data.entidad.email}`, 50, 220);

        // --- Tabla de Detalles ---
        const invoiceTableTop = 260;

        doc.font('Helvetica-Bold');
        generateTableRow(doc, invoiceTableTop, 'Código', 'Descripción', 'Precio Unit.', 'Cant.', 'Total');
        generateHr(doc, invoiceTableTop + 20);
        doc.font('Helvetica');

        let i = 0;
        let position = 0;

        data.detalles.forEach((item) => {
            position = invoiceTableTop + (i + 1) * 30;
            // Verificar salto de página
            if (position > 700) {
                doc.addPage();
                position = 50;
                i = 0;
            }

            const totalItem = item.cantidad * item.precio * (1 + (item.iva || 0) / 100);

            generateTableRow(
                doc,
                position,
                item.codigo,
                item.nombre,
                formatCurrency(item.precio),
                item.cantidad,
                formatCurrency(totalItem)
            );

            generateHr(doc, position + 20);
            i++;
        });

        // --- Totales ---
        const subtotalPosition = position + 40;
        doc.font('Helvetica-Bold');

        generateTableRow(
            doc,
            subtotalPosition,
            '',
            '',
            'Total a Pagar:',
            '',
            formatCurrency(data.monto)
        );

        // --- Pie de página ---
        doc.fontSize(10)
            .text(
                'Gracias por su preferencia.',
                50,
                700,
                { align: 'center', width: 500 }
            );

        doc.end();
    });
}

function generateTableRow(doc, y, code, desc, price, qty, lineTotal) {
    doc.fontSize(10)
        .text(code, 50, y)
        .text(desc, 150, y)
        .text(price, 280, y, { width: 90, align: 'right' })
        .text(qty, 370, y, { width: 90, align: 'right' })
        .text(lineTotal, 0, y, { align: 'right' });
}

function generateHr(doc, y) {
    doc.strokeColor('#aaaaaa')
        .lineWidth(1)
        .moveTo(50, y)
        .lineTo(550, y)
        .stroke();
}

function formatCurrency(amount) {
    return '$' + parseFloat(amount).toFixed(2);
}

module.exports = { createInvoicePDF };
