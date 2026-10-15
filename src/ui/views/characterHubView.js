/**
 * Spirit Sanctum Hub - Dedicated Character & Rebirth Nexus
 * Portrait-friendly, clean and uncluttered mobile/desktop responsive design.
 * Shows essential combat metrics by default, with collapsible 'More Info' sections
 * for the deep 7-Core dual attributes breakdown, 54-spirit scaling matrix, and 16-parameter dossier.
 */

import { gameState } from '../../state/gameState.js';
import { 
  SPIRIT_SPECIES, 
  getXpRequiredForLevel, 
  getRarityInfo,
  getRoleInfo,
  getSpiritRole,
  REBIRTH_CONFIG,
  getScalingProfile,
  calculateSpiritStats
} from '../../data/spiritsData.js';
import { GREEK_GOD_SETS } from '../../data/equipmentData.js';
import { 
  SpriteAnimator, 
  getSheetKeyForSpecies, 
  createAnimatedRelicHtml, 
  createAnimatedWeaponHtml 
} from '../../render/spriteAnimator.js';
import { audioManager } from '../../audio/audioManager.js';
import { showEvolutionCeremonyModal, showDetailedAttributesModal } from '../components/modals.js';

let currentSelectedSpiritId = null;
let activeSubHub = 'attributes'; // 'attributes', 'weapons', 'relics', 'rebirths', 'talents'
let selectedRoleFilter = 'all';
let heroSearchQuery = '';
let activeStageAnimator = null;
let isMoreInfoExpanded = false;
let isFiltersExpanded = false;
let isRebirthListExpanded = false;

