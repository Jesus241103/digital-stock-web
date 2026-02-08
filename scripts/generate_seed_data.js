const fs = require('fs');
const path = require('path');

// Configuration
const COUNTS = {
    CLIENTS: 50,
    PROVIDERS: 30,
    PRODUCTS: 100
};

const DATES = {
    START: new Date('2025-01-01'),
    END: new Date('2026-02-01')
};

const ADMIN_CEDULA = 10123123;
const ADMIN_NAME = 'FRANCISCO MARTINEZ';

// Helpers
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => parseFloat((Math.random() * (max - min) + min).toFixed(2));
const randomItem = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};
const formatDate = (d) => d.toISOString().split('T')[0];
const formatTime = (d) => d.toTimeString().split(' ')[0];

// Data Arrays
const NAMES = ['Juan', 'Maria', 'Pedro', 'Luis', 'Ana', 'Carlos', 'Sofia', 'Lucia', 'Miguel', 'Jose', 'David', 'Elena', 'Carmen', 'Raul', 'Patricia', 'Roberto', 'Fernando', 'Isabel', 'Teresa', 'Antonio'];
const SURNAMES = ['Garcia', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera', 'Gomez', 'Diaz', 'Reyes', 'Morales', 'Ortiz', 'Castillo', 'Rubio'];
const PRODUCT_NAMES = ['Arroz', 'Harina', 'Pasta', 'Aceite', 'Azúcar', 'Sal', 'Café', 'Leche', 'Margarina', 'Mayonesa', 'Salsa de Tomate', 'Atún', 'Sardinas', 'Galletas', 'Jugos', 'Refrescos', 'Agua', 'Jabón', 'Detergente', 'Cloro', 'Desinfectante', 'Papel Higiénico', 'Servilletas', 'Shampoo', 'Acondicionador', 'Desodorante', 'Crema Dental', 'Cepillo Dental', 'Afeitadoras', 'Toallas Sanitarias'];
const PRODUCT_BRANDS = ['Mary', 'PAN', 'Primor', 'Mavesa', 'Montalbán', 'La Salina', 'Madrid', 'Los Andes', 'Davesa', 'Mavesa', 'Pampero', 'Eveba', 'Margarita', 'Oreo', 'Yukery', 'Coca-Cola', 'Minalba', 'Las Llaves', 'Ace', 'Nevex', 'Mistolin', 'Scott', 'Suave', 'Pantene', 'Dove', 'Rexona', 'Colgate', 'Oral-B', 'Gillette', 'Always'];

// Generators
const clients = [];
const providers = [];
const products = [];
const purchases = [];
const sales = [];
const auditLog = [];

function generateCedula() {
    return randomInt(10000000, 30000000);
}

function generatePhone() {
    const prefixes = ['0412', '0414', '0424', '0416', '0426'];
    return `${randomItem(prefixes)}-${randomInt(1000000, 9999999)}`;
}

function generateEmail(name) {
    const domains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
    return `${name.toLowerCase().replace(/\s+/g, '.')}${randomInt(1, 99)}@${randomItem(domains)}`;
}

// 1. Clients
for (let i = 0; i < COUNTS.CLIENTS; i++) {
    const name = `${randomItem(NAMES)} ${randomItem(SURNAMES)}`;
    clients.push({
        cedula: generateCedula(),
        nombre: name,
        telefono: generatePhone(),
        email: generateEmail(name)
    });
}

// 2. Providers
for (let i = 0; i < COUNTS.PROVIDERS; i++) {
    const name = `${randomItem(NAMES)} ${randomItem(SURNAMES)}`;
    providers.push({
        codigo: generateCedula(), // Using cedula/nit format
        nombre: name + ' (Prov)',
        telefono: generatePhone(),
        email: generateEmail(name),
        estado: 1
    });
}

// 3. Products
// Generate base products first
let productCode = 100000;
const generatedProductNames = new Set();
// Create comprehensive list of combinations first
const allCombinations = [];
for (const base of PRODUCT_NAMES) {
    for (const brand of PRODUCT_BRANDS) {
        for (const pres of ['1kg', '500g', '1L', '2L', 'Pack']) {
            allCombinations.push(`${base} ${brand} ${pres}`);
        }
    }
}
// Shuffle array
for (let i = allCombinations.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allCombinations[i], allCombinations[j]] = [allCombinations[j], allCombinations[i]];
}

