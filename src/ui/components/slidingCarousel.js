/**
 * Sliding 3-Card Carousel Component
 * Provides a responsive, smooth-animated 3-card carousel (Reference UI aesthetic)
 * for Pantheon Trials, Divine Forge, and Astral Realm hubs.
 */

import { getGameIcon } from '../icons/gameIcons.js';
import gsap from 'gsap';

// Persistent registry to retain scroll position across re-renders per carousel ID
const carouselSlidePositions = new Map();

export function renderSlidingCarouselHtml({
  carouselId = 'sliding-carousel',
  cards = [],
  selectedId = null,
  actionLabel = 'SELECT & CHALLENGE',
  showCounter = true
}) {
  const selectedIndex = Math.max(0, cards.findIndex(c => c.id === selectedId));
  const activeCount = cards.length;
  const perView = 3;
  const maxIdx = Math.max(0, activeCount - perView);

  let displayIndex = 0;
  if (carouselSlidePositions.has(carouselId)) {
    displayIndex = Math.max(0, Math.min(carouselSlidePositions.get(carouselId), maxIdx));
  } else if (selectedIndex < perView) {
    displayIndex = 0;
  } else {
    displayIndex = Math.min(selectedIndex - perView + 1, maxIdx);
  }

  return `
    <div id="${carouselId}" class="sliding-carousel-container" data-cards-count="${cards.length}" data-current-index="${displayIndex}">
      
      <!-- Top Carousel Navigation Controls & Counter -->
      <div class="carousel-controls-bar">
        ${showCounter ? `
          <div class="carousel-counter-badge" id="${carouselId}-counter">
            ${getGameIcon('sparkle', { size: '11px', color: '#ffd152' })}
            <span class="counter-text"><span class="curr-num">${displayIndex + 1}</span> / <span class="total-num">${activeCount}</span></span>
          </div>
        ` : '<div></div>'}

        <div class="carousel-nav-arrows">
          <button id="${carouselId}-prev-btn" class="carousel-arrow-btn" title="Previous Item" aria-label="Previous">
            ${getGameIcon('chevronLeft', { size: '16px', color: '#ffd152' })}
          </button>
          <button id="${carouselId}-next-btn" class="carousel-arrow-btn" title="Next Item" aria-label="Next">
            ${getGameIcon('chevronRight', { size: '16px', color: '#ffd152' })}
          </button>
        </div>
      </div>

      <!-- Main Carousel Viewport -->
      <div class="carousel-viewport" id="${carouselId}-viewport">
        <div class="carousel-track" id="${carouselId}-track">
          ${cards.map((card, index) => {
            const isSelected = card.id === selectedId;
            const cardBgColor = card.color || '#f59e0b';
            const cardAccentColor = card.accentColor || '#ffd152';

            return `
              <div class="carousel-sliding-card ${isSelected ? 'selected' : ''}" 
                   data-card-id="${card.id}" 
                   data-card-index="${index}"
                   style="${isSelected ? `border-color: ${cardAccentColor};` : ''}">
                
                <!-- Active Checkmark Badge -->
                ${isSelected ? `
                  <div class="card-active-check-badge" title="Active Selection">
                    ${getGameIcon('check', { size: '14px', color: '#fff' })}
                  </div>
                ` : ''}

                <!-- Top Illustrated Banner Art -->
                <div class="card-header-banner" style="background: linear-gradient(135deg, ${cardBgColor}33 0%, rgba(15, 23, 42, 0.95) 100%);">
                  <div class="card-banner-bg-gradient" style="background: radial-gradient(circle at 50% 30%, ${cardBgColor}44 0%, transparent 75%);"></div>
                  <div class="card-banner-overlay-shading"></div>
                  
                  <div class="card-banner-ambient-art">
                    ${card.bannerArtHtml || `<span style="font-size: 38px;">${card.sigil || '⚔️'}</span>`}
                  </div>
                </div>

                <!-- Overlapping Emblem Hexagon Badge -->
                <div class="card-overlapping-emblem-wrap">
                  <div class="card-overlapping-emblem" style="border-color: ${cardAccentColor}; box-shadow: 0 4px 14px rgba(0,0,0,0.7), 0 0 12px ${cardBgColor}55;">
                    ${card.emblemHtml || getGameIcon('dungeon', { size: '22px', color: cardAccentColor })}
                  </div>
                </div>

                <!-- Card Body & Details -->
                <div class="card-body-content">
                  <div>
                    <h4 class="card-title-text" style="${isSelected ? `color: ${cardAccentColor}; text-shadow: 0 0 10px ${cardAccentColor}66;` : ''}">
                      ${card.name || card.title}
                    </h4>
                    <div class="card-subtitle-text">${card.subtitle || card.godTitle || card.desc || ''}</div>
                  </div>

                  <!-- Key Metrics Strip -->
                  ${card.metrics && card.metrics.length > 0 ? `
                    <div class="card-metrics-pill-row">
                      ${card.metrics.map(m => `
                        <span class="card-metric-pill ${m.highlight ? 'highlight' : ''}">
                          ${m.icon ? m.icon : ''} ${m.label ? `<strong>${m.label}:</strong> ` : ''}${m.value}
                        </span>
                      `).join('')}
                    </div>
                  ` : ''}

                  <!-- Bottom Action Button -->
                  <button class="card-bottom-action-btn" data-action-card-id="${card.id}">
                    ${card.actionIcon || getGameIcon('zap', { size: '12px' })}
                    <span>${card.actionLabel || (isSelected ? 'ACTIVE SELECTION' : actionLabel)}</span>
                  </button>
                </div>

              </div>
            `;
          }).join('')}
        </div>
      </div>

      <!-- Pagination Dots Bar -->
      <div class="carousel-pagination-row" id="${carouselId}-pagination">
        ${cards.map((card, idx) => `
          <button class="carousel-dot ${idx === displayIndex ? 'active' : ''}" 
                  data-dot-index="${idx}" 
                  title="${card.name || card.title}" 
                  aria-label="Go to slide ${idx + 1}">
          </button>
        `).join('')}
      </div>

    </div>
  `;
}

