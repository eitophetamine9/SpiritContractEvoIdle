//! 7-Core Dual Attributes, Damage Mitigation Curves, and Role Scaling Profiles

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum SpiritRole {
    MainDps,
    SubDps,
    TankDefense,
    TankOffense,
    Healer,
    Control,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PrimaryScalingStat {
    Atk,
    Def,
    Hp,
    ManaReplenish,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CombatStats {
    pub max_hp: u64,
    pub current_hp: u64,
    pub atk: u64,
    pub def: u64,
    pub spd: f32,
    pub crit_rate: f32, // Percentage e.g. 15.0 for 15%
    pub crit_dmg: f32,  // Percentage e.g. 150.0 for 150% (1.5x)
    pub effective_threat: u32,
    pub current_mp: f32,
    pub max_mp: f32,
    pub shield_hp: u64,
    pub taunt_timer: f32,
    pub role: SpiritRole,
}

impl CombatStats {
    pub fn new(role: SpiritRole, base_atk: u64, base_def: u64, base_hp: u64) -> Self {
        let (threat, crit_rate, crit_dmg) = match role {
            SpiritRole::TankDefense => (180, 5.0, 150.0),
            SpiritRole::TankOffense => (120, 10.0, 150.0),
            SpiritRole::MainDps => (40, 20.0, 160.0),
            SpiritRole::SubDps => (45, 15.0, 150.0),
            SpiritRole::Healer => (30, 5.0, 150.0),
            SpiritRole::Control => (50, 10.0, 150.0),
        };

        Self {
            max_hp: base_hp,
            current_hp: base_hp,
            atk: base_atk,
            def: base_def,
            spd: 1.0,
            crit_rate,
            crit_dmg,
            effective_threat: threat,
            current_mp: 0.0,
            max_mp: 100.0,
            shield_hp: 0,
            taunt_timer: 0.0,
            role,
        }
    }

    /// Calculates DEF damage reduction multiplier: 350.0 / (350.0 + DEF)
    pub fn calculate_mitigation_multiplier(def: u64) -> f32 {
        350.0 / (350.0 + (def as f32))
    }

    /// Calculates incoming mitigated damage: Damage = RawDamage * (350 / (350 + DEF))
    pub fn mitigate_damage(raw_damage: u64, def: u64) -> u64 {
        let mult = Self::calculate_mitigation_multiplier(def);
        let mitigated = ((raw_damage as f32) * mult).round() as u64;
        if mitigated == 0 && raw_damage > 0 {
            1
        } else {
            mitigated
        }
    }

    /// Resolves an attack with critical strike check
    pub fn calculate_attack_damage(&self, is_crit: bool) -> u64 {
        if is_crit {
            let mult = self.crit_dmg / 100.0;
            ((self.atk as f32) * mult).round() as u64
        } else {
            self.atk
        }
    }

    /// Takes damage applying barrier shields first, then HP
    pub fn take_damage(&mut self, incoming_damage: u64) -> (u64, u64) {
        let mut remaining = incoming_damage;
        let mut absorbed_by_shield = 0;

        if self.shield_hp > 0 {
            if self.shield_hp >= remaining {
                self.shield_hp -= remaining;
                absorbed_by_shield = remaining;
                remaining = 0;
            } else {
                absorbed_by_shield = self.shield_hp;
                remaining -= self.shield_hp;
                self.shield_hp = 0;
            }
        }

        if remaining > 0 {
            if self.current_hp > remaining {
                self.current_hp -= remaining;
            } else {
                self.current_hp = 0;
            }
        }

        (absorbed_by_shield, remaining)
    }

    pub fn is_alive(&self) -> bool {
        self.current_hp > 0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_damage_mitigation_formula() {
        // DEF = 0 -> multiplier = 350 / (350 + 0) = 1.0 (100% damage)
        assert_eq!(CombatStats::mitigate_damage(100, 0), 100);

        // DEF = 350 -> multiplier = 350 / 700 = 0.5 (50% damage reduction)
        assert_eq!(CombatStats::mitigate_damage(100, 350), 50);

        // DEF = 1050 -> multiplier = 350 / 1400 = 0.25 (75% damage reduction)
        assert_eq!(CombatStats::mitigate_damage(1000, 1050), 250);
    }

    #[test]
    fn test_shield_absorption() {
        let mut stats = CombatStats::new(SpiritRole::MainDps, 100, 0, 500);
        stats.shield_hp = 150;

        let (absorbed, hp_loss) = stats.take_damage(100);
        assert_eq!(absorbed, 100);
        assert_eq!(hp_loss, 0);
        assert_eq!(stats.shield_hp, 50);
        assert_eq!(stats.current_hp, 500);

        let (absorbed2, hp_loss2) = stats.take_damage(100);
        assert_eq!(absorbed2, 50);
        assert_eq!(hp_loss2, 50);
        assert_eq!(stats.shield_hp, 0);
        assert_eq!(stats.current_hp, 450);
    }
}
