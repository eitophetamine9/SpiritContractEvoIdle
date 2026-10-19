//! 250ms Discrete Combat Tick Pipeline and Combat Event Emission

use crate::grid::{CombatUnit, TacticalTargeting};
use crate::rng::DeterministicRng;
use crate::stats::CombatStats;
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum CombatEvent {
    AttackLunge {
        source_id: u32,
        target_id: u32,
        raw_damage: u64,
        mitigated_damage: u64,
        shield_absorbed: u64,
        is_crit: bool,
    },
    UltimateCast {
        source_id: u32,
        ability_name: String,
        amount: u64,
    },
    UnitDefeated {
        unit_id: u32,
        is_enemy: bool,
    },
    WaveCleared {
        wave_index: u32,
    },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CombatState {
    pub tick_count: u64,
    pub party: Vec<CombatUnit>,
    pub enemies: Vec<CombatUnit>,
    pub current_wave: u32,
    pub is_victory: bool,
    pub is_defeat: bool,
}

impl CombatState {
    pub fn new(party: Vec<CombatUnit>, enemies: Vec<CombatUnit>) -> Self {
        Self {
            tick_count: 0,
            party,
            enemies,
            current_wave: 1,
            is_victory: false,
            is_defeat: false,
        }
    }

    /// Executes a single discrete combat tick (typically 250ms = 0.25s)
    pub fn step_tick(&mut self, delta_sec: f32, rng: &mut DeterministicRng) -> Vec<CombatEvent> {
        let mut events = Vec::new();

        if self.is_victory || self.is_defeat {
            return events;
        }

        self.tick_count += 1;

        // 1. Tick down timers (Taunt lock, etc.)
        for u in &mut self.party {
            if u.stats.taunt_timer > 0.0 {
                u.stats.taunt_timer = (u.stats.taunt_timer - delta_sec).max(0.0);
            }
        }
        for e in &mut self.enemies {
            if e.stats.taunt_timer > 0.0 {
                e.stats.taunt_timer = (e.stats.taunt_timer - delta_sec).max(0.0);
            }
        }

        // 2. Party Units Action Turn
        for i in 0..self.party.len() {
            if !self.party[i].stats.is_alive() {
                continue;
            }

            // Target an enemy
            let target_opt = TacticalTargeting::select_target(&self.enemies, rng).map(|t| t.id);
            if let Some(target_id) = target_opt {
                if let Some(target) = self.enemies.iter_mut().find(|e| e.id == target_id) {
                    let is_crit = rng.roll_percentage() < self.party[i].stats.crit_rate;
                    let raw_dmg = self.party[i].stats.calculate_attack_damage(is_crit);
                    let mitigated = CombatStats::mitigate_damage(raw_dmg, target.stats.def);
                    let (absorbed, _hp_loss) = target.stats.take_damage(mitigated);

                    events.push(CombatEvent::AttackLunge {
                        source_id: self.party[i].id,
                        target_id: target.id,
                        raw_damage: raw_dmg,
                        mitigated_damage: mitigated,
                        shield_absorbed: absorbed,
                        is_crit,
                    });

                    // Build MP (+20 per strike)
                    self.party[i].stats.current_mp = (self.party[i].stats.current_mp + 20.0).min(100.0);

                    // Check for Ultimate trigger
                    if self.party[i].stats.current_mp >= 100.0 {
                        self.party[i].stats.current_mp = 0.0;
                        let ult_dmg = (self.party[i].stats.atk as f32 * 2.5).round() as u64;
                        let ult_mitigated = CombatStats::mitigate_damage(ult_dmg, target.stats.def);
                        target.stats.take_damage(ult_mitigated);

                        events.push(CombatEvent::UltimateCast {
                            source_id: self.party[i].id,
                            ability_name: "Astral Burst".to_string(),
                            amount: ult_mitigated,
                        });
                    }

                    if !target.stats.is_alive() {
                        events.push(CombatEvent::UnitDefeated {
                            unit_id: target.id,
                            is_enemy: true,
                        });
                    }
                }
            }
        }

        // 3. Enemy Units Action Turn
        for i in 0..self.enemies.len() {
            if !self.enemies[i].stats.is_alive() {
                continue;
            }

            // Target a party spirit
            let target_opt = TacticalTargeting::select_target(&self.party, rng).map(|t| t.id);
            if let Some(target_id) = target_opt {
                if let Some(target) = self.party.iter_mut().find(|p| p.id == target_id) {
                    let is_crit = rng.roll_percentage() < self.enemies[i].stats.crit_rate;
                    let raw_dmg = self.enemies[i].stats.calculate_attack_damage(is_crit);
                    let mitigated = CombatStats::mitigate_damage(raw_dmg, target.stats.def);
                    let (absorbed, _hp_loss) = target.stats.take_damage(mitigated);

                    events.push(CombatEvent::AttackLunge {
                        source_id: self.enemies[i].id,
                        target_id: target.id,
                        raw_damage: raw_dmg,
                        mitigated_damage: mitigated,
                        shield_absorbed: absorbed,
                        is_crit,
                    });

                    if !target.stats.is_alive() {
                        events.push(CombatEvent::UnitDefeated {
                            unit_id: target.id,
                            is_enemy: false,
                        });
                    }
                }
            }
        }

        // 4. Check Win/Loss conditions
        let party_alive = self.party.iter().any(|u| u.stats.is_alive());
        let enemies_alive = self.enemies.iter().any(|u| u.stats.is_alive());

        if !enemies_alive {
            self.is_victory = true;
            events.push(CombatEvent::WaveCleared {
                wave_index: self.current_wave,
            });
        } else if !party_alive {
            self.is_defeat = true;
        }

        events
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::grid::GridSlot;
    use crate::stats::SpiritRole;

    #[test]
    fn test_combat_turn_simulation() {
        let mut rng = DeterministicRng::new(999);

        let spirit = CombatUnit::new(
            1,
            "Cat Spirit".to_string(),
            Some(GridSlot::F2),
            CombatStats::new(SpiritRole::MainDps, 100, 10, 500),
            false,
        );

        let mob = CombatUnit::new(
            101,
            "Madness Slime".to_string(),
            None,
            CombatStats::new(SpiritRole::MainDps, 20, 0, 150),
            true,
        );

        let mut combat = CombatState::new(vec![spirit], vec![mob]);

        // Run ticks until victory
        let mut ticks = 0;
        while !combat.is_victory && !combat.is_defeat && ticks < 20 {
            combat.step_tick(0.25, &mut rng);
            ticks += 1;
        }

        assert!(combat.is_victory, "Party should defeat the mob");
        assert!(!combat.enemies[0].stats.is_alive());
    }
}