export function attachSlidingCarouselEvents({
  carouselId = 'sliding-carousel',
  cards = [],
  selectedId = null,
  onSelect = () => {},
  onAction = null,
  container = document
}) {
  if (!container || typeof container.querySelector !== 'function') return;
  const root = container.querySelector(`#${carouselId}`);
  if (!root || typeof root.querySelector !== 'function' || typeof root.querySelectorAll !== 'function') return;

  const viewport = root.querySelector(`#${carouselId}-viewport`);
  const track = root.querySelector(`#${carouselId}-track`);
  const prevBtn = root.querySelector(`#${carouselId}-prev-btn`);
  const nextBtn = root.querySelector(`#${carouselId}-next-btn`);
  const counterEl = root.querySelector(`#${carouselId}-counter`);
  const dots = Array.from(root.querySelectorAll('.carousel-dot') || []);

  const totalCards = cards.length;

  function getCardsPerView() {
    if (!viewport) return 3;
    const width = viewport.clientWidth;
    if (width < 600) return 1;
    if (width < 860) return 2;
    return 3;
  }

  function getMaxIndex() {
    const perView = getCardsPerView();
    return Math.max(0, totalCards - perView);
  }

  const selectedIndex = cards.findIndex(c => c.id === selectedId);
  const perView = getCardsPerView();
  const maxIdx = getMaxIndex();

  let currentIndex = 0;
  if (carouselSlidePositions.has(carouselId)) {
    currentIndex = Math.max(0, Math.min(carouselSlidePositions.get(carouselId), maxIdx));
    // If the selected card is outside visible viewport [currentIndex, currentIndex + perView - 1],
    // gently adjust position so it is in view
    if (selectedIndex >= 0) {
      if (selectedIndex < currentIndex) {
        currentIndex = selectedIndex;
      } else if (selectedIndex >= currentIndex + perView) {
        currentIndex = Math.min(selectedIndex - perView + 1, maxIdx);
      }
    }
  } else if (selectedIndex >= 0) {
    if (selectedIndex < perView) {
      currentIndex = 0;
    } else {
      currentIndex = Math.min(selectedIndex - perView + 1, maxIdx);
    }
  }

  carouselSlidePositions.set(carouselId, currentIndex);

  function updateCarouselView(animate = true) {
    const curMax = getMaxIndex();
    currentIndex = Math.max(0, Math.min(currentIndex, curMax));
    carouselSlidePositions.set(carouselId, currentIndex);

    // Update Counter
    if (counterEl && typeof counterEl.querySelector === 'function') {
      const currNum = counterEl.querySelector('.curr-num');
      if (currNum) currNum.textContent = String(currentIndex + 1);
    }

    // Update Dots
    dots.forEach((dot, idx) => {
      if (dot && dot.classList && typeof dot.classList.toggle === 'function') {
        dot.classList.toggle('active', idx === currentIndex);
      }
    });

    // Update Prev / Next Buttons state
    if (prevBtn) prevBtn.disabled = currentIndex <= 0;
    if (nextBtn) nextBtn.disabled = currentIndex >= curMax;

    // Calculate translation offset
    const cardEl = track?.firstElementChild;
    if (!cardEl || !track) return;

    let cardWidth = 0;
    if (typeof cardEl.getBoundingClientRect === 'function') {
      const rect = cardEl.getBoundingClientRect();
      cardWidth = rect.width;
    }
    const gap = 16;
    if (!cardWidth || cardWidth <= 0) {
      const curPerView = getCardsPerView();
      const vpWidth = viewport?.clientWidth || 960;
      cardWidth = (vpWidth - (curPerView - 1) * gap) / curPerView;
    }
    const offset = Math.round(currentIndex * (cardWidth + gap));

    if (track.style) {
      track.style.transition = 'none';
    }

    if (animate && typeof gsap !== 'undefined' && gsap.to) {
      gsap.to(track, {
        x: -offset,
        duration: 0.32,
        ease: 'power2.out',
        overwrite: 'auto'
      });
    } else if (typeof gsap !== 'undefined' && gsap.set) {
      gsap.set(track, { x: -offset });
    } else if (track && track.style) {
      if (animate) {
        track.style.transition = 'transform 0.32s cubic-bezier(0.2, 0.8, 0.25, 1)';
      } else {
        track.style.transition = 'none';
      }
      track.style.transform = `translateX(-${offset}px)`;
    }
  }

  // Prev / Next button listeners
  if (prevBtn) {
    prevBtn.addEventListener('click', (e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (currentIndex > 0) {
        currentIndex -= 1;
        carouselSlidePositions.set(carouselId, currentIndex);
        updateCarouselView(true);
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', (e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      if (currentIndex < getMaxIndex()) {
        currentIndex += 1;
        carouselSlidePositions.set(carouselId, currentIndex);
        updateCarouselView(true);
      }
    });
  }

  // Dots click listeners
  dots.forEach(dot => {
    dot.addEventListener('click', (e) => {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
      const dotTarget = e && e.currentTarget ? e.currentTarget : dot;
      const dotIdx = parseInt(dotTarget.getAttribute ? dotTarget.getAttribute('data-dot-index') : '0', 10);
      if (!isNaN(dotIdx)) {
        currentIndex = Math.max(0, Math.min(dotIdx, getMaxIndex()));
        carouselSlidePositions.set(carouselId, currentIndex);
        updateCarouselView(true);
      }
    });
  });

  // Card click & Action Button listeners
  root.querySelectorAll('.carousel-sliding-card').forEach(cardEl => {
    cardEl.addEventListener('click', (e) => {
      const cardId = cardEl.getAttribute('data-card-id');
      const cardIdx = parseInt(cardEl.getAttribute('data-card-index'), 10);
      
      // Auto-slide to bring clicked card into view if needed
      if (!isNaN(cardIdx)) {
        const curPerView = getCardsPerView();
        const curMax = getMaxIndex();
        if (cardIdx < currentIndex) {
          currentIndex = cardIdx;
          carouselSlidePositions.set(carouselId, currentIndex);
          updateCarouselView(true);
        } else if (cardIdx >= currentIndex + curPerView) {
          currentIndex = Math.min(cardIdx - curPerView + 1, curMax);
          carouselSlidePositions.set(carouselId, currentIndex);
          updateCarouselView(true);
        } else {
          // Card is ALREADY in visible viewport: keep currentIndex unchanged!
          carouselSlidePositions.set(carouselId, currentIndex);
        }
      }

      if (onSelect) onSelect(cardId);
    });

    const actionBtn = typeof cardEl.querySelector === 'function' ? cardEl.querySelector('.card-bottom-action-btn') : null;
    if (actionBtn) {
      actionBtn.addEventListener('click', (e) => {
        if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
        const cardId = actionBtn.getAttribute('data-action-card-id');
        if (onAction) {
          onAction(cardId);
        } else if (onSelect) {
          onSelect(cardId);
        }
      });
    }
  });

  // Touch Swipe Gesture Support
  let touchStartX = 0;
  let touchStartY = 0;
  let isSwiping = false;

  if (viewport) {
    viewport.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = true;
      }
    }, { passive: true });

    viewport.addEventListener('touchend', (e) => {
      if (!isSwiping || e.changedTouches.length === 0) return;
      isSwiping = false;
      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      const diffX = touchEndX - touchStartX;
      const diffY = touchEndY - touchStartY;

      // Ensure horizontal swipe dominates vertical scroll
      if (Math.abs(diffX) > 40 && Math.abs(diffX) > Math.abs(diffY)) {
        if (diffX < 0 && currentIndex < getMaxIndex()) {
          currentIndex += 1;
          carouselSlidePositions.set(carouselId, currentIndex);
          updateCarouselView(true);
        } else if (diffX > 0 && currentIndex > 0) {
          currentIndex -= 1;
          carouselSlidePositions.set(carouselId, currentIndex);
          updateCarouselView(true);
        }
      }
    }, { passive: true });
  }

  // Window resize handler to maintain accurate translate offset
  const resizeHandler = () => updateCarouselView(false);
  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('resize', resizeHandler);
  }

  // Initial alignment: instantly position without blitzing or animation
  updateCarouselView(false);
  if (typeof requestAnimationFrame !== 'undefined') {
    requestAnimationFrame(() => updateCarouselView(false));
  }

  return {
    updateView: updateCarouselView,
    destroy: () => {
      if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
        window.removeEventListener('resize', resizeHandler);
      }
    }
  };
}
