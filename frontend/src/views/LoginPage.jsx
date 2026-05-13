/* eslint-disable */
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from 'reactstrap';
import { userActions, alertActions } from '../actions';

import ExamplesNavbar from '../components/Navbars/LoginNavbar';
import EliterLogo from '../components/Brand/EliterLogo';
import packageJson from '../../package.json';

function LoginPage() {
  const [inputs, setInputs] = useState({ username: '', password: '' });
  const [submitted, setSubmitted] = useState(false);
  const { username, password } = inputs;
  const loggingIn = useSelector(state => state.authentication.loggingIn);
  const alert = useSelector(state => state.alert);
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    dispatch(userActions.logout());
  }, [dispatch]);

  useEffect(() => {
    document.body.classList.add('login-page');
    document.body.classList.add('sidebar-collapse');
    document.documentElement.classList.remove('nav-open');
    window.scrollTo(0, 0);
    return () => {
      document.body.classList.remove('login-page');
      document.body.classList.remove('sidebar-collapse');
    };
  }, []);

  useEffect(() => {
    if (alert.message) setVisible(true);
  }, [alert]);

  useEffect(() => {
    if (!alert.message) return;
    const t = setTimeout(() => {
      setVisible(false);
      dispatch(alertActions.clear());
    }, 3000);
    return () => clearTimeout(t);
  }, [alert.message, dispatch]);

  function handleChange(e) {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setSubmitted(true);
    if (username && password) {
      dispatch(userActions.login(username, password));
    }
  }

  const onDismiss = () => {
    setVisible(false);
    dispatch(alertActions.clear());
  };

  return (
    <>
      <ExamplesNavbar />
      <div className="login-split">
        <div className="login-split-left">
          <div className="login-split-brand">
            <div className="login-split-logo-wrap">
              <EliterLogo className="login-split-logo" title="Eliter" />
            </div>
            <p className="login-split-tagline">Eliter</p>
            <div className="login-split-brand-footer">
              <span className="login-split-version">v{packageJson.version}</span>
              <span className="login-split-copyright">© {new Date().getFullYear()} Eliter</span>
              <span className="login-split-supported">Soportado por Eliter</span>
              <span className="login-split-supported">última actualización: 17/03/2026 12:33 p.m.</span>
            </div>
          </div>
          <div className="login-split-deco login-split-deco-1" aria-hidden="true" />
          <div className="login-split-deco login-split-deco-2" aria-hidden="true" />
        </div>
        <div className="login-split-right">
          <div className="login-split-form">
            <h1 className="login-split-title">Iniciar sesión</h1>
            <p className="login-split-sub">Accede con tu usuario o correo y contraseña</p>

            {alert.message && (
              <Alert
                color={alert.type === 'alert-danger' ? 'danger' : 'success'}
                isOpen={visible}
                toggle={onDismiss}
                fade={false}
                className="login-split-alert"
              >
                {alert.message}
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="form" noValidate>
              <div className="login-split-field">
                <label htmlFor="login-username">Usuario</label>
                <input
                  id="login-username"
                  type="text"
                  name="username"
                  value={username}
                  autoComplete="username"
                  placeholder="Usuario"
                  className={'login-split-input' + (submitted && !username ? ' error' : '')}
                  onChange={handleChange}
                />
                {submitted && !username && (
                  <span className="login-split-error">Requerido</span>
                )}
              </div>
              <div className="login-split-field">
                <label htmlFor="login-password">Contraseña</label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  value={password}
                  autoComplete="current-password"
                  placeholder="Contraseña"
                  className={'login-split-input' + (submitted && !password ? ' error' : '')}
                  onChange={handleChange}
                />
                {submitted && !password && (
                  <span className="login-split-error">Requerido</span>
                )}
              </div>
              <button type="submit" className="login-split-btn" disabled={loggingIn}>
                {loggingIn && <span className="spinner-border spinner-border-sm mr-2" />}
                {loggingIn ? 'Entrando…' : 'Entrar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

export default LoginPage;
