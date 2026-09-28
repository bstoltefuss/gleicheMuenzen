const COIN_VALUES = [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00, 2.00];

let currentCardsData = [];
let selectedCardIndex = null;

let activeDragCard = null;
let dragClone = null;
let touchStartX = 0, touchStartY = 0;

document.addEventListener('DOMContentLoaded', () => {
  initGame();
});

function normalizeValue(value) {
  return Number(value.toFixed(2));
}

function formatCoinValue(value) {
  const normalized = normalizeValue(value);
  if (normalized < 1) {
    return `${Math.round(normalized * 100)}c`;
  }
  return `${normalized.toFixed(0)}€`;
}

function getCoinStyle(value) {
  const normalized = normalizeValue(value);

  if (normalized === 0.01 || normalized === 0.02 || normalized === 0.05) {
    return {
      name: 'Cent',
      outer: '#c78546',
      inner: '#d9a66a',
      rim: '#8b5e34',
      text: '#774321',
      edge: '#f5d4a7'
    };
  }

  if (normalized === 0.10 || normalized === 0.20 || normalized === 0.50) {
    return {
      name: 'Silber',
      outer: '#c9ced6',
      inner: '#edf1f5',
      rim: '#69727d',
      text: '#3b4653',
      edge: '#ffffff'
    };
  }

  if (normalized === 1.00) {
    return {
      name: 'Euro',
      outer: '#f7d24c',
      inner: '#fff2a8',
      rim: '#a97c00',
      text: '#7d5a00',
      edge: '#fff9d8'
    };
  }

  return {
    name: 'Zwei-Euro',
    outer: '#d9dfe6',
    inner: '#f0f4f9',
    rim: '#626d7b',
    text: '#434d59',
    edge: '#ffffff'
  };
}

function initGame() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    card.classList.remove('fade-out', 'selected', 'drop-target');
    card.style.transform = '';
  });

  generateTask();
  renderCards();
  attachEvents();
}

