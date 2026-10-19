//! Deterministic seeded PRNG implementation using ChaCha8

use rand_chacha::ChaCha8Rng;
use rand_core::{RngCore, SeedableRng};

#[derive(Clone, Debug)]
pub struct DeterministicRng {
    rng: ChaCha8Rng,
}

impl DeterministicRng {
    pub fn new(seed: u64) -> Self {
        Self {
            rng: ChaCha8Rng::seed_from_u64(seed),
        }
    }

    pub fn next_u32(&mut self) -> u32 {
        self.rng.next_u32()
    }

    pub fn next_f32(&mut self) -> f32 {
        (self.next_u32() as f32) / (u32::MAX as f32)
    }

    pub fn roll_percentage(&mut self) -> f32 {
        self.next_f32() * 100.0
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_deterministic_output() {
        let mut rng1 = DeterministicRng::new(1337);
        let mut rng2 = DeterministicRng::new(1337);

        for _ in 0..10 {
            assert_eq!(rng1.next_u32(), rng2.next_u32());
        }
    }
}
