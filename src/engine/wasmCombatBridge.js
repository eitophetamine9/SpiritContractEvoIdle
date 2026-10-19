/**
 * WasmCombatBridge: Client orchestrator interfacing with src/workers/combatWorker.js
 * Provides 60 FPS non-blocking Wasm simulation with transparent JavaScript fallback.
 */

class WasmCombatBridge {
  constructor() {
    this.worker = null;
    this.isWasmReady = false;
    this.subscribers = new Set();
    this.pendingRequests = new Map();
    this.reqIdCounter = 1;
  }

  /**
   * Initializes the Web Worker thread and compiles the WebAssembly binary
   */
  init() {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      console.log('[WasmCombatBridge] Headless / Node environment; using native JS engine.');
      return;
    }

    try {
      this.worker = new Worker(new URL('../workers/combatWorker.js', import.meta.url), {
        type: 'module'
      });

      this.worker.onmessage = (e) => {
        const { type, ...data } = e.data || {};
        if (type === 'READY') {
          this.isWasmReady = true;
          console.log('[WasmCombatBridge] Rust WebAssembly Engine Active (v0.2.0-wasm, 60fps Web Worker mode)');
        } else if (type === 'ERROR') {
          console.warn('[WasmCombatBridge] Worker error notice:', data.error);
        } else if (type === 'MITIGATION_RESULT') {
          const resolver = this.pendingRequests.get(data.reqId);
          if (resolver) {
            resolver(data.mitigated);
            this.pendingRequests.delete(data.reqId);
          }
        }

        // Notify listeners of combat tick events, AFK reports, etc.
        for (const cb of this.subscribers) {
          try {
            cb(type, data);
          } catch (err) {
            console.error('[WasmCombatBridge] Subscriber exception:', err);
          }
        }
      };

      this.worker.postMessage({ type: 'INIT' });
    } catch (err) {
      console.warn('[WasmCombatBridge] Worker initialization failed, keeping active JS engine:', err);
    }
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  startCombat(party, enemies, seed = Date.now()) {
    if (this.worker && this.isWasmReady) {
      this.worker.postMessage({
        type: 'START_COMBAT',
        payload: { party, enemies, seed, tickMs: 250 }
      });
      return true;
    }
    return false;
  }

  stopCombat() {
    if (this.worker) {
      this.worker.postMessage({ type: 'STOP_COMBAT' });
    }
  }

  /**
   * Dispatches fast-forward 24h calculation to the worker (<1ms)
   */
  calculateFastForwardAfk(params) {
    if (this.worker && this.isWasmReady) {
      return new Promise((resolve) => {
        const handler = (e) => {
          if (e.data?.type === 'AFK_REPORT') {
            this.worker.removeEventListener('message', handler);
            resolve(e.data.report);
          }
        };
        this.worker.addEventListener('message', handler);
        this.worker.postMessage({
          type: 'FAST_FORWARD_AFK',
          payload: params
        });
      });
    }
    return null;
  }
}

export const wasmCombatBridge = new WasmCombatBridge();
