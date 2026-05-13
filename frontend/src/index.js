import './polyfill';
import './pwaInstallBootstrap';
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './helpers';
import '../src/assets/css/bootstrap.min.css';
import '../src/assets/css/now-ui-kit.css';
import '../src/assets/demo/demo.css';
import '../src/assets/demo/nucleo-icons-page-styles.css';
import '../src/assets/css/menu.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
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

// PWA: service worker en producción (precache de assets del build).
serviceWorker.register();