for (let i = 0; i < COUNTS.PRODUCTS; i++) {
    // If we run out of unique combinations, add a number (fallback)
    let name;
    if (i < allCombinations.length) {
        name = allCombinations[i];
    } else {
        const baseName = randomItem(PRODUCT_NAMES);
        const brand = randomItem(PRODUCT_BRANDS);
        name = `${baseName} ${brand} ${randomItem(['1kg', '500g', '1L', '2L', 'Pack'])} - ${i}`;
    }

    // Double check set just in case
    while (generatedProductNames.has(name)) {
        const baseName = randomItem(PRODUCT_NAMES);
        const brand = randomItem(PRODUCT_BRANDS);
        name = `${baseName} ${brand} ${randomItem(['1kg', '500g', '1L', '2L', 'Pack'])} - ${randomInt(1, 9999)}`;
    }
    generatedProductNames.add(name);

    products.push({
        codigo: productCode++,
        nombre: name,
        precio: randomFloat(1, 50),
        iva: 16,
        min: randomInt(5, 20),
        max: randomInt(50, 200),
        cantidad: 0, // Will be calculated based on transactions
        estado: 1
    });
}

// 4. Transactions (Purchases & Sales)
// We need to simulate time passing to have stock available for sales
let currentDate = new Date(DATES.START);
let purchaseIdCounter = 200; // Starting ID for purchases
let saleIdCounter = 200; // Starting ID for sales

while (currentDate <= DATES.END) {
    // Determine random number of transactions for this day
    const dailyPurchases = randomInt(0, 3);
    const dailySales = randomInt(0, 8); // More sales than purchases usually

    // Process Purchases (Entries)
    for (let p = 0; p < dailyPurchases; p++) {
        const provider = randomItem(providers);
        const purchaseId = purchaseIdCounter++;
        const numItems = randomInt(2, 8);
        const details = [];
        let totalAmount = 0;

        for (let it = 0; it < numItems; it++) {
            const product = randomItem(products);
            const qty = randomInt(10, 50); // Buy in bulk
            const cost = parseFloat((product.precio * 0.7).toFixed(2)); // Cost is less than price
            const subtotal = cost * qty;
            const ivaAmount = subtotal * (product.iva / 100);

            product.cantidad += qty; // Increase stock

            details.push({
                id: purchaseId,
                codigo_producto: product.codigo,
                nombre: product.nombre,
                precio: cost,
                iva: product.iva,
                cantidad: qty
            });

            totalAmount += subtotal + ivaAmount;
        }

        const timestamp = new Date(currentDate);
        timestamp.setHours(randomInt(8, 17), randomInt(0, 59), randomInt(0, 59));

        purchases.push({
            header: {
                id: purchaseId,
                cedula: provider.codigo,
                fecha: formatDate(timestamp),
                hora: formatTime(timestamp),
                monto: parseFloat(totalAmount.toFixed(2))
            },
            details: details
        });

        // Audit Log for Purchase
        auditLog.push({
            cedula: ADMIN_CEDULA,
            nombre: ADMIN_NAME,
            fecha: formatDate(timestamp),
            hora: formatTime(timestamp),
            accion: 'Registro una Entrada'
        });
    }

    // Process Sales (Exits)
    for (let s = 0; s < dailySales; s++) {
        const client = randomItem(clients);
        const saleId = saleIdCounter++;
        const numItems = randomInt(1, 5);
        const details = [];
        let totalAmount = 0;

        // Try to find products with stock
        const availableProducts = products.filter(p => p.cantidad > 0);

        if (availableProducts.length > 0) {
            for (let it = 0; it < numItems; it++) {
                if (availableProducts.length === 0) break;

                const product = randomItem(availableProducts);
                const maxQty = Math.min(product.cantidad, randomInt(1, 5)); // Sell retail amounts

                if (maxQty > 0) {
                    product.cantidad -= maxQty; // Decrease stock
                    const subtotal = product.precio * maxQty;
                    const ivaAmount = subtotal * (product.iva / 100);

                    details.push({
                        id: saleId,
                        codigo_producto: product.codigo,
                        nombre: product.nombre,
                        precio: product.precio,
                        iva: product.iva,
                        cantidad: maxQty
                    });

                    totalAmount += subtotal + ivaAmount;
                }
            }

            if (details.length > 0) {
                const timestamp = new Date(currentDate);
                timestamp.setHours(randomInt(8, 17), randomInt(0, 59), randomInt(0, 59));

                sales.push({
                    header: {
                        id: saleId,
                        cedula: client.cedula,
                        fecha: formatDate(timestamp),
                        hora: formatTime(timestamp),
                        monto: parseFloat(totalAmount.toFixed(2))
                    },
                    details: details
                });

                // Audit Log for Sale
                auditLog.push({
                    cedula: ADMIN_CEDULA,
                    nombre: ADMIN_NAME,
                    fecha: formatDate(timestamp),
                    hora: formatTime(timestamp),
                    accion: 'Registro una Salida'
                });
            } else {
                saleIdCounter--; // Revert ID if no sale made
            }
        } else {
            saleIdCounter--; // Revert ID
        }
    }

    // Advance day
    currentDate.setDate(currentDate.getDate() + 1);
}

