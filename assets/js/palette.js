const paletteButtons = document.querySelectorAll("[data-palette-choice]");
const paletteWidget = document.querySelector(".palette-widget");
const paletteToggle = document.querySelector(".palette-toggle");
const numberReveal = document.querySelector(".number-reveal");
const digitCloud = document.querySelector(".digit-cloud");
let animationTimer;
let revealTimer;
let digitTimer;

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

function closeNumberReveal() {
  if (numberReveal.hidden) return;
  numberReveal.classList.remove("is-open");
  numberReveal.classList.add("is-closing");
  window.clearTimeout(revealTimer);
  window.clearInterval(digitTimer);
  revealTimer = window.setTimeout(() => {
    numberReveal.hidden = true;
    numberReveal.classList.remove("is-closing");
  }, 850);
}

document.addEventListener("click", (event) => {
  if (event.target !== document.body && event.target !== document.documentElement) return;

  if (!numberReveal.hidden) {
    closeNumberReveal();
    return;
  }

  const x = (event.clientX / window.innerWidth) * 100;
  const y = (event.clientY / window.innerHeight) * 100;
  numberReveal.style.setProperty("--reveal-x", `${x}%`);
  numberReveal.style.setProperty("--reveal-y", `${y}%`);
  digitCloud.replaceChildren();

  for (let index = 0; index < 84; index += 1) {
    const digit = document.createElement("span");
    digit.textContent = String(Math.floor(Math.random() * 10));
    digit.style.setProperty("--drift", `${3 + Math.random() * 6}s`);
    digit.style.animationDelay = `${Math.random() * -6}s`;
    digitCloud.append(digit);
  }

  numberReveal.hidden = false;
  numberReveal.classList.remove("is-closing", "is-open");
  void numberReveal.offsetWidth;
  numberReveal.classList.add("is-open");
  digitTimer = window.setInterval(() => {
    const digits = digitCloud.children;
    for (let change = 0; change < 4; change += 1) {
      const digit = digits[Math.floor(Math.random() * digits.length)];
      digit.textContent = String(Math.floor(Math.random() * 10));
    }
  }, 120);
  window.clearTimeout(revealTimer);
  revealTimer = window.setTimeout(closeNumberReveal, 6500);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeNumberReveal();
});
