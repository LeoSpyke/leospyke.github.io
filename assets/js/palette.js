const paletteButtons = document.querySelectorAll("[data-palette-choice]");
const paletteWidget = document.querySelector(".palette-widget");
const paletteToggle = document.querySelector(".palette-toggle");
const numberReveal = document.querySelector(".number-reveal");
const digitCloud = document.querySelector(".digit-cloud");
const digitContext = digitCloud.getContext("2d");
let animationTimer;
let pointerInside = false;
let frameRequest = null;
let lastDigitUpdate = 0;
let lastX = -200;
let lastY = -200;
const numberCount = 1200;
const paletteAccents = {
  green: "#b7f28b",
  amber: "#f2b84b",
  cyan: "#6de4e8",
};
const numbers = Array.from({ length: numberCount }, () => ({
  value: Math.floor(Math.random() * 10),
  alpha: 0.13 + Math.random() * 0.16,
}));

function animatePaletteToggle() {
  paletteToggle.classList.remove("is-changing");
  void paletteToggle.offsetWidth;
  paletteToggle.classList.add("is-changing");
  window.clearTimeout(animationTimer);
  animationTimer = window.setTimeout(() => paletteToggle.classList.remove("is-changing"), 450);
}

paletteToggle.addEventListener("click", () => {
  const isOpen = paletteWidget.classList.toggle("is-open");
  paletteToggle.setAttribute("aria-expanded", String(isOpen));
  document.querySelector(".palette-menu").setAttribute("aria-hidden", String(!isOpen));
  animatePaletteToggle();
});

function setPalette(palette, persist = true) {
  document.documentElement.dataset.theme = palette;
  paletteButtons.forEach((button) => {
    button.setAttribute("aria-pressed", String(button.dataset.paletteChoice === palette));
  });

  if (persist) {
    try {
      localStorage.setItem("leospyke-palette", palette);
    } catch (_) {}
  }

  if (pointerInside) scheduleDigitFrame();
}

paletteButtons.forEach((button) => {
  button.addEventListener("click", () => {
    setPalette(button.dataset.paletteChoice);
    paletteWidget.classList.remove("is-open");
    paletteToggle.setAttribute("aria-expanded", "false");
    document.querySelector(".palette-menu").setAttribute("aria-hidden", "true");
    animatePaletteToggle();
    paletteToggle.focus();
  });
});

document.addEventListener("click", (event) => {
  if (!paletteWidget.contains(event.target)) {
    paletteWidget.classList.remove("is-open");
    paletteToggle.setAttribute("aria-expanded", "false");
    document.querySelector(".palette-menu").setAttribute("aria-hidden", "true");
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && paletteWidget.classList.contains("is-open")) {
    paletteWidget.classList.remove("is-open");
    paletteToggle.setAttribute("aria-expanded", "false");
    document.querySelector(".palette-menu").setAttribute("aria-hidden", "true");
    paletteToggle.focus();
  }
});

setPalette(document.documentElement.dataset.theme || "green", false);

function resizeDigitCloud() {
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  digitCloud.width = Math.round(window.innerWidth * ratio);
  digitCloud.height = Math.round(window.innerHeight * ratio);
  digitContext.setTransform(ratio, 0, 0, ratio, 0, 0);
  scheduleDigitFrame();
}

function scheduleDigitFrame() {
  if (frameRequest === null) frameRequest = window.requestAnimationFrame(drawDigits);
}

function drawDigits(timestamp) {
  frameRequest = null;
  if (!pointerInside) return;

  const width = window.innerWidth;
  const height = window.innerHeight;
  const columns = Math.ceil(width / 14);
  const rows = Math.ceil(height / 15);
  const cellWidth = width / columns;
  const cellHeight = height / rows;
  const radius = 90;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  digitContext.clearRect(0, 0, width, height);
  digitContext.fillStyle = paletteAccents[document.documentElement.dataset.theme] || paletteAccents.green;
  digitContext.font = '500 10px "Bodoni Moda", "Times New Roman", serif';
  digitContext.textAlign = "center";
  digitContext.textBaseline = "middle";

  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const x = (column + 0.5) * cellWidth;
      const y = (row + 0.5) * cellHeight;
      const distance = Math.hypot(x - lastX, y - lastY);
      if (distance > radius) continue;

      const distanceFade = 1 - distance / radius;
      const index = (row * columns + column) % numberCount;
      if (!reducedMotion && timestamp - lastDigitUpdate > 100 && Math.random() > 0.9) numbers[index].value = Math.floor(Math.random() * 10);
      digitContext.globalAlpha = numbers[index].alpha * distanceFade * distanceFade;
      digitContext.fillText(String(numbers[index].value), x, y);
    }
  }

  digitContext.globalAlpha = 1;
  if (timestamp - lastDigitUpdate > 100) lastDigitUpdate = timestamp;
  if (!reducedMotion) frameRequest = window.requestAnimationFrame(drawDigits);
}

function updateLens(event) {
  const element = event.target instanceof Element ? event.target : event.target.parentElement;
  const interactiveTarget = element && element.closest("a, button, input, select, textarea, .panel, .site-header, .site-footer, .window-top, h1, h2, p, .eyebrow");
  const backgroundTarget = event.pointerType !== "touch" && !interactiveTarget;

  if (!backgroundTarget) {
    pointerInside = false;
    numberReveal.classList.remove("is-active");
    window.cancelAnimationFrame(frameRequest);
    frameRequest = null;
    return;
  }

  pointerInside = true;
  lastX = event.clientX;
  lastY = event.clientY;
  numberReveal.style.setProperty("--lens-x", `${lastX}px`);
  numberReveal.style.setProperty("--lens-y", `${lastY}px`);
  numberReveal.classList.add("is-active");
  scheduleDigitFrame();
}

resizeDigitCloud();
document.addEventListener("pointermove", updateLens, { passive: true });
document.addEventListener("pointerleave", () => {
  pointerInside = false;
  numberReveal.classList.remove("is-active");
  window.cancelAnimationFrame(frameRequest);
  frameRequest = null;
});
document.addEventListener("pointerout", (event) => {
  if (event.relatedTarget === null || (event.target instanceof Element && event.target.matches("body, html"))) {
    pointerInside = false;
    numberReveal.classList.remove("is-active");
    window.cancelAnimationFrame(frameRequest);
    frameRequest = null;
  }
});
window.addEventListener("resize", resizeDigitCloud);
window.addEventListener("blur", () => {
  pointerInside = false;
  numberReveal.classList.remove("is-active");
  window.cancelAnimationFrame(frameRequest);
  frameRequest = null;
});