// Audit Log for Creations (randomly distributed)
const creationActions = [
    'Agrego un Nuevo Cliente',
    'Agrego un Nuevo Producto',
    '	Agrego un Nuevo Proveedor', // Note the tab
    'Inicio de sesión'
];

// Add extra logs
for (let i = 0; i < 50; i++) {
    const timestamp = randomDate(DATES.START, DATES.END);
    auditLog.push({
        cedula: ADMIN_CEDULA,
        nombre: ADMIN_NAME,
        fecha: formatDate(timestamp),
        hora: formatTime(timestamp),
        accion: randomItem(creationActions)
    });
}
// Sort audit log by date/time
auditLog.sort((a, b) => {
    const dateA = new Date(a.fecha + 'T' + a.hora);
    const dateB = new Date(b.fecha + 'T' + b.hora);
    return dateA - dateB;
});


// GENERATE SQL
let sql = `-- GENERATED SEED DATA FOR DIGITAL STOCK
-- DATE: ${new Date().toISOString()}

USE \`digital-stock\`;

SET FOREIGN_KEY_CHECKS=0;

-- Clean up tables (Using DELETE to avoid FK constraint errors with TRUNCATE)
DELETE FROM \`detalle_fac\`;
DELETE FROM \`detalle_salida\`;
DELETE FROM \`cab_factura\`;
DELETE FROM \`cab_salida\`;
DELETE FROM \`cliente\`;
DELETE FROM \`proveedor\`;
DELETE FROM \`producto\`;
DELETE FROM \`bitacora\`;

-- Reset Auto Increments for tables that have it
ALTER TABLE \`cab_factura\` AUTO_INCREMENT = 1;
ALTER TABLE \`cab_salida\` AUTO_INCREMENT = 1;
ALTER TABLE \`bitacora\` AUTO_INCREMENT = 1;

-- Keep Users as is (except maybe bitacora touches them)

`;

// Clients
sql += `-- CLIENTS\n`;
sql += `INSERT INTO \`cliente\` (\`cedula\`, \`nombre\`, \`telefono\`, \`email\`) VALUES\n`;
sql += clients.map(c => `(${c.cedula}, '${c.nombre}', '${c.telefono}', '${c.email}')`).join(',\n') + ';\n\n';

// Providers
sql += `-- PROVIDERS\n`;
sql += `INSERT INTO \`proveedor\` (\`codigo\`, \`nombre\`, \`telefono\`, \`email\`, \`estado\`) VALUES\n`;
sql += providers.map(p => `(${p.codigo}, '${p.nombre}', '${p.telefono}', '${p.email}', ${p.estado})`).join(',\n') + ';\n\n';

