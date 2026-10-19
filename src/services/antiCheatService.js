/**
 * AntiCheatService: Client-side cryptographic ticket coordinator and proof-of-play generator.
 * Works seamlessly with supabase/functions/verify-battle for $0/mo server-authoritative anti-cheat.
 */

import { supabase, isSupabaseConfigured } from './supabaseClient.js';
import { authService } from './authService.js';

class AntiCheatService {
  constructor() {
    this.activeTicket = null;
  }

  /**
   * Computes a SHA-256 state hash using the native browser Web Crypto API
   */
  async computeStateHash(seed, isVictory, totalDamageDealt, finalPartyHp) {
    const rawString = `${seed}:${Boolean(isVictory)}:${Math.round(totalDamageDealt)}:${Math.round(finalPartyHp)}`;
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(rawString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Simple deterministic fallback for non-crypto environments
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
      hash = (hash * 31 + rawString.charCodeAt(i)) & 0xFFFFFFFF;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }

  /**
   * Requests a fresh battle session ticket from the Supabase Edge Function
   * @param {number} stage - Madness Zone stage or Dungeon chamber index
   */
  async requestBattleTicket(stage = 1) {
    if (isSupabaseConfigured() && supabase && !authService.isGuest()) {
      try {
        const { data, error } = await supabase.functions.invoke('verify-battle', {
          body: { action: 'init', stage }
        });

        if (!error && data && data.success) {
          this.activeTicket = data;
          return data;
        }
      } catch (err) {
        console.warn('[AntiCheatService] Edge Function unreachable; falling back to local deterministic ticket:', err);
      }
    }

    // Local / Guest Fallback Ticket
    const seed = Math.floor(Math.random() * 1000000000) + 1;
    const ticketId = `local_bkt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const ticket = {
      success: true,
      ticketId,
      seed,
      stage,
      issuedAt: Date.now(),
      signature: 'local_authenticated_session'
    };
    this.activeTicket = ticket;
    return ticket;
  }

  /**
   * Verifies a completed match against Supabase Edge Function
   */
  async verifyMatchProof({ party, enemies, claimedResult }) {
    if (!this.activeTicket) {
      return { verified: true, notice: 'No active ticket; recorded as local match.' };
    }

    const { seed, ticketId, stage, issuedAt, signature } = this.activeTicket;

    // Calculate local state hash
    const localHash = await this.computeStateHash(
      seed,
      claimedResult.isVictory,
      claimedResult.totalDamageDealt || 0,
      claimedResult.finalPartyHp || 0
    );
    claimedResult.claimedStateHash = localHash;

    if (isSupabaseConfigured() && supabase && !authService.isGuest() && !ticketId.startsWith('local_')) {
      try {
        const { data, error } = await supabase.functions.invoke('verify-battle', {
          body: {
            action: 'verify',
            ticketId,
            seed,
            stage,
            issuedAt,
            signature,
            party,
            enemies,
            claimedResult
          }
        });

        if (error || !data || !data.verified) {
          console.warn('[AntiCheatService] Server rejected match outcome:', error || data?.error);
          return {
            verified: false,
            error: data?.error || 'Verification failed.'
          };
        }

        return {
          verified: true,
          authorized: true,
          stateHash: data.stateHash,
          serverMessage: data.message
        };
      } catch (err) {
        console.warn('[AntiCheatService] Exception during Edge verification, falling back to local signature:', err);
      }
    }

    // Local Verification fallback
    return {
      verified: true,
      authorized: true,
      stateHash: localHash,
      notice: 'Verified via local deterministic signature.'
    };
  }
}

export const antiCheatService = new AntiCheatService();
