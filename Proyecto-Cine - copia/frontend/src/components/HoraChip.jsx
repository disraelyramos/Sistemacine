import React from 'react';

export default function HoraChip({ hora, label, onClick }) {
  return (
    <button type="button" className="hora-chip" onClick={onClick}>
      <div className="hora-chip__icon"><i className="far fa-clock"></i></div>
      <div className="hora-chip__text">
        <div className="hora-chip__hora">{hora}</div>
        <div className="hora-chip__label">{label}</div>
      </div>
    </button>
  );
}
