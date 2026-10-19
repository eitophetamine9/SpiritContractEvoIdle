/**
 * PvPArenaService: Asynchronous "Phantom Duels" Arena Coordinator
 * Fetches rival contractor snapshots, calculates Elo ratings, and runs authenticated Wasm duels.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { authService } from './authService.js';
import { gameState } from '../state/gameState.js';
import { antiCheatService } from './antiCheatService.js';
import { wasmCombatBridge } from '../engine/wasmCombatBridge.js';

export const ELO_TIERS = [
  { name: 'Bronze Contractor', minElo: 0, color: '#cd7f32', badge: '🥉' },
  { name: 'Silver Duelist', minElo: 1100, color: '#c0c0c0', badge: '🥈' },
  { name: 'Gold Champion', minElo: 1300, color: '#ffd700', badge: '🥇' },
  { name: 'Platinum Archon', minElo: 1500, color: '#38bdf8', badge: '💎' },
  { name: 'Diamond Sovereign', minElo: 1700, color: '#a855f7', badge: '👑' },
  { name: 'Astral Grandmaster', minElo: 1900, color: '#f43f5e', badge: '🌟' }
];

export function getEloTier(elo = 1000) {
  for (let i = ELO_TIERS.length - 1; i >= 0; i--) {
    if (elo >= ELO_TIERS[i].minElo) {
      return ELO_TIERS[i];
    }
  }
  return ELO_TIERS[0];
}

class PvPArenaService {
  constructor() {
    this.activeDuel = null;
  }

  getPlayerElo() {
    return gameState.state?.contractor?.eloRating || 1000;
  }

  /**
   * Generates a 3x3 defense formation snapshot for cloud leaderboards
   */
  generateDefenseSnapshot(rawState = gameState.state) {
    if (!rawState) return [];
    const party = rawState.party || [];
    const spirits = rawState.spirits || [];
    const formation = rawState.partyFormation || {};

    const roster = [];
    for (const [slotKey, spiritId] of Object.entries(formation)) {
      if (!spiritId) continue;
      const spirit = spirits.find(s => s.id === spiritId);
      if (!spirit) continue;

      const stats = gameState.getSpiritCombatStats ? gameState.getSpiritCombatStats(spirit) : null;
      roster.push({
        slot: slotKey,
        id: spirit.id,
        speciesId: spirit.speciesId,
        customName: spirit.customName || spirit.speciesId,
        level: spirit.level || 1,
        rarity: spirit.rarity || 'COMMON',
        element: spirit.element || 'WIND',
        power: spirit.power || 20,
        maxHp: stats ? stats.maxHp : (spirit.maxHp || 100),
        currentHp: stats ? stats.maxHp : (spirit.maxHp || 100),
        atk: stats ? stats.atk : (spirit.power || 20),
        def: stats ? stats.def : 20,
        spd: stats ? stats.spd : 1.0,
        critRate: stats ? stats.critRate : 5.0,
        critDmg: stats ? stats.critDmg : 150.0,
        role: stats ? stats.role : 'MainDps'
      });
    }

    return roster;
  }

  /**
   * Fetches rival contractors near the player's Elo rating
   */
  async fetchRankedOpponents() {
    const playerElo = this.getPlayerElo();
    const currentUser = authService.currentUser;

    if (isSupabaseConfigured() && supabase) {
      try {
        let query = supabase
          .from('leaderboards')
          .select('user_id, username, avatar_emoji, contractor_level, elo_rating, total_party_power, defense_roster')
          .neq('user_id', currentUser?.id || '00000000-0000-0000-0000-000000000000')
          .order('elo_rating', { ascending: false });

        const { data, error } = await query;
        if (!error && Array.isArray(data) && data.length > 0) {
          // Filter opponents with defense rosters and pick 4 close to playerElo
          const candidates = data.filter(d => Array.isArray(d.defense_roster) && d.defense_roster.length > 0);
          if (candidates.length >= 2) {
            candidates.sort((a, b) => Math.abs((a.elo_rating || 1000) - playerElo) - Math.abs((b.elo_rating || 1000) - playerElo));
            return candidates.slice(0, 4);
          }
        }
      } catch (err) {
        console.warn('[PvPArenaService] Failed to query online rivals:', err);
      }
    }

    // High-quality Phantom Contractors for Offline / Guest Mode
    return this.getMockPhantomOpponents(playerElo);
  }

  getMockPhantomOpponents(playerElo) {
    return [
      {
        user_id: 'phantom_ignis',
        username: 'Ignis Archon',
        avatar_emoji: '🔥',
        contractor_level: 5,
        elo_rating: playerElo + 35,
        total_party_power: 450,
        defense_roster: [
          { slot: 'f2', id: 'p1', speciesId: 'cat_spirit', customName: 'Flame Sovereign', level: 12, rarity: 'RARE', element: 'FIRE', maxHp: 850, currentHp: 850, atk: 75, def: 60, critRate: 15, critDmg: 160 },
          { slot: 'm2', id: 'p2', speciesId: 'chicken_spirit', customName: 'Cinder Phoenix', level: 10, rarity: 'UNCOMMON', element: 'FIRE', maxHp: 620, currentHp: 620, atk: 90, def: 35, critRate: 20, critDmg: 170 }
        ]
      },
      {
        user_id: 'phantom_chrono',
        username: 'Chrono Weaver',
        avatar_emoji: '⏳',
        contractor_level: 4,
        elo_rating: Math.max(950, playerElo - 25),
        total_party_power: 380,
        defense_roster: [
          { slot: 'f1', id: 'p3', speciesId: 'wisp_spirit', customName: 'Time Phantom', level: 10, rarity: 'RARE', element: 'LIGHT', maxHp: 780, currentHp: 780, atk: 65, def: 55, critRate: 10, critDmg: 150 },
          { slot: 'b2', id: 'p4', speciesId: 'chrono_hatchling', customName: 'Aeon Drake', level: 11, rarity: 'EPIC', element: 'WIND', maxHp: 920, currentHp: 920, atk: 110, def: 40, critRate: 25, critDmg: 180 }
        ]
      },
      {
        user_id: 'phantom_glacial',
        username: 'Glacial Vanguard',
        avatar_emoji: '🛡️',
        contractor_level: 6,
        elo_rating: playerElo + 60,
        total_party_power: 520,
        defense_roster: [
          { slot: 'f2', id: 'p5', speciesId: 'cat_spirit', customName: 'Frost Aegis', level: 14, rarity: 'EPIC', element: 'WATER', maxHp: 1200, currentHp: 1200, atk: 50, def: 120, critRate: 5, critDmg: 150 },
          { slot: 'm1', id: 'p6', speciesId: 'caterpillar_spirit', customName: 'Blizzard Silk', level: 12, rarity: 'RARE', element: 'WATER', maxHp: 800, currentHp: 800, atk: 70, def: 50, critRate: 12, critDmg: 155 }
        ]
      }
    ];
  }

  /**
   * Calculates standard Elo rating adjustment
   */
  calculateEloChange(playerElo, opponentElo, playerWon) {
    const K = 32;
    const expectedScore = 1.0 / (1.0 + Math.pow(10, (opponentElo - playerElo) / 400.0));
    const actualScore = playerWon ? 1.0 : 0.0;
    const change = Math.round(K * (actualScore - expectedScore));
    return playerWon ? Math.max(12, change) : Math.min(-10, change);
  }

  /**
   * Commits the result of a duel, updates Elo rating, and syncs
   */
  async commitDuelResult(opponent, isVictory) {
    const currentElo = this.getPlayerElo();
    const eloDelta = this.calculateEloChange(currentElo, opponent.elo_rating || 1000, isVictory);
    const newElo = Math.max(800, currentElo + eloDelta);

    if (!gameState.state.contractor) {
      gameState.state.contractor = {};
    }
    gameState.state.contractor.eloRating = newElo;

    // Award PvP spoils on victory
    let spoils = null;
    if (isVictory) {
      const shardsAwarded = 250 + Math.round((opponent.elo_rating || 1000) * 0.15);
      gameState.state.resources.spiritShards = (gameState.state.resources.spiritShards || 0) + shardsAwarded;
      spoils = { shards: shardsAwarded, medals: 5 };
    }

    gameState.save(true);
    gameState.emit('pvpDuelCompleted', {
      opponent,
      isVictory,
      eloDelta,
      newElo,
      spoils
    });

    return {
      isVictory,
      eloDelta,
      newElo,
      spoils
    };
  }
}

export const pvpArenaService = new PvPArenaService();