function generateTask() {
  const matchingValue = COIN_VALUES[Math.floor(Math.random() * COIN_VALUES.length)];

  const remaining = COIN_VALUES.filter((value) => normalizeValue(value) !== normalizeValue(matchingValue));
  const other1 = remaining[Math.floor(Math.random() * remaining.length)];
  const other2 = remaining.filter((value) => normalizeValue(value) !== normalizeValue(other1))[0];

  currentCardsData = [
    matchingValue,
    matchingValue,
    other1,
    other2
  ];

  shuffleArray(currentCardsData);
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createCoinSVG(value) {
  const normalizedValue = normalizeValue(value);
  const style = getCoinStyle(normalizedValue);
  const displayValue = formatCoinValue(normalizedValue);
  const gradientId = `coin-gradient-${Math.random().toString(36).slice(2, 9)}`;

  return `
    <svg class="coin-svg" viewBox="0 0 220 220" xmlns="http://www.w3.org/2000/svg" aria-label="Münze ${displayValue}">
      <defs>
        <radialGradient id="${gradientId}" cx="35%" cy="30%" r="75%">
          <stop offset="0%" stop-color="${style.inner}" />
          <stop offset="45%" stop-color="${style.outer}" />
          <stop offset="100%" stop-color="${style.rim}" />
        </radialGradient>
      </defs>

      <circle cx="110" cy="110" r="92" fill="url(#${gradientId})" stroke="${style.edge}" stroke-width="10" />
      <circle cx="110" cy="110" r="70" fill="none" stroke="rgba(255,255,255,0.7)" stroke-width="6" />
      <circle cx="110" cy="110" r="54" fill="none" stroke="rgba(0,0,0,0.12)" stroke-width="4" />

      <g opacity="0.22">
        ${Array.from({ length: 18 }, (_, index) => {
          const angle = (index / 18) * Math.PI * 2;
          const x1 = 110 + Math.cos(angle) * 72;
          const y1 = 110 + Math.sin(angle) * 72;
          const x2 = 110 + Math.cos(angle) * 82;
          const y2 = 110 + Math.sin(angle) * 82;
          return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="rgba(255,255,255,0.9)" stroke-width="3" stroke-linecap="round" />`;
        }).join('')}
      </g>

      <circle cx="110" cy="110" r="28" fill="rgba(255,255,255,0.18)" />
      <text x="110" y="122" text-anchor="middle" font-size="32" font-weight="700" fill="${style.text}" font-family="Arial, sans-serif">${displayValue}</text>
      <text x="110" y="153" text-anchor="middle" font-size="13" font-weight="600" letter-spacing="2" fill="${style.text}" font-family="Arial, sans-serif">EURO</text>
    </svg>
  `;
}

function renderCards() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    const value = currentCardsData[index];
    card.innerHTML = createCoinSVG(value);
  });
}

function attachEvents() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    const newCard = card.cloneNode(true);
    card.parentNode.replaceChild(newCard, card);
    newCard.addEventListener('pointerdown', handlePointerDown);
  });
}

function handlePointerDown(e) {
  activeDragCard = e.currentTarget;
  const cardRect = activeDragCard.getBoundingClientRect();

  touchStartX = e.clientX;
  touchStartY = e.clientY;

  dragClone = activeDragCard.cloneNode(true);
  dragClone.classList.add('dragging');
  dragClone.style.position = 'fixed';
  dragClone.style.width = `${cardRect.width}px`;
  dragClone.style.height = `${cardRect.height}px`;
  dragClone.style.left = `${cardRect.left}px`;
  dragClone.style.top = `${cardRect.top}px`;
  document.body.appendChild(dragClone);

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
}

function handlePointerMove(e) {
  if (!activeDragCard || !dragClone) return;

  const deltaX = e.clientX - touchStartX;
  const deltaY = e.clientY - touchStartY;

  dragClone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;

  const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
  const targetCard = elementBelow ? elementBelow.closest('.card') : null;

  document.querySelectorAll('.card').forEach((card) => card.classList.remove('drop-target'));
  if (targetCard && targetCard !== activeDragCard) {
    targetCard.classList.add('drop-target');
  }
}

function handlePointerUp(e) {
  if (!activeDragCard || !dragClone) return;

  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);

  const elementBelow = document.elementFromPoint(e.clientX, e.clientY);
  const targetCard = elementBelow ? elementBelow.closest('.card') : null;

  dragClone.remove();
  dragClone = null;

  document.querySelectorAll('.card').forEach((card) => card.classList.remove('drop-target'));

  const fromIndex = Number(activeDragCard.dataset.index);
  const moveDist = Math.hypot(e.clientX - touchStartX, e.clientY - touchStartY);

  if (targetCard && targetCard !== activeDragCard && moveDist > 10) {
    const toIndex = Number(targetCard.dataset.index);
    checkMatch(fromIndex, toIndex);
  } else if (moveDist <= 10) {
    handleTap(activeDragCard);
  }

  activeDragCard = null;
}

function handleTap(card) {
  const index = Number(card.dataset.index);

  if (selectedCardIndex === null) {
    selectedCardIndex = index;
    card.classList.add('selected');
  } else if (selectedCardIndex === index) {
    selectedCardIndex = null;
    card.classList.remove('selected');
  } else {
    const firstCard = document.querySelector(`.card[data-index="${selectedCardIndex}"]`);
    if (firstCard) firstCard.classList.remove('selected');

    checkMatch(selectedCardIndex, index);
    selectedCardIndex = null;
  }
}

function checkMatch(index1, index2) {
  const value1 = currentCardsData[index1];
  const value2 = currentCardsData[index2];

  const isMatch = normalizeValue(value1) === normalizeValue(value2);

  if (isMatch) {
    showSuccessFeedback();
  } else {
    const cards = document.querySelectorAll('.card');
    cards[index1].style.transform = 'scale(0.98)';
    cards[index2].style.transform = 'scale(0.98)';
    setTimeout(() => {
      cards[index1].style.transform = '';
      cards[index2].style.transform = '';
    }, 200);
  }
}

function showSuccessFeedback() {
  const cards = document.querySelectorAll('.card');
  const rainContainer = document.getElementById('stars-rain-container');

  cards.forEach((card) => card.classList.add('fade-out'));

  rainContainer.innerHTML = '';
  rainContainer.classList.remove('hidden');

  const starIcons = ['⭐', '✨', '🌟'];
  for (let i = 0; i < 35; i++) {
    const star = document.createElement('div');
    star.className = 'falling-star';
    star.textContent = starIcons[Math.floor(Math.random() * starIcons.length)];

    const leftPos = Math.random() * 100;
    const duration = 1.2 + Math.random() * 1.0;
    const delay = Math.random() * 0.5;
    const size = 1.8 + Math.random() * 1.8;

    star.style.left = `${leftPos}vw`;
    star.style.animationDuration = `${duration}s`;
    star.style.animationDelay = `${delay}s`;
    star.style.fontSize = `${size}rem`;

    rainContainer.appendChild(star);
  }

  setTimeout(() => {
    rainContainer.classList.add('hidden');
    rainContainer.innerHTML = '';
    initGame();
  }, 2200);
}
