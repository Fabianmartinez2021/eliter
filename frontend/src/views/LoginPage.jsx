/* eslint-disable */
import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Alert } from 'reactstrap';
import { userActions, alertActions } from '../actions';

import ExamplesNavbar from '../components/Navbars/LoginNavbar';
import logo from '../assets/img/logoOrquestaCafe.png';
import packageJson from '../../package.json';

/** Solo ocultamos el pitch de instalación cuando es muy probable que ya sea la app instalada. */
function isRunningAsInstalledPwa() {
  if (typeof window === 'undefined') return false;
  try {
    if (window.navigator.standalone === true) return true;
    const mqStandalone =
      window.matchMedia && window.matchMedia('(display-mode: standalone)');
    if (mqStandalone && mqStandalone.matches) return true;
  } catch (e) {
    /* ignore */
  }
  return false;
}

function isLikelyIos() {
  if (typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
}

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

  const [pwaDeferredPrompt, setPwaDeferredPrompt] = useState(
    () => (typeof window !== 'undefined' ? window.__orquestaDeferredInstallPrompt || null : null)
  );
  const [pwaBannerDismissed, setPwaBannerDismissed] = useState(false);

  const dismissPwaInvite = useCallback(() => {
    setPwaBannerDismissed(true);
    window.__orquestaDeferredInstallPrompt = null;
    setPwaDeferredPrompt(null);
  }, []);

  const handlePwaInstallClick = useCallback(async () => {
    const ev = pwaDeferredPrompt || window.__orquestaDeferredInstallPrompt;
    if (!ev || typeof ev.prompt !== 'function') {
      dispatch(
        alertActions.error(
          'Tu navegador no habilitó el instalador aún. Revisa que sea HTTPS y luego usa el menú (⋮) > Instalar aplicación.'
        )
      );
      return;
    }
    ev.prompt();
    try {
      await ev.userChoice;
    } catch (err) {
      /* ignore */
    }
    window.__orquestaDeferredInstallPrompt = null;
    setPwaDeferredPrompt(null);
    setPwaBannerDismissed(true);
  }, [dispatch, pwaDeferredPrompt]);

  useEffect(() => {
    const sync = () => {
      if (window.__orquestaDeferredInstallPrompt) {
        setPwaDeferredPrompt(window.__orquestaDeferredInstallPrompt);
      }
    };
    sync();
    window.addEventListener('orquesta:beforeinstallprompt', sync);
    return () => window.removeEventListener('orquesta:beforeinstallprompt', sync);
  }, []);

  const pwaInstalledViewport = isRunningAsInstalledPwa();
  const showPwaBanner = !pwaBannerDismissed;
  const canUseNativeInstall =
    !!pwaDeferredPrompt ||
    (typeof window !== 'undefined' && !!window.__orquestaDeferredInstallPrompt);

  return (
    <>
      <ExamplesNavbar />
      <div className="login-split">
        <div className="login-split-left">
          <div className="login-split-brand">
            <img src={logo} alt="OrquestaCafè" className="login-split-logo" />
            <p className="login-split-tagline">Orquesta Cafè</p>
            <div className="login-split-brand-footer">
              <span className="login-split-version">v{packageJson.version}</span>
              <span className="login-split-copyright">© {new Date().getFullYear()} Orquesta Cafè</span>
              <span className="login-split-supported">Soportado por Orquesta Cafè</span>
              <span className="login-split-supported">ùltima actualización: 17/03/2026 12:33p.m</span>
            </div>
          </div>
          <div className="login-split-deco login-split-deco-1" aria-hidden="true" />
          <div className="login-split-deco login-split-deco-2" aria-hidden="true" />
        </div>
        <div className="login-split-right">
          <div className="login-split-form">
            <h1 className="login-split-title">Iniciar sesión</h1>
            <p className="login-split-sub">Accede con tu usuario o correo y contraseña</p>

            {showPwaBanner && (
              <div className="login-split-pwa" role="region" aria-label="Instalar aplicación">
                <div className="login-split-pwa-inner">
                  <div className="login-split-pwa-icon" aria-hidden="true">
                    <i className="fa fa-mobile" />
                  </div>
                  <div className="login-split-pwa-text">
                    {pwaInstalledViewport ? (
                      <>
                        <strong className="login-split-pwa-title">Estás en la app instalada</strong>
                        <p className="login-split-pwa-desc">
                          Orquesta Cafè se abrió como aplicación. Si prefieres el navegador, ábrelo desde la
                          barra de direcciones.
                        </p>
                      </>
                    ) : (
                      <>
                        <strong className="login-split-pwa-title">Usa Orquesta como app (Se requiere Dominio)</strong>
                        <p className="login-split-pwa-desc">
                          Instala la app para una mejor experiencia
                        </p>
                      </>
                    )}
                  </div>
                </div>
                <div className="login-split-pwa-actions">
                  {!pwaInstalledViewport && (
                    <button
                      type="button"
                      className="login-split-pwa-install"
                      onClick={handlePwaInstallClick}
                    >
                      Instalar aplicación
                    </button>
                  )}
                  <button type="button" className="login-split-pwa-dismiss" onClick={dismissPwaInvite}>
                    Ahora no
                  </button>
                </div>
              </div>
            )}

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
