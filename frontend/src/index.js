import './polyfill';
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './helpers';
import '../src/assets/css/bootstrap.min.css';
import '../src/assets/css/now-ui-kit.css';
import '../src/assets/demo/demo.css';
import '../src/assets/demo/nucleo-icons-page-styles.css';
import '../src/assets/css/menu.css';
import App from './App';
import { render } from 'react-dom';
import { DarkModeProvider } from './helpers/darkModeContext';

render(
    <Provider store={store}>
        <DarkModeProvider>
            <App />
        </DarkModeProvider>
    </Provider>,
    document.getElementById('root')
);

// Desregistrar service workers antiguos si el usuario tenía una versión con PWA.
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.unregister());
    });
  });
}
