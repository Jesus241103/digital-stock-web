/**
 * Middleware de Validación
 * Digital Stock Web
 * 
 * Funciones de validación reutilizables para los datos de entrada
 * Basado en las validaciones del sistema Java original
 */

const { body, param, query, validationResult } = require('express-validator');

/**
 * Procesa los errores de validación y retorna respuesta
 */
function handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Error de validación',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
}

// ============================================
// VALIDACIONES DE USUARIO
// ============================================

const validateLogin = [
    body('cedula')
        .notEmpty().withMessage('La cédula es requerida')
        .isInt({ min: 100000, max: 999999999 }).withMessage('Cédula debe ser entre 6 y 9 dígitos'),
    body('clave')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 5 }).withMessage('Contraseña mínimo 5 caracteres'),
    handleValidationErrors
];

const validateRegister = [
    body('cedula')
        .notEmpty().withMessage('La cédula es requerida')
        .isInt({ min: 100000, max: 999999999 }).withMessage('Cédula debe ser entre 6 y 9 dígitos'),
    body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 3, max: 50 }).withMessage('Nombre debe tener entre 3 y 50 caracteres')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Nombre solo puede contener letras'),
    body('tlfn')
        .notEmpty().withMessage('El teléfono es requerido')
        .matches(/^[0-9]{11}$/).withMessage('Teléfono debe tener 11 dígitos'),
    body('clave')
        .notEmpty().withMessage('La contraseña es requerida')
        .isLength({ min: 5 }).withMessage('Contraseña mínimo 5 caracteres'),
    handleValidationErrors
];

// ============================================
// VALIDACIONES DE PRODUCTO
// ============================================

const validateProduct = [
    body('codigo')
        .notEmpty().withMessage('El código es requerido')
        .isInt({ min: 100000, max: 999999 }).withMessage('Código debe ser de 6 dígitos'),
    body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 3, max: 50 }).withMessage('Nombre debe tener entre 3 y 50 caracteres'),
    body('precio')
        .notEmpty().withMessage('El precio es requerido')
        .isFloat({ min: 0.01 }).withMessage('Precio debe ser mayor a 0'),
    body('iva')
        .notEmpty().withMessage('El IVA es requerido')
        .isFloat({ min: 0, max: 100 }).withMessage('IVA debe estar entre 0 y 100'),
    body('min')
        .notEmpty().withMessage('Stock mínimo es requerido')
        .isInt({ min: 1 }).withMessage('Stock mínimo debe ser mayor a 0'),
    body('max')
        .notEmpty().withMessage('Stock máximo es requerido')
        .isInt({ min: 1 }).withMessage('Stock máximo debe ser mayor a 0'),
    body('cantidad')
        .optional()
        .isInt({ min: 0 }).withMessage('Cantidad debe ser 0 o mayor'),
    handleValidationErrors
];

const validateProductCode = [
    param('codigo')
        .isInt({ min: 100000, max: 999999 }).withMessage('Código debe ser de 6 dígitos'),
    handleValidationErrors
];

// ============================================
// VALIDACIONES DE CLIENTE
// ============================================

const validateClient = [
    body('cedula')
        .notEmpty().withMessage('La cédula es requerida')
        .isInt({ min: 100000, max: 999999999 }).withMessage('Cédula debe ser entre 6 y 9 dígitos'),
    body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 3, max: 50 }).withMessage('Nombre debe tener entre 3 y 50 caracteres'),
    body('telefono')
        .notEmpty().withMessage('El teléfono es requerido')
        .matches(/^[0-9\-]{11,15}$/).withMessage('Teléfono inválido'),
    body('email')
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('El email debe ser un correo electrónico válido'),
    handleValidationErrors
];

const validateClientCedula = [
    param('cedula')
        .isInt({ min: 100000, max: 999999999 }).withMessage('Cédula debe ser entre 6 y 9 dígitos'),
    handleValidationErrors
];

// ============================================
// VALIDACIONES DE PROVEEDOR
// ============================================

const validateProvider = [
    body('codigo')
        .notEmpty().withMessage('El código es requerido')
        .isInt({ min: 100000, max: 999999999 }).withMessage('Código debe ser entre 6 y 9 dígitos'),
    body('nombre')
        .notEmpty().withMessage('El nombre es requerido')
        .isLength({ min: 3, max: 50 }).withMessage('Nombre debe tener entre 3 y 50 caracteres'),
    body('telefono')
        .notEmpty().withMessage('El teléfono es requerido')
        .matches(/^[0-9\-]{11,15}$/).withMessage('Teléfono inválido'),
    body('email')
        .notEmpty().withMessage('El email es requerido')
        .isEmail().withMessage('El email debe ser un correo electrónico válido'),
    handleValidationErrors
];

const validateProviderCode = [
    param('codigo')
        .isInt({ min: 100000, max: 999999999 }).withMessage('Código debe ser entre 6 y 9 dígitos'),
    handleValidationErrors
];

// ============================================
// VALIDACIONES DE TRANSACCIONES
// ============================================

const validatePurchase = [
    // Aceptar proveedor_cedula (estándar nuevo) o cedula (legacy)
    body('proveedor_cedula').if(body('cedula').not().exists())
        .notEmpty().withMessage('El proveedor es requerido')
        .isInt().withMessage('Código de proveedor inválido'),

    // Validar productos
    body('productos')
        .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
    body('productos.*.codigo')
        .isInt().withMessage('Código de producto inválido'),
    body('productos.*.cantidad')
        .isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
    handleValidationErrors
];

const validateSale = [
    // Aceptar cliente_cedula (estándar nuevo) o cedula (legacy)
    body('cliente_cedula').if(body('cedula').not().exists())
        .notEmpty().withMessage('El cliente es requerido')
        .isInt().withMessage('Cédula de cliente inválida'),

    // Validar productos
    body('productos')
        .isArray({ min: 1 }).withMessage('Debe incluir al menos un producto'),
    body('productos.*.codigo')
        .isInt().withMessage('Código de producto inválido'),
    body('productos.*.cantidad')
        .isInt({ min: 1 }).withMessage('Cantidad debe ser mayor a 0'),
    handleValidationErrors
];

module.exports = {
    handleValidationErrors,
    validateLogin,
    validateRegister,
    validateProduct,
    validateProductCode,
    validateClient,
    validateClientCedula,
    validateProvider,
    validateProviderCode,
    validatePurchase,
    validateSale
};
