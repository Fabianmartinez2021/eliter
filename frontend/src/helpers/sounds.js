/**
 * Sonidos estilo Facebook/Messenger
 * Usa Web Audio API - no requiere archivos externos
 */

let audioContext = null;
let lastNotificationSoundTime = 0;
const NOTIFICATION_DEBOUNCE_MS = 1800;

const getAudioContext = () => {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContext;
};

/**
 * Sonido de notificación - doble tono suave tipo chime cuando llega un mensaje
 */
export const playNotificationSound = () => {
    try {
        const now = Date.now();
        if (now - lastNotificationSoundTime < NOTIFICATION_DEBOUNCE_MS) return;
        lastNotificationSoundTime = now;

        const ctx = getAudioContext();
        const t = ctx.currentTime;

        // Primer tono: 523 Hz (C5)
        const osc1 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(523, t);
        gain1.gain.setValueAtTime(0.1, t);
        gain1.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
        osc1.start(t);
        osc1.stop(t + 0.1);

        // Segundo tono: 659 Hz (E5) - suave continuación
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(659, t + 0.12);
        gain2.gain.setValueAtTime(0.08, t + 0.12);
        gain2.gain.exponentialRampToValueAtTime(0.01, t + 0.26);
        osc2.start(t + 0.12);
        osc2.stop(t + 0.26);
    } catch (e) {
        // Silenciar si el navegador bloquea audio (ej. sin interacción previa)
    }
};

/**
 * Sonido de limpieza - suave al borrar notificaciones de la campana
 */
export const playClearSound = () => {
    try {
        const ctx = getAudioContext();
        const t = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, t);
        osc.frequency.exponentialRampToValueAtTime(330, t + 0.12);
        gain.gain.setValueAtTime(0.09, t);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);
        osc.start(t);
        osc.stop(t + 0.12);
    } catch (e) {
        // Silenciar si el navegador bloquea audio
    }
};

/**
 * Sonido de envío - "pop" suave al enviar mensaje (como Facebook Messenger)
 */
export const playSendSound = () => {
    try {
        const ctx = getAudioContext();
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.exponentialRampToValueAtTime(380, now + 0.06);

        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
    } catch (e) {
        // Silenciar si el navegador bloquea audio
    }
};
