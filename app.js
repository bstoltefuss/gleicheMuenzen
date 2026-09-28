const COLORS = {
  red: '#EF4444',
  yellow: '#EAB308',
  blue: '#3B82F6'
};
const COLOR_KEYS = ['red', 'yellow', 'blue'];

const ALL_COMBINATIONS = [];
for (let i = 0; i < COLOR_KEYS.length; i++) {
  for (let j = i; j < COLOR_KEYS.length; j++) {
    ALL_COMBINATIONS.push([COLOR_KEYS[i], COLOR_KEYS[j]]);
  }
}

let currentCardsData = [];
let selectedCardIndex = null;

let activeDragCard = null;
let dragClone = null;
let touchStartX = 0, touchStartY = 0;

document.addEventListener('DOMContentLoaded', () => {
  initGame();
});

function initGame() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
    card.classList.remove('fade-out', 'selected', 'drop-target');
    card.style.transform = '';
  });

  generateTask();
  renderCards();
  attachEvents();
}

function generateTask() {
  const matchingPair = ALL_COMBINATIONS[Math.floor(Math.random() * ALL_COMBINATIONS.length)];

  let remaining = ALL_COMBINATIONS.filter(combo => !areCombosEqual(combo, matchingPair));

  shuffleArray(remaining);
  const other1 = remaining[0];
  const other2 = remaining[1];

  currentCardsData = [
    randomizeOrder(matchingPair),
    randomizeOrder(matchingPair),
    randomizeOrder(other1),
    randomizeOrder(other2)
  ];
  
  shuffleArray(currentCardsData);
}

function randomizeOrder(combo) {
  return Math.random() < 0.5 ? [combo[0], combo[1]] : [combo[1], combo[0]];
}

function areCombosEqual(comboA, comboB) {
  const sortedA = [...comboA].sort();
  const sortedB = [...comboB].sort();
  return sortedA[0] === sortedB[0] && sortedA[1] === sortedB[1];
}

function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function createFlowerSVG(colorKey1, colorKey2) {
  const hex1 = COLORS[colorKey1];
  const hex2 = COLORS[colorKey2];

  function getPetalsPath(cx, cy, rx, ry, hexColor) {
    let petals = '';
    const offset = 22;
    for (let i = 0; i < 5; i++) {
      const angleDeg = i * 72 - 90;
      const rad = angleDeg * (Math.PI / 180);
      const px = cx + offset * Math.cos(rad);
      const py = cy + offset * Math.sin(rad);

      petals += `<ellipse cx="${px}" cy="${py}" rx="${rx}" ry="${ry}" fill="${hexColor}" transform="rotate(${angleDeg + 90}, ${px}, ${py})" />`;
    }
    return petals;
  }

  return `
    <svg class="flower-svg" viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg">
      <path d="M 55 60 Q 70 140 100 205" stroke="#10B981" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M 145 60 Q 130 140 100 205" stroke="#10B981" stroke-width="10" fill="none" stroke-linecap="round"/>

      <g>
        ${getPetalsPath(55, 60, 10, 20, hex1)}
        <circle cx="55" cy="60" r="14" fill="${hex1}" />
      </g>

      <g>
        ${getPetalsPath(145, 60, 10, 20, hex2)}
        <circle cx="145" cy="60" r="14" fill="${hex2}" />
      </g>
    </svg>
  `;
}

function renderCards() {
  const cards = document.querySelectorAll('.card');
  cards.forEach((card, index) => {
    const combo = currentCardsData[index];
    card.innerHTML = createFlowerSVG(combo[0], combo[1]);
  });
}

function attachEvents() {
  const cards = document.querySelectorAll('.card');
  cards.forEach(card => {
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

  document.querySelectorAll('.card').forEach(c => c.classList.remove('drop-target'));
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

  document.querySelectorAll('.card').forEach(c => c.classList.remove('drop-target'));

  const fromIndex = parseInt(activeDragCard.dataset.index);
  const moveDist = Math.hypot(e.clientX - touchStartX, e.clientY - touchStartY);

  if (targetCard && targetCard !== activeDragCard && moveDist > 10) {
    const toIndex = parseInt(targetCard.dataset.index);
    checkMatch(fromIndex, toIndex);
  } else if (moveDist <= 10) {
    handleTap(activeDragCard);
  }

  activeDragCard = null;
}

function handleTap(card) {
  const index = parseInt(card.dataset.index);

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
  const combo1 = currentCardsData[index1];
  const combo2 = currentCardsData[index2];

  const isMatch = areCombosEqual(combo1, combo2);

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

  cards.forEach(card => card.classList.add('fade-out'));

  rainContainer.innerHTML = '';
  rainContainer.classList.remove('hidden');

  const starIcons = ['⭐', '🌟', '✨'];
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
