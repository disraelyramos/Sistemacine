import React, { useState, useEffect, useContext } from 'react';
import '../styles/modular-login.css';
import axios from 'axios';
import { validarUsuario, validarContrasena } from '../utils/validations';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode'; // ✅ corrección aquí
import { loginWithGoogle } from '../services/authService';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [recordarme, setRecordarme] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  useEffect(() => {
    const recordado = localStorage.getItem('userData');
    if (recordado) {
      const user = JSON.parse(recordado);
      setUsername(user.username || '');
      setRecordarme(true);
    }
  }, []);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => setErrorMsg(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errorUsuario = validarUsuario(username);
    const errorPassword = validarContrasena(password);

    if (errorUsuario || errorPassword) {
      setErrorMsg(errorUsuario || errorPassword);
      return;
    }

    try {
      const response = await axios.post('http://localhost:3001/login', { username, password });

      const userData = {
        username,
        role_id: response.data.role_id,
        id: response.data.id
      };

      login(userData);

      if (recordarme) {
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.setItem('usuario_id', response.data.id);
        localStorage.setItem('rol_id', response.data.role_id);
      } else {
        sessionStorage.setItem('userData', JSON.stringify(userData));
        sessionStorage.setItem('usuario_id', response.data.id);
        sessionStorage.setItem('rol_id', response.data.role_id);
      }

      // 🔹 Agregado para que el sistema pueda usarlo en cualquier parte
      localStorage.setItem('usuario_id', response.data.id);
      localStorage.setItem('rol_id', response.data.role_id);

      localStorage.setItem('adminId', response.data.id);
      navigate('/dashboard');
    } catch (error) {
      const msg = error?.response?.data?.message || 'Error al conectar con el servidor.';
      setErrorMsg(msg);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const { email, name } = decoded;

      const response = await loginWithGoogle(email, name);

      const userData = {
        username: response.usuario,
        role_id: response.role_id,
        id: response.id
      };

      login(userData);
      localStorage.setItem('token', response.token);
      localStorage.setItem('adminId', response.id);

      if (recordarme) {
        localStorage.setItem('userData', JSON.stringify(userData));
      } else {
        sessionStorage.setItem('userData', JSON.stringify(userData));
      }

      // 🔹 Agregado también para login con Google
      localStorage.setItem('usuario_id', response.id);
      localStorage.setItem('rol_id', response.role_id);

      navigate('/dashboard');
    } catch (error) {
      const msg = error?.message || 'Error al autenticar con Google';
      setErrorMsg(msg);
    }
  };

  return (
    <>
      {errorMsg && <div className="fixed-alert">{errorMsg}</div>}

      <div className="login-container">
        <div className="login-form-section">
          <h2 className="login-title">
            <i className="fas fa-sign-in-alt"></i> Iniciar Sesión
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-floating">
              <input
                type="text"
                className="form-control"
                id="usuario"
                placeholder="Usuario"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
              <label htmlFor="usuario">Usuario</label>
            </div>
            <div className="form-floating">
              <input
                type="password"
                className="form-control"
                id="contrasena"
                placeholder="Contraseña"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <label htmlFor="contrasena">Contraseña</label>
            </div>
            <div className="form-check">
              <input
                type="checkbox"
                className="form-check-input"
                id="recordarme"
                checked={recordarme}
                onChange={(e) => setRecordarme(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="recordarme">
                Recordarme
              </label>
            </div>
            <button type="submit" className="btn-login">
              <i className="fas fa-sign-in-alt"></i> INGRESAR
            </button>
            <a href="#" className="forgot-password">
              <i className="fas fa-key"></i> ¿Olvidaste tu contraseña?
            </a>

            <div className="divider">
              <span>ingreso para usuarios externos</span>
            </div>

            <div className="social-login">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={() => setErrorMsg('Fallo en autenticación con Google')}
              />
            </div>
          </form>
        </div>

        <div className="brand-section">
          <div className="cinema-logo">
            <i className="fas fa-video"></i>
          </div>
          <div className="brand-title">MovieFlow</div>
          <div className="brand-subtitle">Tu experiencia cinematográfica comienza aquí</div>
          <ul>
            <li><i className="fas fa-film"></i> Las mejores películas</li>
            <li><i className="fas fa-couch"></i> Comodidad premium</li>
            <li><i className="fas fa-heart"></i> Momentos inolvidables</li>
          </ul>
          <div className="floating-elements">
            <i className="fas fa-film"></i>
            <i className="fas fa-ticket-alt"></i>
            <i className="fas fa-popcorn"></i>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
