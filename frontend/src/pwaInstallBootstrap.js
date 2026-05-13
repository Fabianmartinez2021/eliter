/**
 * En produccion beforeinstallprompt a menudo se emite antes de que React monte /login.
 * Sin esto, el listener del LoginPage llega tarde y solo ves el texto del menu (⋮).
 * El dialogo nativo sigue abriendose solo al pulsar "Instalar aplicacion" (prompt en LoginPage).
 */
if (typeof window !== 'undefined') {
  window.__orquestaDeferredInstallPrompt = null;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    window.__orquestaDeferredInstallPrompt = e;
    window.dispatchEvent(new CustomEvent('orquesta:beforeinstallprompt'));
  });
}
