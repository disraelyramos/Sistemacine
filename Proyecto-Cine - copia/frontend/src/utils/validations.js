// src/utils/validations.js

export function validarNombre(nombre) {
  if (!nombre) return 'El nombre es obligatorio';
  if (/^\d+$/.test(nombre)) {
    return 'El nombre no puede ser solo números';
  }
  if (/\s{2,}/.test(nombre)) {
    return 'El nombre no puede contener múltiples espacios seguidos';
  }
  if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(nombre)) {
    return 'El nombre solo puede contener letras y espacios';
  }
  return null;
}

export function validarUsuario(usuario) {
  if (!usuario) return 'El usuario es obligatorio';
  if (!/^[A-Za-z0-9]{1,9}$/.test(usuario)) {
    return 'El usuario debe tener máximo 9 caracteres alfanuméricos, sin espacios ni caracteres especiales';
  }
  return null;
}

export function validarContrasena(contrasena) {
  if (!contrasena) return 'La contraseña es obligatoria';
  if (contrasena.length > 20) {
    return 'La contraseña no puede exceder 20 caracteres';
  }
  return null;
}
