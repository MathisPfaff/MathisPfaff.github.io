// ====== CONFIG ======
const USERNAME = "MathisPfaff";
const TOPIC = "portfolio";
const MANUAL_REPOS = []; // e.g. ["my-game", "weather-app"]

// Repos from other owners (organizations, classrooms), written as "owner/name".
const EXTRA_REPOS = [
  "DAE-GD-2025-2026/gameai-research-project-MathisPfaff"
];

// Extra info per repo (key = repo name). Both fields are optional.
// Image paths are relative to your site, e.g. files in an "images" folder.
const EXTRAS = {
  "gameai-research-project-MathisPfaff": {
    images: ["images/gameai-1.png", "images/gameai-2.png"]
  }
};
const AUTO_SLIDE_MS = 3000; // set to 0 to disable auto-advance
// ====================

const grid = document.getElementById("project-grid");

function renderImages(images, name) {
  if (!images || !images.length) return "";
  const slides = images.map((src, i) =>
    `<img src="${src}" alt="${name} screenshot ${i + 1}" class="slide${i === 0 ? " active" : ""}">`
  ).join("");
  const buttons = images.length > 1
    ? `<button class="carousel-btn prev" aria-label="Previous image">&#10094;</button>
       <button class="carousel-btn next" aria-label="Next image">&#10095;</button>`
    : "";
  return `<div class="carousel">${slides}${buttons}</div>`;
}

function renderCard(r) {
  const extra = EXTRAS[r.name] || {};
  const link = extra.link || r.homepage;
  return `
      <div class="card">
        ${renderImages(extra.images, r.name)}
        <h3><a href="${r.html_url}" target="_blank">${r.name}</a></h3>
        <p>${r.description || "No description yet."}</p>
        <p class="meta">${r.language || ""} ⭐ ${r.stargazers_count}
          ${link ? ` • <a href="${link}" target="_blank">Live demo</a>` : ""}
        </p>
      </div>`;
}

function showSlide(carousel, direction) {
  const slides = [...carousel.querySelectorAll(".slide")];
  const current = slides.findIndex(s => s.classList.contains("active"));
  slides[current].classList.remove("active");
  slides[(current + direction + slides.length) % slides.length].classList.add("active");
}

function setupCarousels() {
  document.querySelectorAll(".carousel").forEach(carousel => {
    if (carousel.querySelectorAll(".slide").length < 2) return;
    carousel.querySelector(".prev").addEventListener("click", () => showSlide(carousel, -1));
    carousel.querySelector(".next").addEventListener("click", () => showSlide(carousel, 1));
    if (AUTO_SLIDE_MS > 0) {
      let timer = setInterval(() => showSlide(carousel, 1), AUTO_SLIDE_MS);
      carousel.addEventListener("mouseenter", () => clearInterval(timer));
      carousel.addEventListener("mouseleave", () => {
        timer = setInterval(() => showSlide(carousel, 1), AUTO_SLIDE_MS);
      });
    }
  });
}

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

async function loadProjects() {
  const errors = [];
  let repos = [];

  // Your own repos
  try {
    if (MANUAL_REPOS.length) {
      repos = await Promise.all(
        MANUAL_REPOS.map(name => fetchJson(`https://api.github.com/repos/${USERNAME}/${name}`))
      );
    } else {
      const all = await fetchJson(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`);
      repos = all.filter(r => !r.fork && r.topics && r.topics.includes(TOPIC));
    }
  } catch (e) {
    console.error(e);
    errors.push(e.message);
  }

  // Classroom/organization repos
  const others = await Promise.all(
    EXTRA_REPOS.map(fullName =>
      fetchJson(`https://api.github.com/repos/${fullName}`).catch(e => {
        console.error(e);
        errors.push(e.message);
        return null;
      })
    )
  );
  repos = repos.concat(others);

  // Drop failed lookups and duplicates
  const seen = new Set();
  repos = repos.filter(r => {
    if (!r || !r.html_url || seen.has(r.html_url)) return false;
    seen.add(r.html_url);
    return true;
  });

  if (!repos.length) {
    grid.textContent = errors.length
      ? "Could not load projects: " + errors.join(" | ")
      : "No projects yet. Add the topic '" + TOPIC + "' to a repo!";
    return;
  }

  grid.innerHTML = repos.map(renderCard).join("");
  setupCarousels();
}
loadProjects();