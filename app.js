const COIN_VALUES = [0.01, 0.02, 0.05, 0.10, 0.20, 0.50, 1.00, 2.00];

const COIN_IMAGES = {
  0.01: 'muenzen/euro-muenzen-1-cent-2007-highResolution.jpg',
  0.02: 'muenzen/euro-muenzen-2-cent-2007-highResolution.jpg',
  0.05: 'muenzen/euro-muenzen-5-cent-2007-highResolution.jpg',
  0.10: 'muenzen/euro-muenzen-10-cent-2007-highResolution.jpg',
  0.20: 'muenzen/euro-muenzen-20-cent-2007-highResolution.jpg',
  0.50: 'muenzen/euro-muenzen-50-cent-2007-highResolution.jpg',
  1.00: 'muenzen/euro-muenzen-1-euro-2007-highResolution.jpg',
  2.00: 'muenzen/euro-muenzen-2-euro-2007-highResolution.jpg'
};

let currentCardsData = [];
let selectedCardIndex = null;

let activeDragCard = null;
let activeDragPointerId = null;
let dragClone = null;
let touchStartX = 0, touchStartY = 0;
let isDragging = false;

document.addEventListener('DOMContentLoaded', () => {
  initGame();
});

function normalizeValue(value) {
  return Number(value.toFixed(2));
}

function initGame() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    card.classList.remove('fade-out', 'selected', 'drop-target');
    card.style.transform = '';
    card.style.pointerEvents = 'auto';
    card.style.visibility = 'visible';
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

function createCoinImage(value) {
  const normalizedValue = normalizeValue(value);
  const imagePath = COIN_IMAGES[normalizedValue];

  if (!imagePath) {
    console.warn(`Kein Bild für Münzwert ${normalizedValue} gefunden`);
    return `<div class="coin-placeholder">€${normalizedValue.toFixed(2)}</div>`;
  }

  return `<img src="${imagePath}" alt="${normalizedValue} Euro Münze" class="coin-image" />`;
}

function renderCards() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    const value = currentCardsData[index];
    card.innerHTML = createCoinImage(value);
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

function getCardAtPosition(x, y) {
  const cards = document.querySelectorAll('.card');
  for (const card of cards) {
    const rect = card.getBoundingClientRect();
    if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
      return card;
    }
  }
  return null;
}

function handlePointerDown(e) {
  if (isDragging || activeDragCard !== null) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  activeDragCard = e.currentTarget;
  activeDragPointerId = e.pointerId;
  isDragging = true;

  const cardRect = activeDragCard.getBoundingClientRect();
  touchStartX = e.clientX;
  touchStartY = e.clientY;

  activeDragCard.style.pointerEvents = 'none';
  activeDragCard.style.visibility = 'hidden';

  const cards = document.querySelectorAll('.card');
  cards.forEach((card) => {
    if (card !== activeDragCard) {
      card.style.pointerEvents = 'none';
    }
  });

  dragClone = activeDragCard.cloneNode(true);
  dragClone.classList.add('dragging');
  dragClone.style.position = 'fixed';
  dragClone.style.width = `${cardRect.width}px`;
  dragClone.style.height = `${cardRect.height}px`;
  dragClone.style.left = `${cardRect.left}px`;
  dragClone.style.top = `${cardRect.top}px`;
  dragClone.style.pointerEvents = 'none';
  document.body.appendChild(dragClone);

  window.addEventListener('pointermove', handlePointerMove);
  window.addEventListener('pointerup', handlePointerUp);
  window.addEventListener('pointercancel', handlePointerCancel);
}

function handlePointerMove(e) {
  if (!activeDragCard || !dragClone || e.pointerId !== activeDragPointerId) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  const deltaX = e.clientX - touchStartX;
  const deltaY = e.clientY - touchStartY;
  dragClone.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;

  const targetCard = getCardAtPosition(e.clientX, e.clientY);
}

function handlePointerUp(e) {
  if (!activeDragCard || !dragClone || e.pointerId !== activeDragPointerId) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  finishDrag(e, true);
}

function handlePointerCancel(e) {
  if (!activeDragCard || e.pointerId !== activeDragPointerId) return;
  finishDrag(e, false);
}

function finishDrag(e, evaluateDrop) {
  window.removeEventListener('pointermove', handlePointerMove);
  window.removeEventListener('pointerup', handlePointerUp);
  window.removeEventListener('pointercancel', handlePointerCancel);

  let targetCard = null;
  if (evaluateDrop) {
    targetCard = getCardAtPosition(e.clientX, e.clientY);
  }

  if (dragClone) {
    dragClone.remove();
    dragClone = null;
  }

  document.querySelectorAll('.card').forEach((card) => {
    card.classList.remove('drop-target');
    card.style.pointerEvents = 'auto';
  });

  const draggedCard = activeDragCard;
  if (draggedCard) {
    draggedCard.style.pointerEvents = 'auto';
    draggedCard.style.visibility = 'visible';
  }

  const fromIndex = Number(draggedCard.dataset.index);
  const moveDist = Math.hypot(e.clientX - touchStartX, e.clientY - touchStartY);

  if (evaluateDrop && targetCard && targetCard !== draggedCard && moveDist > 10) {
    const toIndex = Number(targetCard.dataset.index);
    checkMatch(fromIndex, toIndex);
  } else if (evaluateDrop && moveDist <= 10) {
    handleTap(draggedCard);
  }

  activeDragCard = null;
  activeDragPointerId = null;
  isDragging = false;
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
  if (index1 === index2) {
    return;
  }

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
