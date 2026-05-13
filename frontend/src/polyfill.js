// Polyfill para dependencias que usan process en el navegador (evita "process is not defined")
if (typeof window !== 'undefined' && typeof window.process === 'undefined') {
  window.process = { env: { NODE_ENV: 'development', PUBLIC_URL: '' } };
}
