// ===============================
// Flashcards Quiz App Logic
// ===============================

// Starter Machine Learning deck
const initialDeck = [
    {
      question: "What is supervised learning?",
      answer: "A type of machine learning that learns from labeled data to map inputs to outputs."
    },
    {
      question: "What is unsupervised learning?",
      answer: "Learning patterns or structures from unlabeled data without explicit target outputs."
    },
    {
      question: "What is overfitting?",
      answer: "When a model learns noise and details from the training data and performs poorly on unseen data."
    },
    {
      question: "What is underfitting?",
      answer: "When a model is too simple to capture the underlying patterns in the data."
    },
    {
      question: "What is a training set?",
      answer: "A portion of data used to train a machine learning model."
    },
    {
      question: "What is a test set?",
      answer: "A portion of data kept aside to evaluate the performance of a trained model."
    },
    {
      question: "What is a validation set?",
      answer: "Data used for tuning hyperparameters and model selection without touching the test set."
    },
    {
      question: "What is a confusion matrix?",
      answer: "A table layout that visualizes the performance of a classification model with counts of TP, FP, TN, and FN."
    },
    {
      question: "What is regularization in ML?",
      answer: "Techniques (like L1/L2) that add penalty terms to the loss function to reduce overfitting."
    },
    {
      question: "What is gradient descent?",
      answer: "An optimization algorithm that updates parameters in the direction of the negative gradient of the loss."
    }
  ];
  
  // DOM elements
  const cardOuter = document.getElementById("cardOuter");
  const cardInner = document.getElementById("cardInner");
  const cardQuestion = document.getElementById("cardQuestion");
  const cardAnswer = document.getElementById("cardAnswer");
  
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const flipBtn = document.getElementById("flipBtn");
  const knewBtn = document.getElementById("knewBtn");
  const didntBtn = document.getElementById("didntBtn");
  const restartBtn = document.getElementById("restartBtn");
  const shuffleBtn = document.getElementById("shuffleBtn");
  const themeToggle = document.getElementById("themeToggle");
  
  const correctCountEl = document.getElementById("correctCount");
  const incorrectCountEl = document.getElementById("incorrectCount");
  const progressTextEl = document.getElementById("progressText");
  const progressBarEl = document.getElementById("progressBar");
  const lastScoreEl = document.getElementById("lastScore");
  
  const confettiContainer = document.getElementById("confettiContainer");
  const completionOverlay = document.getElementById("completionOverlay");
  const completionStats = document.getElementById("completionStats");
  const completionCloseBtn = document.getElementById("completionCloseBtn");
  
