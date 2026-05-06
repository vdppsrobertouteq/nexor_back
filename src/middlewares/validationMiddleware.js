// File: backend/src/middlewares/validationMiddleware.js
const { body, validationResult } = require('express-validator');
const { AppError } = require('../utils/errorHandler');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map(error => error.msg);
    return next(new AppError(errorMessages.join(', '), 400));
  }
  next();
};

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('El correo electrónico no tiene un formato válido')
    .custom((value) => {
      if (!value.endsWith('@uteq.edu.mx')) {
        throw new Error('Solo se permiten correos institucionales (@uteq.edu.mx)');
      }
      return true;
    }),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres'),
  handleValidationErrors
];

const validateRegister = [
  body('nombre')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Nombre debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Nombre solo puede contener letras y espacios'),
  body('apellido')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Apellido debe tener entre 1 y 100 caracteres')
    .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/)
    .withMessage('Apellido solo puede contener letras y espacios'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('El correo electrónico no tiene un formato válido')
    .custom((value) => {
      if (!value.endsWith('@uteq.edu.mx')) {
        throw new Error('Solo se permiten correos institucionales (@uteq.edu.mx)');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .not().matches(/\s/)
    .withMessage('La contraseña no debe contener espacios'),
  body('telefono')
    .optional()
    .isMobilePhone('es-MX')
    .withMessage('Teléfono debe ser un número válido de México'),
  body('id_rol')
    .isInt({ min: 1 })
    .withMessage('Rol debe ser un número válido'),
  handleValidationErrors
];

const validateVerifyEmail = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('El correo electrónico no tiene un formato válido')
    .custom((value) => {
      if (!value.endsWith('@uteq.edu.mx')) {
        throw new Error('Solo se permiten correos institucionales (@uteq.edu.mx)');
      }
      return true;
    }),
  body('codigo')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Código debe ser de 6 dígitos'),
  handleValidationErrors
];

const validateResetPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('El correo electrónico no tiene un formato válido')
    .custom((value) => {
      if (!value.endsWith('@uteq.edu.mx')) {
        throw new Error('Solo se permiten correos institucionales (@uteq.edu.mx)');
      }
      return true;
    }),
  body('codigo')
    .isLength({ min: 6, max: 6 })
    .isNumeric()
    .withMessage('Código debe ser de 6 dígitos'),
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')
    .not().matches(/\s/)
    .withMessage('La contraseña no debe contener espacios'),
  handleValidationErrors
];


module.exports = {
  validateLogin,
  handleValidationErrors,
  validateRegister,
  validateVerifyEmail,
  validateResetPassword
};