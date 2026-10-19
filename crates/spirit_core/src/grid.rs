//! 3x3 Tactical Grid Formation, Column Threat Multipliers, and Targeting

use crate::rng::DeterministicRng;
use crate::stats::CombatStats;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum GridSlot {
    F1, F2, F3,
    M1, M2, M3,
    B1, B2, B3,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GridColumn {
    Front,
    Mid,
    Back,
}

impl GridSlot {
    pub fn column(&self) -> GridColumn {
        match self {
            GridSlot::F1 | GridSlot::F2 | GridSlot::F3 => GridColumn::Front,
            GridSlot::M1 | GridSlot::M2 | GridSlot::M3 => GridColumn::Mid,
            GridSlot::B1 | GridSlot::B2 | GridSlot::B3 => GridColumn::Back,
        }
    }

    /// Column threat multiplier (Front: 2.0x, Mid: 1.0x, Back: 0.5x)
    pub fn threat_multiplier(&self) -> f32 {
        match self.column() {
            GridColumn::Front => 2.0,
            GridColumn::Mid => 1.0,
            GridColumn::Back => 0.5,
        }
    }

    /// Column DEF bonus multiplier (Frontline Vanguard: +15% DEF)
    pub fn def_perk_multiplier(&self) -> f32 {
        match self.column() {
            GridColumn::Front => 1.15,
            _ => 1.0,
        }
    }

    /// Column ATK bonus multiplier (Backline Sanctuary: +15% ATK)
    pub fn atk_perk_multiplier(&self) -> f32 {
        match self.column() {
            GridColumn::Back => 1.15,
            _ => 1.0,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CombatUnit {
    pub id: u32,
    pub name: String,
    pub slot: Option<GridSlot>,
    pub stats: CombatStats,
    pub is_enemy: bool,
}

impl CombatUnit {
    pub fn new(id: u32, name: String, slot: Option<GridSlot>, stats: CombatStats, is_enemy: bool) -> Self {
        Self {
            id,
            name,
            slot,
            stats,
            is_enemy,
        }
    }

    pub fn effective_threat(&self) -> u32 {
        let mult = self.slot.map(|s| s.threat_multiplier()).unwrap_or(1.0);
        ((self.stats.effective_threat as f32) * mult).max(1.0).round() as u32
    }
}

pub struct TacticalTargeting;

impl TacticalTargeting {
    /// Selects an attack target from living units:
    /// 1. 100% priority to any unit under active [TAUNT LOCK]
    /// 2. Deterministic weighted selection based on Effective Threat score
    pub fn select_target<'a>(units: &'a [CombatUnit], rng: &mut DeterministicRng) -> Option<&'a CombatUnit> {
        let living_units: Vec<&'a CombatUnit> = units.iter().filter(|u| u.stats.is_alive()).collect();
        if living_units.is_empty() {
            return None;
        }
        if living_units.len() == 1 {
            return Some(living_units[0]);
        }

        // 1. Check for Active Taunt Lock
        let taunters: Vec<&'a CombatUnit> = living_units
            .iter()
            .copied()
            .filter(|u| u.stats.taunt_timer > 0.0)
            .collect();

        if !taunters.is_empty() {
            let idx = (rng.next_u32() as usize) % taunters.len();
            return Some(taunters[idx]);
        }

        // 2. Deterministic Threat-Weighted Random
        let total_threat: u64 = living_units.iter().map(|u| u.effective_threat() as u64).sum();
        if total_threat == 0 {
            return Some(living_units[0]);
        }

        let roll = (rng.next_u32() as u64) % total_threat;
        let mut accumulated = 0;

        for unit in &living_units {
            accumulated += unit.effective_threat() as u64;
            if roll < accumulated {
                return Some(unit);
            }
        }

        Some(living_units[0])
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::stats::SpiritRole;

    #[test]
    fn test_grid_column_perks() {
        assert_eq!(GridSlot::F1.threat_multiplier(), 2.0);
        assert_eq!(GridSlot::F1.def_perk_multiplier(), 1.15);
        assert_eq!(GridSlot::M2.threat_multiplier(), 1.0);
        assert_eq!(GridSlot::B3.threat_multiplier(), 0.5);
        assert_eq!(GridSlot::B3.atk_perk_multiplier(), 1.15);
    }

    #[test]
    fn test_taunt_targeting_priority() {
        let mut rng = DeterministicRng::new(42);

        let tank = CombatUnit::new(
            1,
            "Atlas".to_string(),
            Some(GridSlot::F2),
            {
                let mut s = CombatStats::new(SpiritRole::TankDefense, 20, 200, 1000);
                s.taunt_timer = 5.0; // Active taunt
                s
            },
            false,
        );

        let dps = CombatUnit::new(
            2,
            "Chrono".to_string(),
            Some(GridSlot::B2),
            CombatStats::new(SpiritRole::MainDps, 200, 20, 300),
            false,
        );

        let party = vec![tank, dps];

        for _ in 0..10 {
            let target = TacticalTargeting::select_target(&party, &mut rng);
            assert!(target.is_some());
            assert_eq!(target.unwrap().id, 1, "Taunter must always be targeted");
        }
    }
}
