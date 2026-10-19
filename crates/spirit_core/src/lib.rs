//! SpiritContractEvoIdle Core Simulation Engine
//! Pure, deterministic, platform-independent combat and AFK progression engine.

pub mod combat;
pub mod grid;
pub mod offline;
pub mod rng;
pub mod stats;

pub use combat::{CombatEvent, CombatState};
pub use grid::{CombatUnit, GridColumn, GridSlot, TacticalTargeting};
pub use offline::{OfflineReport, OfflineSimulator};
pub use rng::DeterministicRng;
pub use stats::{CombatStats, PrimaryScalingStat, SpiritRole};

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_core_initialization() {
        let rng = DeterministicRng::new(12345);
        assert_eq!(rng.clone().next_u32(), rng.clone().next_u32());
    }
}
