//! WebAssembly bindings for SpiritContractEvoIdle

use spirit_core::{CombatState, CombatUnit, DeterministicRng, OfflineSimulator};
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn get_engine_version() -> String {
    "0.2.0-wasm".to_string()
}

#[wasm_bindgen]
pub fn ping() -> bool {
    true
}

#[wasm_bindgen]
pub struct WasmSimulationEngine {
    rng: DeterministicRng,
    combat: Option<CombatState>,
}

#[wasm_bindgen]
impl WasmSimulationEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(seed: u64) -> Self {
        Self {
            rng: DeterministicRng::new(seed),
            combat: None,
        }
    }

    pub fn set_seed(&mut self, seed: u64) {
        self.rng = DeterministicRng::new(seed);
    }

    /// Initializes a combat session from JS Values (arrays of CombatUnit)
    pub fn init_combat(&mut self, party_val: JsValue, enemies_val: JsValue) -> Result<(), JsValue> {
        let party: Vec<CombatUnit> = serde_wasm_bindgen::from_value(party_val)?;
        let enemies: Vec<CombatUnit> = serde_wasm_bindgen::from_value(enemies_val)?;
        self.combat = Some(CombatState::new(party, enemies));
        Ok(())
    }

    /// Advances 1 discrete combat tick (e.g. 250ms) and returns structured CombatEvent objects
    pub fn step_tick(&mut self, delta_sec: f32) -> Result<JsValue, JsValue> {
        if let Some(combat) = &mut self.combat {
            let events = combat.step_tick(delta_sec, &mut self.rng);
            Ok(serde_wasm_bindgen::to_value(&events)?)
        } else {
            Ok(JsValue::NULL)
        }
    }

    pub fn is_victory(&self) -> bool {
        self.combat.as_ref().map(|c| c.is_victory).unwrap_or(false)
    }

    pub fn is_defeat(&self) -> bool {
        self.combat.as_ref().map(|c| c.is_defeat).unwrap_or(false)
    }

    /// Instant math helper: DamageTaken = RawDamage * (350 / (350 + DEF))
    pub fn mitigate_damage(&self, raw_damage: u64, def: u64) -> u64 {
        spirit_core::CombatStats::mitigate_damage(raw_damage, def)
    }

    /// Instant 24-hour fast-forward calculation (<1ms in Wasm)
    pub fn calculate_offline_gains(
        &self,
        elapsed_seconds: u64,
        highest_stage: u32,
        party_power: u64,
        current_energy: u32,
        max_energy: u32,
        force_claim: bool,
    ) -> Result<JsValue, JsValue> {
        let report = OfflineSimulator::calculate_offline_gains(
            elapsed_seconds,
            highest_stage,
            party_power,
            current_energy,
            max_energy,
            force_claim,
        );
        Ok(serde_wasm_bindgen::to_value(&report)?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_engine_version() {
        assert_eq!(get_engine_version(), "0.2.0-wasm");
    }
}
