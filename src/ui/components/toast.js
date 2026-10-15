/**
 * Lightweight Toast Notification Component
 * Displays sleek, responsive notifications for feature gating, alerts, and achievements.
 */

export function showGameToast(message, type = 'lock') {
  if (typeof document === 'undefined') return;

  let toastContainer = document.getElementById('toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = 'fixed top-14 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center pointer-events-none gap-2 w-full max-w-sm px-4';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  const icon = type === 'lock' ? '🔒' : (type === 'success' ? '✨' : '⚠️');
  const borderCol = type === 'lock' 
    ? 'border-amber-400/40 bg-slate-900/95 text-amber-200 shadow-amber-950/50' 
    : 'border-cyan-400/40 bg-slate-900/95 text-cyan-200 shadow-cyan-950/50';

  toast.className = `flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border shadow-2xl backdrop-blur-md text-xs font-semibold tracking-wide animate-fadeIn transition-all pointer-events-auto ${borderCol}`;
  toast.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.7)';
  toast.innerHTML = `
    <span class="text-base shrink-0">${icon}</span>
    <span class="leading-snug text-left">${message}</span>
  `;

  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-8px)';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3200);
}