// Products
sql += `-- PRODUCTS\n`;
sql += `INSERT INTO \`producto\` (\`codigo\`, \`nombre\`, \`precio\`, \`iva\`, \`min\`, \`max\`, \`cantidad\`, \`estado\`) VALUES\n`;
sql += products.map(p => `(${p.codigo}, '${p.nombre}', ${p.precio}, ${p.iva}, ${p.min}, ${p.max}, ${p.cantidad}, ${p.estado})`).join(',\n') + ';\n\n';

// Purchases
sql += `-- PURCHASES (HEADERS)\n`;
if (purchases.length > 0) {
    const purchaseHeaders = purchases.map(p => p.header);
    // Split into chunks to avoid query size limits
    const chunkSize = 500;
    for (let i = 0; i < purchaseHeaders.length; i += chunkSize) {
        const chunk = purchaseHeaders.slice(i, i + chunkSize);
        sql += `INSERT INTO \`cab_factura\` (\`id\`, \`cedula\`, \`fecha\`, \`hora\`, \`monto\`) VALUES\n`;
        sql += chunk.map(h => `(${h.id}, ${h.cedula}, '${h.fecha}', '${h.hora}', ${h.monto})`).join(',\n') + ';\n';
    }
    sql += '\n';

    sql += `-- PURCHASES (DETAILS)\n`;
    const purchaseDetails = purchases.flatMap(p => p.details);
    for (let i = 0; i < purchaseDetails.length; i += chunkSize) {
        const chunk = purchaseDetails.slice(i, i + chunkSize);
        sql += `INSERT INTO \`detalle_fac\` (\`id\`, \`codigo_producto\`, \`nombre\`, \`precio\`, \`iva\`, \`cantidad\`) VALUES\n`;
        sql += chunk.map(d => `(${d.id}, ${d.codigo_producto}, '${d.nombre.replace(/'/g, "''")}', ${d.precio}, ${d.iva}, ${d.cantidad})`).join(',\n') + ';\n';
    }
    sql += '\n';
}

// Sales
sql += `-- SALES (HEADERS)\n`;
if (sales.length > 0) {
    const saleHeaders = sales.map(s => s.header);
    const chunkSize = 500;
    for (let i = 0; i < saleHeaders.length; i += chunkSize) {
        const chunk = saleHeaders.slice(i, i + chunkSize);
        sql += `INSERT INTO \`cab_salida\` (\`id\`, \`cedula\`, \`fecha\`, \`hora\`, \`monto\`) VALUES\n`;
        sql += chunk.map(h => `(${h.id}, ${h.cedula}, '${h.fecha}', '${h.hora}', ${h.monto})`).join(',\n') + ';\n';
    }
    sql += '\n';

    sql += `-- SALES (DETAILS)\n`;
    const saleDetails = sales.flatMap(s => s.details);
    for (let i = 0; i < saleDetails.length; i += chunkSize) {
        const chunk = saleDetails.slice(i, i + chunkSize);
        sql += `INSERT INTO \`detalle_salida\` (\`id\`, \`codigo_producto\`, \`nombre\`, \`precio\`, \`iva\`, \`cantidad\`) VALUES\n`;
        sql += chunk.map(d => `(${d.id}, ${d.codigo_producto}, '${d.nombre.replace(/'/g, "''")}', ${d.precio}, ${d.iva}, ${d.cantidad})`).join(',\n') + ';\n';
    }
    sql += '\n';
}

// Audit Log
sql += `-- AUDIT LOG\n`;
if (auditLog.length > 0) {
    const chunkSize = 500;
    for (let i = 0; i < auditLog.length; i += chunkSize) {
        const chunk = auditLog.slice(i, i + chunkSize);
        sql += `INSERT INTO \`bitacora\` (\`cedula\`, \`nombre\`, \`fecha\`, \`hora\`, \`accion\`) VALUES\n`;
        sql += chunk.map(a => `(${a.cedula}, '${a.nombre}', '${a.fecha}', '${a.hora}', '${a.accion}')`).join(',\n') + ';\n';
    }
}

sql += `\nSET FOREIGN_KEY_CHECKS=1;\n`;


fs.writeFileSync(path.join(__dirname, '../migrations/seed_data.sql'), sql);
console.log('Seed data generated successfully!');