export function renderCharacterHubView(container, options = {}) {
  if (options.spiritId) {
    currentSelectedSpiritId = options.spiritId;
  }
  if (options.subHub) {
    activeSubHub = options.subHub;
  }

  const allSpirits = gameState.state.spirits || [];
  if (allSpirits.length === 0) {
    container.innerHTML = `
      <div class="sanctum-empty-state">
        <div class="empty-icon">⛩️</div>
        <h3>No Spirits Contracted Yet</h3>
        <p>Visit the Altar to summon and forge contracts with mystical spirits.</p>
      </div>
    `;
    return;
  }

  // Ensure valid selected spirit
  let selectedSpirit = allSpirits.find(s => s.id === currentSelectedSpiritId);
  if (!selectedSpirit) {
    const partySpirits = gameState.getPartySpirits();
    selectedSpirit = partySpirits[0] || allSpirits[0];
    currentSelectedSpiritId = selectedSpirit.id;
  }

  const species = SPIRIT_SPECIES[selectedSpirit.speciesId] || {};
  const rarityInfo = getRarityInfo(selectedSpirit.rarity);
  const roleInfo = getRoleInfo(selectedSpirit.speciesId);
  const scalingProfile = getScalingProfile(selectedSpirit.speciesId);
  const combatStats = gameState.getSpiritCombatStats(selectedSpirit);
  const rebirthTier = selectedSpirit.rebirthLevel || 0;
  const isPartyMember = (gameState.state.party || []).includes(selectedSpirit.id);

  // Filter roster
  const filteredSpirits = allSpirits.filter(s => {
    const sp = SPIRIT_SPECIES[s.speciesId];
    if (!sp) return false;
    if (selectedRoleFilter !== 'all' && sp.role !== selectedRoleFilter) return false;
    if (heroSearchQuery.trim()) {
      const q = heroSearchQuery.toLowerCase().trim();
      const matchName = (s.customName || sp.name).toLowerCase().includes(q);
      const matchSpecies = sp.name.toLowerCase().includes(q);
      if (!matchName && !matchSpecies) return false;
    }
    return true;
  });

  container.innerHTML = `
    <div class="sanctum-hub-root portrait-optimized">
      
      <!-- Top Header & Currencies Pill -->
      <div class="sanctum-header-bar">
        <div class="sanctum-title-group">
          <span class="sanctum-main-icon">🌟</span>
          <div>
            <h2 class="sanctum-title">SPIRIT SANCTUM HUB</h2>
            <span class="sanctum-subtitle">Hero Attributes & Rebirth Nexus</span>
          </div>
        </div>

        <div class="sanctum-currencies-bar">
          <div class="sanctum-currency-pill" title="Soul Essence">
            <span class="curr-icon">🔮</span>
            <span class="curr-val">${(gameState.state.resources.soulEssence || 0).toLocaleString()}</span>
          </div>
          <div class="sanctum-currency-pill" title="Spirit Shards">
            <span class="curr-icon">💎</span>
            <span class="curr-val">${(gameState.state.resources.spiritShards || 0).toLocaleString()}</span>
          </div>
          <div class="sanctum-currency-pill" title="God Essences">
            <span class="curr-icon">⚡</span>
            <span class="curr-val">${(gameState.state.resources.essencesOfTheGods || 0).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <!-- Portrait Hero Selector Strip (Horizontal Carousel) -->
      <div class="sanctum-hero-strip-wrapper">
        <div class="strip-controls-row">
          <span class="strip-count-label">Contracted Spirits (${filteredSpirits.length})</span>
          <button class="btn-toggle-filters ${isFiltersExpanded ? 'active' : ''}" id="btn-toggle-filters">
            ${isFiltersExpanded ? '✕ Hide Filters' : '🔍 Filter & Search'}
          </button>
        </div>

        ${isFiltersExpanded ? `
          <div class="strip-filters-panel" id="strip-filters-panel">
            <div class="sanctum-search-box">
              <span class="search-icon">🔍</span>
              <input type="text" id="sanctum-search-input" placeholder="Search spirit..." value="${heroSearchQuery}">
            </div>
            <div class="sanctum-role-filter-chips">
              <button class="role-chip ${selectedRoleFilter === 'all' ? 'active' : ''}" data-role="all">All</button>
              <button class="role-chip ${selectedRoleFilter === 'MAIN_DPS' ? 'active' : ''}" data-role="MAIN_DPS">⚔️ DPS</button>
              <button class="role-chip ${selectedRoleFilter === 'SUB_DPS' ? 'active' : ''}" data-role="SUB_DPS">🗡️ Sub</button>
              <button class="role-chip ${selectedRoleFilter === 'TANK' ? 'active' : ''}" data-role="TANK">🛡️ Tank</button>
              <button class="role-chip ${selectedRoleFilter === 'SUPPORT' ? 'active' : ''}" data-role="SUPPORT">🪄 Sup</button>
              <button class="role-chip ${selectedRoleFilter === 'HEALER' ? 'active' : ''}" data-role="HEALER">💚 Heal</button>
            </div>
          </div>
        ` : ''}

        <div class="sanctum-hero-strip" id="sanctum-hero-strip">
          ${filteredSpirits.map(spirit => {
            const sp = SPIRIT_SPECIES[spirit.speciesId] || {};
            const sRarity = getRarityInfo(spirit.rarity);
            const sRole = getRoleInfo(spirit.speciesId);
            const isSelected = spirit.id === selectedSpirit.id;
            const inParty = (gameState.state.party || []).includes(spirit.id);
            const rTier = spirit.rebirthLevel || 0;

            return `
              <div class="strip-hero-chip ${isSelected ? 'selected' : ''}" data-spirit-id="${spirit.id}" style="border-color: ${isSelected ? '#a855f7' : sRarity.border};">
                <div class="chip-avatar" style="background: ${sRarity.bg}; border-color: ${sRarity.border};">
                  <span>${sRole.icon}</span>
                </div>
                <div class="chip-info">
                  <span class="chip-name" style="color: ${sRarity.color};">${spirit.customName || sp.name}</span>
                  <span class="chip-sub">Lv.${spirit.level}${rTier > 0 ? ` • ⭐${rTier}` : ''}${inParty ? ' • [Party]' : ''}</span>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Center Hero Stage Viewport (Compact Portrait Design) -->
      <section class="sanctum-hero-stage portrait-stage">
        <div class="stage-backdrop-glow" style="background: radial-gradient(circle, ${species.element === 'Fire' ? 'rgba(255, 68, 56, 0.22)' : species.element === 'Water' ? 'rgba(0, 195, 255, 0.22)' : species.element === 'Void' ? 'rgba(179, 66, 255, 0.22)' : 'rgba(241, 196, 15, 0.22)'} 0%, transparent 70%);"></div>

        <div class="stage-hero-identity">
          <div class="stage-tags-row">
            <span class="rarity-badge" style="background: ${rarityInfo.bg}; border: 1px solid ${rarityInfo.border}; color: ${rarityInfo.color};">
              ${rarityInfo.name.toUpperCase()}
            </span>
            <span class="element-badge">${species.element || 'Normal'}</span>
            <span class="role-badge" style="background: ${roleInfo.bg}; border: 1px solid ${roleInfo.border}; color: ${roleInfo.color};">
              ${roleInfo.icon} ${roleInfo.name}
            </span>
            <span class="archetype-badge">
              ${scalingProfile.title}
            </span>
          </div>

          <h1 class="stage-hero-name" style="color: ${rarityInfo.color};">
            ${selectedSpirit.customName || species.name}
          </h1>
          <div class="stage-hero-title">${species.title || species.name}</div>
        </div>

        <!-- Animated Creature Stage Canvas -->
        <div class="stage-viewport-center">
          <div class="creature-canvas-mount" id="sanctum-creature-mount"></div>
          <div class="stage-pedestal-plinth">
            <div class="pedestal-rune-circle"></div>
          </div>
          <div class="stage-animation-controls">
            <button class="anim-btn" id="btn-anim-attack" title="Trigger Attack">⚔️ Strike</button>
            <button class="anim-btn" id="btn-anim-hurt" title="Trigger Hit Reaction">🛡️ Flinch</button>
          </div>
        </div>

        <!-- Stage Bottom Quick Stats -->
        <div class="stage-stats-strip">
          <div class="stage-stat-pill">
            <span class="stat-lbl">Combat Power</span>
            <span class="stat-val cp-val">⚡ ${(combatStats?.power || selectedSpirit.power || 0).toLocaleString()}</span>
          </div>
          <div class="stage-stat-pill">
            <span class="stat-lbl">Rebirth Tier</span>
            <span class="stat-val rebirth-val">${rebirthTier > 0 ? `⭐ Tier ${rebirthTier} (+${REBIRTH_CONFIG[rebirthTier - 1]?.bonusPercent || 0}%)` : '⭐0'}</span>
          </div>
          <div class="stage-stat-pill">
            <span class="stat-lbl">Threat Footprint</span>
            <span class="stat-val threat-val">🎯 ${combatStats?.threat || roleInfo.baseThreat}</span>
          </div>
        </div>
      </section>

      <!-- Sub-Hub Tabs Navigation & Details -->
      <main class="sanctum-panel portrait-panel">
        <nav class="sanctum-subhub-nav">
          <button class="subhub-tab-btn ${activeSubHub === 'attributes' ? 'active' : ''}" data-subhub="attributes">
            <span class="subhub-icon">📊</span>
            <span class="subhub-text">Attributes</span>
          </button>
          <button class="subhub-tab-btn ${activeSubHub === 'weapons' ? 'active' : ''}" data-subhub="weapons">
            <span class="subhub-icon">⚔️</span>
            <span class="subhub-text">Weapon</span>
          </button>
          <button class="subhub-tab-btn ${activeSubHub === 'relics' ? 'active' : ''}" data-subhub="relics">
            <span class="subhub-icon">🏛️</span>
            <span class="subhub-text">Relics</span>
          </button>
          <button class="subhub-tab-btn ${activeSubHub === 'rebirths' ? 'active' : ''}" data-subhub="rebirths">
            <span class="subhub-icon">${gameState.isFeatureUnlocked('SPIRIT_REBIRTH') ? '🌟' : '🔒'}</span>
            <span class="subhub-text">${gameState.isFeatureUnlocked('SPIRIT_REBIRTH') ? 'Rebirths' : 'Rebirths (Lv.25)'}</span>
          </button>
          <button class="subhub-tab-btn ${activeSubHub === 'talents' ? 'active' : ''}" data-subhub="talents">
            <span class="subhub-icon">📜</span>
            <span class="subhub-text">Talents</span>
          </button>
        </nav>

        <div class="sanctum-subhub-content" id="sanctum-subhub-content">
          ${renderSubHubContent(selectedSpirit, activeSubHub)}
        </div>
      </main>

    </div>
  `;

  // Mount Creature Animation Canvas
  mountCreatureAnimator(selectedSpirit);

  // Attach All Sanctum Event Listeners
  attachSanctumListeners(container, selectedSpirit);
}

/**
 * Mounts SpriteAnimator onto the center stage viewport
 */
function mountCreatureAnimator(spirit) {
  if (typeof document === 'undefined' || typeof document.getElementById !== 'function') return;
  if (activeStageAnimator) {
    activeStageAnimator.destroy();
    activeStageAnimator = null;
  }

  const mountEl = document.getElementById('sanctum-creature-mount');
  if (!mountEl) return;

  const sheetKey = getSheetKeyForSpecies(spirit.speciesId);
  activeStageAnimator = new SpriteAnimator(sheetKey);
  activeStageAnimator.mount(mountEl, { width: 96, height: 96 });
}

/**
 * Sub-Hub Content Router
 */
function renderSubHubContent(spirit, subHub) {
  switch (subHub) {
    case 'attributes':
      return renderAttributesSubHub(spirit);
    case 'weapons':
      return renderWeaponsSubHub(spirit);
    case 'relics':
      return renderRelicsSubHub(spirit);
    case 'rebirths':
      return renderRebirthsSubHub(spirit);
    case 'talents':
      return renderTalentsSubHub(spirit);
    default:
      return renderAttributesSubHub(spirit);
  }
}

/**
 * 1. ATTRIBUTES SUB-HUB (Portrait & Uncluttered with "More Info" Expander)
 */
function renderAttributesSubHub(spirit) {
  const species = SPIRIT_SPECIES[spirit.speciesId] || {};
  const combatStats = gameState.getSpiritCombatStats(spirit);
  const scaling = getScalingProfile(spirit.speciesId);
  const role = getRoleInfo(spirit.speciesId);
  const attrs = combatStats.attributes || {};

  const reqXp = getXpRequiredForLevel(spirit.level);
  const currentXp = spirit.xp || 0;
  const isMaxLevel = spirit.level >= (species.levelCap || 100);
  const xpPct = isMaxLevel ? 100 : Math.min(100, Math.floor((currentXp / reqXp) * 100));

  return `
    <div class="subhub-pane attributes-pane">
      
      <!-- Concise Primary 4-Stat Overview (Clean & Legible) -->
      <div class="concise-stats-grid">
        <div class="concise-stat-card">
          <div class="cstat-head">
            <span class="cstat-icon">💚</span>
            <span class="cstat-label">Max HP</span>
          </div>
          <div class="cstat-val">${(attrs.hp?.total || combatStats.maxHp).toLocaleString()}</div>
          <div class="cstat-sub">+${attrs.hp?.bonus?.toLocaleString() || 0} (+${attrs.hp?.percent || 0}%)</div>
        </div>

        <div class="concise-stat-card">
          <div class="cstat-head">
            <span class="cstat-icon">⚔️</span>
            <span class="cstat-label">Attack (ATK)</span>
          </div>
          <div class="cstat-val">${(attrs.atk?.total || combatStats.atk).toLocaleString()}</div>
          <div class="cstat-sub">+${attrs.atk?.bonus?.toLocaleString() || 0} (+${attrs.atk?.percent || 0}%)</div>
        </div>

        <div class="concise-stat-card">
          <div class="cstat-head">
            <span class="cstat-icon">🛡️</span>
            <span class="cstat-label">Defense (DEF)</span>
          </div>
          <div class="cstat-val">${(attrs.def?.total || combatStats.def).toLocaleString()}</div>
          <div class="cstat-sub">+${attrs.def?.bonus?.toLocaleString() || 0} (+${attrs.def?.percent || 0}%)</div>
        </div>

        <div class="concise-stat-card">
          <div class="cstat-head">
            <span class="cstat-icon">🎯</span>
            <span class="cstat-label">CRIT Rate / DMG</span>
          </div>
          <div class="cstat-val">${(attrs.critRate?.total || combatStats.critRate || 5).toFixed(1)}%</div>
          <div class="cstat-sub">${(attrs.critDmg?.total || combatStats.critDmg || 150).toFixed(1)}% DMG</div>
        </div>
      </div>

      <!-- Quick Level Progression Strip -->
      <div class="level-progression-card">
        <div class="progression-header">
          <div class="lvl-label">Level ${spirit.level} / ${species.levelCap || 100}</div>
          <div class="xp-ratio">${isMaxLevel ? 'MAX LEVEL' : `${currentXp.toLocaleString()} / ${reqXp.toLocaleString()} XP (${xpPct}%)`}</div>
        </div>
        <div class="sanctum-progress-track">
          <div class="sanctum-progress-fill" style="width: ${xpPct}%;"></div>
        </div>
        <div class="level-action-buttons">
          <button class="btn-sanctum-action" id="btn-sanctum-levelup" ${isMaxLevel ? 'disabled' : ''}>
            ⏫ Level Up (+1)
          </button>
          ${spirit.canEvolve ? `
            <button class="btn-sanctum-action accent" id="btn-sanctum-ascend">
              🌟 Ascend Evolution
            </button>
          ` : ''}
        </div>
      </div>

      <!-- More Info Toggle & Detailed Dossier Trigger -->
      <div class="more-info-control-bar">
        <button class="btn-toggle-more-info ${isMoreInfoExpanded ? 'active' : ''}" id="btn-toggle-more-info">
          ${isMoreInfoExpanded ? '▼ Hide Detailed Attributes' : '▶ 📜 More Info (Expand All 7 Attributes & Matrix)'}
        </button>
        <button class="btn-open-dossier-pill" id="btn-open-detailed-dossier" title="Open 16-parameter categorized dossier modal">
          📋 16-Param Dossier
        </button>
      </div>

      <!-- Collapsible Detailed 7-Core Attributes & Scaling Matrix (Uncluttered) -->
      <div class="collapsible-details-container ${isMoreInfoExpanded ? 'expanded' : 'collapsed'}" id="collapsible-details-container">
        
        <div class="pane-section-header">
          <span class="sec-title">7-CORE ATTRIBUTES TOTAL & PERCENTAGE BREAKDOWN</span>
          <span class="sec-tag">Base + Gear + Rebirth Multipliers</span>
        </div>

        <div class="dual-attributes-grid">
          <!-- 1. HP -->
          <div class="attribute-row-card">
            <div class="attr-icon-box hp">💚</div>
            <div class="attr-details">
              <div class="attr-label-line">
                <span class="attr-name">Max HP</span>
                <span class="attr-total">${attrs.hp?.total?.toLocaleString() || combatStats.maxHp}</span>
              </div>
              <div class="attr-formula-line">
                <span>Base: ${attrs.hp?.base?.toLocaleString()}</span>
                <span class="attr-bonus-tag">+${attrs.hp?.bonus?.toLocaleString()} (+${attrs.hp?.percent || 0}%)</span>
              </div>
            </div>
          </div>

          <!-- 2. ATK -->
          <div class="attribute-row-card">
            <div class="attr-icon-box atk">⚔️</div>
            <div class="attr-details">
              <div class="attr-label-line">
                <span class="attr-name">Attack (ATK)</span>
                <span class="attr-total">${attrs.atk?.total?.toLocaleString() || combatStats.atk}</span>
              </div>
              <div class="attr-formula-line">
                <span>Base: ${attrs.atk?.base?.toLocaleString()}</span>
                <span class="attr-bonus-tag">+${attrs.atk?.bonus?.toLocaleString()} (+${attrs.atk?.percent || 0}%)</span>
              </div>
            </div>
          </div>

          <!-- 3. DEF -->
          <div class="attribute-row-card">
            <div class="attr-icon-box def">🛡️</div>
            <div class="attr-details">
              <div class="attr-label-line">
                <span class="attr-name">Defense (DEF)</span>
                <span class="attr-total">${attrs.def?.total?.toLocaleString() || combatStats.def}</span>
              </div>
              <div class="attr-formula-line">
                <span>Base: ${attrs.def?.base?.toLocaleString()}</span>
                <span class="attr-bonus-tag">+${attrs.def?.bonus?.toLocaleString()} (+${attrs.def?.percent || 0}%)</span>
              </div>
            </div>
          </div>

          <!-- 4. CRIT RATE -->
          <div class="attribute-row-card">
            <div class="attr-icon-box crit">🎯</div>
            <div class="attr-details">
              <div class="attr-label-line">
                <span class="attr-name">CRIT Rate</span>
                <span class="attr-total">${(attrs.critRate?.total || combatStats.critRate || 5).toFixed(1)}%</span>
              </div>
              <div class="attr-formula-line">
                <span>Base: ${attrs.critRate?.base || 5}%</span>
                <span class="attr-bonus-tag">+${((attrs.critRate?.total || 5) - (attrs.critRate?.base || 5)).toFixed(1)}% Gear</span>
              </div>
            </div>
          </div>

          <!-- 5. CRIT DMG -->
          <div class="attribute-row-card">
            <div class="attr-icon-box critdmg">💥</div>
            <div class="attr-details">
              <div class="attr-label-line">
                <span class="attr-name">CRIT Damage</span>
                <span class="attr-total">${(attrs.critDmg?.total || combatStats.critDmg || 150).toFixed(1)}%</span>
              </div>
              <div class="attr-formula-line">
                <span>Base: ${attrs.critDmg?.base || 150}%</span>
                <span class="attr-bonus-tag">+${((attrs.critDmg?.total || 150) - (attrs.critDmg?.base || 150)).toFixed(1)}% Gear</span>
              </div>
            </div>
          </div>

          <!-- 6. ULT AMP -->
          <div class="attribute-row-card">
            <div class="attr-icon-box ult">🔮</div>
            <div class="attr-details">
              <div class="attr-label-line">
                <span class="attr-name">Ultimate Amplification</span>
                <span class="attr-total">${(attrs.ultAmp?.total || combatStats.ultAmp || 0).toFixed(1)}%</span>
              </div>
              <div class="attr-formula-line">
                <span>Base: ${attrs.ultAmp?.base || 0}%</span>
                <span class="attr-bonus-tag">+${(attrs.ultAmp?.total || 0).toFixed(1)}% Potency</span>
              </div>
            </div>
          </div>

          <!-- 7. MANA REPLENISH -->
          <div class="attribute-row-card">
            <div class="attr-icon-box mana">⚡</div>
            <div class="attr-details">
              <div class="attr-label-line">
                <span class="attr-name">Mana Replenish Rate</span>
                <span class="attr-total">${(attrs.manaReplenish?.total || combatStats.manaReplenish || 100).toFixed(1)}%</span>
              </div>
              <div class="attr-formula-line">
                <span>Base: 100% (10 MP/s)</span>
                <span class="attr-bonus-tag">${(attrs.manaReplenish?.total || 100) >= 100 ? `+${((attrs.manaReplenish?.total || 100) - 100).toFixed(1)}% Speed` : 'Base'}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Dynamic Scaling Profile Breakdown Card -->
        <div class="scaling-profile-card">
          <div class="profile-card-header">
            <span class="profile-icon">📜</span>
            <div class="profile-info">
              <div class="profile-title">${scaling.title} (${role.name})</div>
              <div class="profile-formula">${scaling.formulaDesc}</div>
            </div>
          </div>
          <div class="profile-badges-row">
            <span class="scale-badge primary">Primary: % ${scaling.primaryStat.toUpperCase()}</span>
            <span class="scale-badge secondary">Secondary: % ${scaling.secondaryStat.toUpperCase()}</span>
            <span class="scale-badge perk">Column: ${role.optimalColumnLabel}</span>
          </div>
        </div>

      </div>

    </div>
  `;
}

/**
 * 2. WEAPONS SUB-HUB
 */
function renderWeaponsSubHub(spirit) {
  const weapon = spirit.equippedWeapon;
  const shards = gameState.state.resources.spiritShards || 0;
  const godsEssences = gameState.state.resources.essencesOfTheGods || 0;

  if (!weapon) {
    return `
      <div class="subhub-pane weapons-pane">
        <div class="empty-subhub-box">
          <div class="empty-icon">⚔️</div>
          <h3>No Weapon Equipped</h3>
          <p>Equip a divine blade, bow, staff, claws, or mallet to bolster attack potency.</p>
        </div>
      </div>
    `;
  }

  const isMaxLvl = (weapon.level || 1) >= 15;
  const nextLvl = (weapon.level || 1) + 1;
  const nextMilestone = nextLvl % 3 === 0;
  const shardCost = (weapon.level || 1) * 350;
  const essenceCost = nextMilestone ? Math.floor(nextLvl / 3) * 5 : 0;
  const canEnhance = !isMaxLvl && shards >= shardCost && godsEssences >= essenceCost;

  return `
    <div class="subhub-pane weapons-pane">
      <div class="pane-section-header">
        <span class="sec-title">EQUIPPED ARMAMENT</span>
        <span class="sec-tag">Level +${weapon.level || 1} / +15</span>
      </div>

      <div class="weapon-master-card">
        <div class="weapon-card-top">
          <div class="weapon-sprite-stage">
            ${createAnimatedWeaponHtml(weapon.type || weapon.weaponTypeId || 'sword', 56)}
          </div>
          <div class="weapon-headline">
            <div class="weapon-name">${weapon.name}</div>
            <div class="weapon-type-pill">${(weapon.type || weapon.weaponTypeId || 'Weapon').toUpperCase()} • ${weapon.rarity || 'RARE'}</div>
            <div class="weapon-atk-badge">⚔️ +${weapon.atkPower || 0} ATK Power</div>
          </div>
        </div>

        <div class="weapon-substats-list">
          <div class="substat-item">
            <span class="substat-name">Base Attack Potency</span>
            <span class="substat-val">+${weapon.atkPower || 0}</span>
          </div>
          ${weapon.critRate ? `
            <div class="substat-item">
              <span class="substat-name">Critical Rating</span>
              <span class="substat-val">+${weapon.critRate}%</span>
            </div>
          ` : ''}
          ${weapon.ultAmp ? `
            <div class="substat-item">
              <span class="substat-name">Ultimate Amplification</span>
              <span class="substat-val">+${weapon.ultAmp}%</span>
            </div>
          ` : ''}
          ${weapon.defBonus ? `
            <div class="substat-item">
              <span class="substat-name">Bonus Defense</span>
              <span class="substat-val">+${weapon.defBonus}</span>
            </div>
          ` : ''}
          ${weapon.hpBonus ? `
            <div class="substat-item">
              <span class="substat-name">Bonus Max HP</span>
              <span class="substat-val">+${weapon.hpBonus}</span>
            </div>
          ` : ''}
          ${weapon.abilityName ? `
            <div class="weapon-passive-box" style="margin-top: 8px; padding: 8px 10px; background: rgba(255,255,255,0.04); border-left: 2px solid #e1b12c; border-radius: 4px; text-align: left;">
              <div style="font-size: 11px; font-weight: 700; color: #f1c40f; display: flex; align-items: center; gap: 4px;">✦ ${weapon.abilityName}</div>
              <div style="font-size: 10px; color: #a4b0be; line-height: 1.35; margin-top: 2px;">${weapon.abilityDesc || ''}</div>
            </div>
          ` : ''}
        </div>

        <div class="weapon-enhance-bar">
          <div class="enhance-cost-line">
            <span>Cost: 💎 ${shardCost.toLocaleString()} Shards</span>
            ${essenceCost > 0 ? `<span>• ⚡ ${essenceCost} Gods Essences</span>` : ''}
          </div>
          <div class="enhance-buttons-row">
            <button class="btn-sanctum-action" id="btn-sanctum-enhance-weapon" ${canEnhance ? '' : 'disabled'}>
              ${isMaxLvl ? 'MAX LEVEL (+15)' : `🔨 Enhance (+${nextLvl})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

/**
 * 3. RELICS SUB-HUB
 */
function renderRelicsSubHub(spirit) {
  const equippedRelics = spirit.equippedRelics || {};
  const slots = [
    { key: 'headgear', name: 'Headgear (Crown)', icon: '👑' },
    { key: 'weapon', name: 'Consecrated Relic (Blade)', icon: '🗡️' },
    { key: 'necklace', name: 'Necklace (Trident/Amulet)', icon: '📿' },
    { key: 'totem', name: 'Totem / Charm (Bulwark/Orb)', icon: '🛡️' }
  ];

  const godCounts = {};
  Object.values(equippedRelics).forEach(relic => {
    if (relic && relic.godId) {
      godCounts[relic.godId] = (godCounts[relic.godId] || 0) + 1;
    }
  });

  return `
    <div class="subhub-pane relics-pane">
      <div class="pane-section-header">
        <span class="sec-title">GREEK GOD CONSECRATED SET BONUSES</span>
        <span class="sec-tag">Active Resonances</span>
      </div>

      <div class="god-sets-tracker">
        ${Object.keys(GREEK_GOD_SETS).map(godId => {
          const count = godCounts[godId] || 0;
          const setInfo = GREEK_GOD_SETS[godId];
          const has2pc = count >= 2;
          const has4pc = count >= 4;

          return `
            <div class="god-set-pill ${has4pc ? 'active-4' : has2pc ? 'active-2' : ''}">
              <span class="set-name">${setInfo.name}: (${count}/4)</span>
              <span class="set-perk-summary">${has4pc ? setInfo.fourPieceBonus : setInfo.twoPieceBonus}</span>
            </div>
          `;
        }).join('')}
      </div>

      <div class="relic-slots-grid">
        ${slots.map(s => {
          const relic = equippedRelics[s.key];
          if (!relic) {
            return `
              <div class="relic-slot-card empty" data-slot-type="${s.key}">
                <div class="slot-empty-icon">${s.icon}</div>
                <div class="slot-name">${s.name}</div>
                <div class="slot-empty-hint">Empty Slot</div>
              </div>
            `;
          }

          return `
            <div class="relic-slot-card occupied" data-slot-type="${s.key}">
              <div class="relic-card-header">
                <div class="relic-mini-sprite">
                  ${createAnimatedRelicHtml(relic.godId || relic.setId || 'zeus', s.key, 36)}
                </div>
                <div class="relic-info">
                  <div class="relic-name">${relic.name || s.name}</div>
                  <div class="relic-stars">⭐ ${relic.stars || 3} Stars • +${relic.level || 1}</div>
                </div>
              </div>

              <div class="relic-main-stat">
                <span>${relic.mainStatName || 'Main Stat'}</span>
                <span class="stat-highlight">+${relic.mainStatValue || 0}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

/**
 * 4. REBIRTHS SUB-HUB (Uncluttered with Collapsible 7-Tier Node Tree)
 */
function renderRebirthsSubHub(spirit) {
  const isRebirthUnlocked = gameState.isFeatureUnlocked('SPIRIT_REBIRTH');
  const currentTier = spirit.rebirthLevel || 0;
  const duplicateSpirits = (gameState.state.spirits || []).filter(
    s => s.speciesId === spirit.speciesId && s.id !== spirit.id
  );
  const nextTier = currentTier + 1;
  const canAscendRebirth = isRebirthUnlocked && nextTier <= 7 && duplicateSpirits.length >= 1 && (gameState.state.resources.soulEssence || 0) >= (nextTier * 5);

  return `
    <div class="subhub-pane rebirths-pane">
      <div class="pane-section-header">
        <span class="sec-title">CELESTIAL REBIRTH NEXUS (REBIRTH I TO VII)</span>
        <span class="sec-tag">${isRebirthUnlocked ? `Active Boost: +${currentTier > 0 ? (REBIRTH_CONFIG[currentTier - 1]?.bonusPercent || 0) : 0}%` : '🔒 Requires Contractor Lv. 25'}</span>
      </div>

      ${!isRebirthUnlocked ? `
        <div class="empty-subhub-box" style="padding: 16px 14px; border: 1px dashed rgba(245, 158, 11, 0.4); background: rgba(15, 23, 42, 0.85); border-radius: 16px; text-align: center; margin-bottom: 12px;">
          <div style="font-size: 26px; margin-bottom: 4px;">🔒</div>
          <h4 style="color: #ffd152; font-weight: 900; font-size: 13px; margin-bottom: 2px;">Spirit Rebirth Chamber Locked</h4>
          <p style="color: #cbd5e1; font-size: 11px; line-height: 1.35; max-width: 320px; margin: 0 auto;">
            Requires <strong>Contractor Level 25</strong> to transcend maximum level limits and ignite 7-star constellation affinities.
          </p>
        </div>
      ` : ''}

      <!-- Current Rebirth Active Card -->

      <div class="rebirth-current-card">
        <div class="rcard-header">
          <span class="rcard-star-badge">${currentTier > 0 ? `⭐ Tier ${currentTier}` : '⭐0 Dormant'}</span>
          <span class="rcard-bonus">+${currentTier > 0 ? (REBIRTH_CONFIG[currentTier - 1]?.bonusPercent || 0) : 0}% All Base Stats</span>
        </div>
        <div class="rcard-desc">
          ${currentTier > 0 ? (REBIRTH_CONFIG[currentTier - 1]?.uniqueAddition || '') : 'Ascend your spirit using duplicate contracts to awaken celestial power.'}
        </div>
      </div>

      <!-- Rebirth Ascension Action Chamber -->
      <div class="rebirth-forge-chamber">
        <div class="forge-info-line">
          <span>Duplicates Available: <strong>${duplicateSpirits.length}</strong> (Requires 1 copy)</span>
          <span>Cost: <strong>${(gameState.state.resources.soulEssence || 0).toLocaleString()} / ${nextTier <= 7 ? nextTier * 5 : 0} 🔮</strong></span>
        </div>

        <button class="btn-sanctum-action accent" id="btn-sanctum-rebirth-ascend" ${canAscendRebirth ? '' : 'disabled'}>
          ${nextTier > 7 ? '⭐ MAXIMUM REBIRTH VII ACHIEVED' : `🌟 Ascend to Rebirth ${nextTier} (+${REBIRTH_CONFIG[nextTier - 1]?.bonusPercent || (nextTier * 12)}%)`}
        </button>
      </div>

      <!-- Collapsible All 7 Tiers Track -->
      <div class="rebirth-expand-toggle-bar">
        <button class="btn-toggle-rebirth-list" id="btn-toggle-rebirth-list">
          ${isRebirthListExpanded ? '▼ Hide Rebirth Progression Track' : '▶ 📜 View All 7 Rebirth Tiers'}
        </button>
      </div>

      <div class="rebirth-nodes-track ${isRebirthListExpanded ? 'expanded' : 'collapsed'}" id="rebirth-nodes-track">
        ${[1, 2, 3, 4, 5, 6, 7].map(tier => {
          const cfg = REBIRTH_CONFIG[tier - 1] || {};
          const isUnlocked = currentTier >= tier;
          const isNext = currentTier + 1 === tier;

          return `
            <div class="rebirth-node-item ${isUnlocked ? 'unlocked' : isNext ? 'next' : 'locked'}">
              <div class="node-star-pillar">
                <span class="node-star-badge">${isUnlocked ? '⭐' : isNext ? '🔓' : '🔒'}</span>
                <span class="node-num">Tier ${tier}</span>
              </div>
              <div class="node-content">
                <div class="node-header-line">
                  <span class="node-title">${cfg.name || `Rebirth ${tier}`}</span>
                  <span class="node-stat-mult">+${cfg.bonusPercent || (tier * 12)}% Stats</span>
                </div>
                <div class="node-passive-desc">
                  ✨ ${cfg.uniqueAddition || 'Ascended attributes resonance.'}
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

    </div>
  `;
}

/**
 * 5. TALENTS SUB-HUB
 */
function renderTalentsSubHub(spirit) {
  const species = SPIRIT_SPECIES[spirit.speciesId] || {};
  const role = getRoleInfo(spirit.speciesId);
  const scaling = getScalingProfile(spirit.speciesId);

  return `
    <div class="subhub-pane talents-pane">
      <div class="pane-section-header">
        <span class="sec-title">COMBAT TALENTS & SACRED ARTS</span>
        <span class="sec-tag">${role.name}</span>
      </div>

      <div class="talent-card">
        <div class="talent-header">
          <span class="talent-icon">⚔️</span>
          <div>
            <div class="talent-title">Basic Attack: Spirit Cadence</div>
            <div class="talent-type">Combat Basic • Restores 10 MP per strike</div>
          </div>
        </div>
      </div>

      <div class="talent-card">
        <div class="talent-header">
          <span class="talent-icon">${role.icon}</span>
          <div>
            <div class="talent-title">Tactical Trait: ${role.title}</div>
            <div class="talent-type">${role.optimalColumnLabel} Affinity</div>
          </div>
        </div>
        <div class="talent-desc">${role.desc}</div>
      </div>

      <div class="talent-card ultimate">
        <div class="talent-header">
          <span class="talent-icon">🔮</span>
          <div>
            <div class="talent-title">Ultimate Art: ${species.ultimate?.name || 'Cosmic Awakening'}</div>
            <div class="talent-type">100 Mana • ${scaling.title}</div>
          </div>
        </div>
        <div class="talent-desc">
          ${species.ultimate?.description || 'Unleashes concentrated spiritual power upon the battlefield.'}
        </div>
        <div class="talent-formula-box">
          <div class="formula-line"><strong>Primary:</strong> % ${scaling.primaryStat.toUpperCase()} (${scaling.formulaDesc})</div>
          <div class="formula-line"><strong>Secondary:</strong> % ${scaling.secondaryStat.toUpperCase()}${scaling.canCrit ? ' (Can Critically Strike)' : ''}</div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Event Listeners & Interactive State Bindings
 */
function attachSanctumListeners(container, selectedSpirit) {
  if (!container || typeof container.querySelector !== 'function') return;

  // Toggle Filters Panel in Hero Strip
  const btnToggleFilters = container.querySelector('#btn-toggle-filters');
  if (btnToggleFilters) {
    btnToggleFilters.addEventListener('click', () => {
      isFiltersExpanded = !isFiltersExpanded;
      renderCharacterHubView(container);
    });
  }

  // Hero Search Filter
  const searchInput = container.querySelector('#sanctum-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      heroSearchQuery = e.target.value;
      renderCharacterHubView(container);
    });
  }

  // Hero Role Filter Chips
  container.querySelectorAll('.role-chip').forEach(btn => {
    btn.addEventListener('click', (e) => {
      selectedRoleFilter = e.currentTarget.getAttribute('data-role');
      renderCharacterHubView(container);
    });
  });

  // Hero Selection Chips in Strip
  container.querySelectorAll('.strip-hero-chip').forEach(card => {
    card.addEventListener('click', (e) => {
      const spiritId = e.currentTarget.getAttribute('data-spirit-id');
      if (spiritId && spiritId !== currentSelectedSpiritId) {
        currentSelectedSpiritId = spiritId;
        renderCharacterHubView(container);
      }
    });
  });

  // Sub-Hub Navigation Tabs
  container.querySelectorAll('.subhub-tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      activeSubHub = e.currentTarget.getAttribute('data-subhub');
      const contentEl = container.querySelector('#sanctum-subhub-content');
      if (contentEl) {
        contentEl.innerHTML = renderSubHubContent(selectedSpirit, activeSubHub);
        attachSubHubListeners(container, selectedSpirit);
      }
      container.querySelectorAll('.subhub-tab-btn').forEach(b => b.classList.remove('active'));
      e.currentTarget.classList.add('active');
    });
  });

  // Animation Triggers on Center Stage
  const btnAttack = container.querySelector('#btn-anim-attack');
  const btnHurt = container.querySelector('#btn-anim-hurt');

  if (btnAttack && activeStageAnimator) {
    btnAttack.addEventListener('click', () => activeStageAnimator.triggerAttack());
  }
  if (btnHurt && activeStageAnimator) {
    btnHurt.addEventListener('click', () => activeStageAnimator.triggerHurt());
  }

  attachSubHubListeners(container, selectedSpirit);
}

/**
 * Sub-hub inner action listeners
 */
function attachSubHubListeners(container, selectedSpirit) {
  if (!container || typeof container.querySelector !== 'function') return;
  
  // Toggle More Info Button
  const btnMoreInfo = container.querySelector('#btn-toggle-more-info');
  if (btnMoreInfo) {
    btnMoreInfo.addEventListener('click', () => {
      isMoreInfoExpanded = !isMoreInfoExpanded;
      const detailsBox = container.querySelector('#collapsible-details-container');
      if (detailsBox) {
        if (isMoreInfoExpanded) {
          detailsBox.classList.remove('collapsed');
          detailsBox.classList.add('expanded');
          btnMoreInfo.classList.add('active');
          btnMoreInfo.textContent = '▼ Hide Detailed Attributes';
        } else {
          detailsBox.classList.remove('expanded');
          detailsBox.classList.add('collapsed');
          btnMoreInfo.classList.remove('active');
          btnMoreInfo.textContent = '▶ 📜 More Info (Expand All 7 Attributes & Matrix)';
        }
      }
    });
  }

  // Toggle Rebirth List Button
  const btnToggleRebirth = container.querySelector('#btn-toggle-rebirth-list');
  if (btnToggleRebirth) {
    btnToggleRebirth.addEventListener('click', () => {
      isRebirthListExpanded = !isRebirthListExpanded;
      const track = container.querySelector('#rebirth-nodes-track');
      if (track) {
        if (isRebirthListExpanded) {
          track.classList.remove('collapsed');
          track.classList.add('expanded');
          btnToggleRebirth.textContent = '▼ Hide Rebirth Progression Track';
        } else {
          track.classList.remove('expanded');
          track.classList.add('collapsed');
          btnToggleRebirth.textContent = '▶ 📜 View All 7 Rebirth Tiers';
        }
      }
    });
  }

  // Detailed Attribute Dossier button
  const btnDossier = container.querySelector('#btn-open-detailed-dossier');
  if (btnDossier) {
    btnDossier.addEventListener('click', () => {
      showDetailedAttributesModal(selectedSpirit);
    });
  }

  // Level Up button
  const btnLevelUp = container.querySelector('#btn-sanctum-levelup');
  if (btnLevelUp) {
    btnLevelUp.addEventListener('click', () => {
      const species = SPIRIT_SPECIES[selectedSpirit.speciesId];
      if (!species || selectedSpirit.level >= species.levelCap) return;

      const req = getXpRequiredForLevel(selectedSpirit.level) - selectedSpirit.xp;
      selectedSpirit.xp += req;
      selectedSpirit.level += 1;
      selectedSpirit.xp = 0;
      if (selectedSpirit.level >= species.levelCap && species.evolutions && species.evolutions.length > 0) {
        selectedSpirit.canEvolve = true;
      }
      gameState.save();
      renderCharacterHubView(container);
    });
  }

  // Ascend Evolution button
  const btnAscend = container.querySelector('#btn-sanctum-ascend');
  if (btnAscend) {
    btnAscend.addEventListener('click', () => {
      if (selectedSpirit.canEvolve) {
        showEvolutionCeremonyModal(selectedSpirit, () => {
          renderCharacterHubView(container);
        });
      }
    });
  }

  // Enhance Weapon button
  const btnEnhanceWeapon = container.querySelector('#btn-sanctum-enhance-weapon');
  if (btnEnhanceWeapon && selectedSpirit.equippedWeapon) {
    btnEnhanceWeapon.addEventListener('click', () => {
      try {
        gameState.enhanceWeapon(selectedSpirit.equippedWeapon.uid);
        audioManager.playSfx('forge');
        renderCharacterHubView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  }

  // Ascend Rebirth button
  const btnRebirthAscend = container.querySelector('#btn-sanctum-rebirth-ascend');
  if (btnRebirthAscend) {
    btnRebirthAscend.addEventListener('click', () => {
      const duplicateSpirits = (gameState.state.spirits || []).filter(
        s => s.speciesId === selectedSpirit.speciesId && s.id !== selectedSpirit.id
      );
      if (duplicateSpirits.length === 0) {
        alert('You need a duplicate spirit of the same species to perform a Rebirth ascension.');
        return;
      }
      try {
        const dupId = duplicateSpirits[0].id;
        const res = gameState.rebirthSpirit(selectedSpirit.id, [dupId]);
        audioManager.playSfx('summon');
        renderCharacterHubView(container);
      } catch (err) {
        alert(err.message);
      }
    });
  }
}
