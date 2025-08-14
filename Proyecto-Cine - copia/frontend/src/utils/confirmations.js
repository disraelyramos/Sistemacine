// src/utils/confirmations.js
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';


export const confirmarEliminar = (onConfirm, onCancel) => {
  confirmAlert({
    title: 'Confirmar eliminación',
    message: '¿Está seguro de eliminar este usuario?',
    buttons: [
      {
        label: 'Sí',
        onClick: onConfirm,
      },
      {
        label: 'No',
        onClick: onCancel || (() => {}),
      },
    ],
  });
};