// App state
let deck = [...initialDeck]; // current deck (maybe shuffled)
let currentIndex = 0;
let correctCount = 0;
let incorrectCount = 0;
// Tracks per-card answer state: "correct" | "incorrect" | null
let cardStatus = new Array(initialDeck.length).fill(null);
// True once completion flow has been triggered; used to ignore further input
let hasCompletedDeck = false;
  
  // Keys for localStorage
  const SCORE_KEY = "ml-flashcards-score";
  const THEME_KEY = "ml-flashcards-theme";
  
  // ===============================
  // Initialization
  // ===============================
  
  function init() {
    restoreTheme();
    restoreScore();
    updateCardContent();
    updateScoreUI();
    attachEventListeners();
  }
  
  document.addEventListener("DOMContentLoaded", init);
  
  // ===============================
  // Theme Handling (Light / Dark)
  // ===============================
  
  function restoreTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme === "light") {
      document.body.classList.add("light");
    }
    updateThemeIcon();
  }
  
  function toggleTheme() {
    document.body.classList.toggle("light");
    const mode = document.body.classList.contains("light") ? "light" : "dark";
    localStorage.setItem(THEME_KEY, mode);
    updateThemeIcon();
  }
  
  function updateThemeIcon() {
    const span = themeToggle.querySelector(".theme-icon");
    const isLight = document.body.classList.contains("light");
    span.textContent = isLight ? "☀️" : "🌙";
  }
  
  // ===============================
  // Score Persistence
  // ===============================
  
  function saveScore() {
    const payload = {
      correct: correctCount,
      incorrect: incorrectCount,
      total: deck.length,
      timestamp: Date.now()
    };
    localStorage.setItem(SCORE_KEY, JSON.stringify(payload));
  }
  
  function restoreScore() {
    const raw = localStorage.getItem(SCORE_KEY);
    if (!raw) return;
    try {
      const data = JSON.parse(raw);
      if (typeof data.correct === "number" && typeof data.incorrect === "number") {
        lastScoreEl.textContent = `Last session: ${data.correct}/${data.total} correct (${data.incorrect} incorrect)`;
      }
    } catch {
      // Ignore parsing errors
    }
  }
  
  // ===============================
  // Card & Score UI Updates
  // ===============================
  
  function updateCardContent() {
    const current = deck[currentIndex];
    cardQuestion.textContent = current.question;
    cardAnswer.textContent = current.answer;
    // Always show front when changing card
    setFlipped(false);
    updateProgressUI();
    updateNavButtonsState();
  }
  
  function updateScoreUI() {
    correctCountEl.textContent = String(correctCount);
    incorrectCountEl.textContent = String(incorrectCount);
    updateProgressUI();
  }
  
  function updateProgressUI() {
    const currentNumber = currentIndex + 1;
    const total = deck.length;
    progressTextEl.textContent = `${currentNumber} / ${total}`;
    const percentage = (currentNumber / total) * 100;
    progressBarEl.style.width = `${percentage}%`;
  }
  
  function updateNavButtonsState() {
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === deck.length - 1;
  }
  
  // ===============================
  // Card Flip & Navigation
  // ===============================
  
  function setFlipped(state) {
    if (state) {
      cardInner.classList.add("is-flipped");
    } else {
      cardInner.classList.remove("is-flipped");
    }
  }
  
  function toggleFlip() {
    if (hasCompletedDeck) return;
    cardInner.classList.toggle("is-flipped");
  }
  
  /**
   * Navigate to specific card index, with page curl animation.
   * @param {number} newIndex - target index
   * @param {"next" | "prev"} direction - used to choose animation
   */
  function goToIndex(newIndex, direction) {
  if (hasCompletedDeck) return;
    if (newIndex < 0 || newIndex >= deck.length || newIndex === currentIndex) return;
  
    // Trigger page curl animation
    const curlClass = direction === "next" ? "curl-next" : "curl-prev";
    cardOuter.classList.remove("curl-next", "curl-prev");
    // Force reflow to restart animation
    void cardOuter.offsetWidth;
    cardOuter.classList.add(curlClass);
  
    currentIndex = newIndex;
    updateCardContent();
  }
  
  function goNext() {
    if (hasCompletedDeck) return;
    if (currentIndex < deck.length - 1) {
      goToIndex(currentIndex + 1, "next");
    } else if (!hasCompletedDeck) {
      // At the end of the deck: auto-count any skipped cards as "didn't know"
      triggerCompletion();
    }
  }
  
  function goPrev() {
    if (hasCompletedDeck) return;
    if (currentIndex > 0) {
      goToIndex(currentIndex - 1, "prev");
    }
  }
  
  // ===============================
  // Marking Answers
  // ===============================
  
  function markKnewIt() {
    if (hasCompletedDeck) return;
  
    // Prevent double counting on the same card
    if (!cardStatus[currentIndex]) {
      cardStatus[currentIndex] = "correct";
      correctCount++;
    }
  
    updateScoreUI();
  
    const answered = correctCount + incorrectCount;
    if (answered >= deck.length) {
      // All cards explicitly answered
      triggerCompletion();
    } else {
      goNext();
    }
  }
  
  function markDidntKnow() {
    if (hasCompletedDeck) return;
  
    // Prevent double counting on the same card
    if (!cardStatus[currentIndex]) {
      cardStatus[currentIndex] = "incorrect";
      incorrectCount++;
    }
  
    updateScoreUI();
  
    const answered = correctCount + incorrectCount;
    if (answered >= deck.length) {
      triggerCompletion();
    } else {
      goNext();
    }
  }
  
  // ===============================
  // Deck Controls (Restart & Shuffle)
  // ===============================
  
  function restartDeck() {
    currentIndex = 0;
    correctCount = 0;
    incorrectCount = 0;
    hasCompletedDeck = false;
  cardStatus = new Array(deck.length).fill(null);
    updateCardContent();
    updateScoreUI();
  }
  
  function shuffleDeck() {
    // Fisher-Yates shuffle
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    restartDeck();
  }
  
  // ===============================
  // Completion: Confetti + Modal
  // ===============================
  
  function triggerCompletion() {
    if (hasCompletedDeck) return;
  
    // Auto-count any remaining skipped cards as "didn't know"
    const answered = correctCount + incorrectCount;
    const skipped = deck.length - answered;
    if (skipped > 0) {
      incorrectCount += skipped;
      // Mark all previously un-answered indices as incorrect
      cardStatus = cardStatus.map((status) => status || "incorrect");
      updateScoreUI();
    }
  
    hasCompletedDeck = true;
    saveScore();
    restoreScore();
  
    // Launch premium confetti / flowers from both sides with more particles
    spawnFlowerConfetti(90);
    // Show completion popup slightly after animation has played
    const modalDelayMs = 1800; // matches floatUp keyframe duration
    setTimeout(() => {
      showCompletionModal();
    }, modalDelayMs);
  }
  
  function spawnFlowerConfetti(count) {
    const width = window.innerWidth;
    for (let i = 0; i < count; i++) {
      const flower = document.createElement("div");
      flower.className = "flower";
  
      // Create 4 petals & center
      for (let p = 0; p < 4; p++) {
        const petal = document.createElement("div");
        petal.className = "petal";
        flower.appendChild(petal);
      }
      const center = document.createElement("div");
      center.className = "center";
      flower.appendChild(center);
  
      // Emit from left and right bands for a mirrored celebration
      const fromLeftSide = i < count / 2;
      const bandWidth = width * 0.22;
      const startX = fromLeftSide
        ? Math.random() * bandWidth
        : width - bandWidth + Math.random() * bandWidth;
      flower.style.left = `${startX}px`;
  
      // Slight random delay and duration for organic motion
      const delay = (Math.random() * 0.9).toFixed(2);
      const duration = 1.6 + Math.random() * 0.6; // seconds
      flower.style.animationDelay = `${delay}s`;
      flower.style.animationDuration = `${duration}s`;
  
      confettiContainer.appendChild(flower);
  
      // Remove element after animation
      const totalDurationMs = (duration + parseFloat(delay)) * 1000;
      setTimeout(() => {
        if (flower.parentNode === confettiContainer) {
          confettiContainer.removeChild(flower);
        }
      }, totalDurationMs + 200);
    }
  }
  
  function showCompletionModal() {
    const total = deck.length;
    completionStats.textContent = `You answered ${correctCount} correctly and ${incorrectCount} incorrectly out of ${total} cards.`;
    completionOverlay.classList.remove("hidden");
    completionOverlay.setAttribute("aria-hidden", "false");
  }
  
  function closeCompletionModal() {
    completionOverlay.classList.add("hidden");
    completionOverlay.setAttribute("aria-hidden", "true");

  // After completion popup closes, automatically reset deck
  restartDeck();
  }
  
  // ===============================
  // Keyboard Shortcuts
  // ===============================
  
  function handleKeyDown(event) {
    // If completion modal is open, only allow Escape / Enter to close
    const modalVisible = !completionOverlay.classList.contains("hidden");
    if (modalVisible) {
      if (event.key === "Escape" || event.key === "Enter") {
        event.preventDefault();
        closeCompletionModal();
      }
      return;
    }
  
    // When deck is completed, ignore shortcuts until modal closes
    if (hasCompletedDeck) return;
  
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        goNext();
        break;
      case "ArrowLeft":
        event.preventDefault();
        goPrev();
        break;
      case " ":
        // Space - flip
        event.preventDefault();
        toggleFlip();
        break;
      case "Enter":
        // Enter - mark knew it
        event.preventDefault();
        markKnewIt();
        break;
      default:
        break;
    }
  }
  
  // ===============================
  // Event Listeners
  // ===============================
  
  function attachEventListeners() {
    prevBtn.addEventListener("click", goPrev);
    nextBtn.addEventListener("click", goNext);
    flipBtn.addEventListener("click", toggleFlip);
    knewBtn.addEventListener("click", markKnewIt);
    didntBtn.addEventListener("click", markDidntKnow);
    restartBtn.addEventListener("click", restartDeck);
    shuffleBtn.addEventListener("click", shuffleDeck);
    themeToggle.addEventListener("click", toggleTheme);

    completionCloseBtn.addEventListener("click", closeCompletionModal);
    completionOverlay.addEventListener("click", (e) => {
      if (e.target === completionOverlay) {
        closeCompletionModal();
      }
    });

    // Add click/tap event to card for flip functionality
    cardOuter.addEventListener("click", (e) => {
      // Don't flip if clicking on buttons or other interactive elements
      if (e.target.closest("button")) return;
      toggleFlip();
    });
    // Also support touch events for mobile
    cardOuter.addEventListener("touchend", (e) => {
      if (e.target.closest("button")) return;
      e.preventDefault();
      toggleFlip();
    });

    document.addEventListener("keydown", handleKeyDown);
  }