/**
 * Background Web Worker: High-Performance Combat & AFK Simulation Engine
 * Runs compiled Rust WebAssembly (spirit_wasm) off the main browser thread.
 */

let wasmEngine = null;
let tickTimer = null;
let isInitialized = false;

async function initWasm() {
  try {
    const { default: init, WasmSimulationEngine } = await import('../wasm/pkg/spirit_wasm.js');
    await init();
    wasmEngine = new WasmSimulationEngine(BigInt(Date.now()));
    isInitialized = true;
    self.postMessage({ type: 'READY', engineVersion: '0.2.0-wasm' });
  } catch (err) {
    console.warn('[CombatWorker] Failed to initialize Wasm engine, falling back to JS:', err);
    self.postMessage({ type: 'ERROR', error: err?.message || String(err) });
  }
}

self.onmessage = async (e) => {
  const { type, payload } = e.data || {};

  switch (type) {
    case 'INIT': {
      if (!isInitialized) {
        await initWasm();
      } else {
        self.postMessage({ type: 'READY', engineVersion: '0.2.0-wasm' });
      }
      break;
    }

    case 'START_COMBAT': {
      if (!isInitialized || !wasmEngine) {
        self.postMessage({ type: 'ERROR', error: 'Wasm engine not initialized' });
        return;
      }

      if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
      }

      const { seed = Date.now(), party = [], enemies = [], tickMs = 250 } = payload || {};
      wasmEngine.set_seed(BigInt(seed));
      
      try {
        wasmEngine.init_combat(party, enemies);
      } catch (err) {
        self.postMessage({ type: 'ERROR', error: `init_combat failed: ${err}` });
        return;
      }

      const deltaSec = tickMs / 1000.0;
      tickTimer = setInterval(() => {
        try {
          const events = wasmEngine.step_tick(deltaSec);
          const isVictory = wasmEngine.is_victory();
          const isDefeat = wasmEngine.is_defeat();

          self.postMessage({
            type: 'TICK_EVENTS',
            events: events || [],
            isVictory,
            isDefeat
          });

          if (isVictory || isDefeat) {
            clearInterval(tickTimer);
            tickTimer = null;
          }
        } catch (err) {
          self.postMessage({ type: 'ERROR', error: `step_tick failed: ${err}` });
          clearInterval(tickTimer);
          tickTimer = null;
        }
      }, tickMs);

      self.postMessage({ type: 'COMBAT_STARTED' });
      break;
    }

    case 'STOP_COMBAT': {
      if (tickTimer) {
        clearInterval(tickTimer);
        tickTimer = null;
      }
      self.postMessage({ type: 'COMBAT_STOPPED' });
      break;
    }

    case 'FAST_FORWARD_AFK': {
      if (!isInitialized || !wasmEngine) {
        self.postMessage({ type: 'ERROR', error: 'Wasm engine not initialized' });
        return;
      }

      const {
        elapsedSeconds = 0,
        highestStage = 1,
        partyPower = 100,
        currentEnergy = 0,
        maxEnergy = 60,
        forceClaim = false
      } = payload || {};

      try {
        const report = wasmEngine.calculate_offline_gains(
          BigInt(elapsedSeconds),
          highestStage,
          BigInt(partyPower),
          currentEnergy,
          maxEnergy,
          forceClaim
        );
        self.postMessage({ type: 'AFK_REPORT', report });
      } catch (err) {
        self.postMessage({ type: 'ERROR', error: `calculate_offline_gains failed: ${err}` });
      }
      break;
    }

    case 'CALCULATE_MITIGATION': {
      if (!isInitialized || !wasmEngine) {
        self.postMessage({ type: 'ERROR', error: 'Wasm engine not initialized' });
        return;
      }
      const { rawDamage = 0, def = 0, reqId } = payload || {};
      const mitigated = wasmEngine.mitigate_damage(BigInt(rawDamage), BigInt(def));
      self.postMessage({ type: 'MITIGATION_RESULT', reqId, mitigated: Number(mitigated) });
      break;
    }

    default:
      console.warn('[CombatWorker] Unknown message type:', type);
  }
};
