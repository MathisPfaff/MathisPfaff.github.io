// ====== CONFIG ======
const USERNAME = "MathisPfaff";
const TOPIC = "portfolio";
const MANUAL_REPOS = []; // e.g. ["my-game", "weather-app"]

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

async function loadProjects() {
  try {
    let repos;
    if (MANUAL_REPOS.length) {
      repos = await Promise.all(
        MANUAL_REPOS.map(name =>
          fetch(`https://api.github.com/repos/${USERNAME}/${name}`).then(r => r.json())
        )
      );
    } else {
      const res = await fetch(`https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=updated`);
      const all = await res.json();
      repos = all.filter(r => !r.fork && r.topics && r.topics.includes(TOPIC));
    }

    // Add repos owned by someone else (classroom/organization)
    const others = await Promise.all(
      EXTRA_REPOS.map(fullName =>
        fetch(`https://api.github.com/repos/${fullName}`).then(r => r.json()).catch(() => null)
      )
    );
    repos = repos.concat(others);

    // Drop failed lookups (e.g. 404 or private repos) and duplicates
    const seen = new Set();
    repos = repos.filter(r => {
      if (!r || !r.html_url || seen.has(r.html_url)) return false;
      seen.add(r.html_url);
      return true;
    });

    if (!repos.length) {
      grid.textContent = "No projects yet. Add the topic '" + TOPIC + "' to a repo!";
      return;
    }

    grid.innerHTML = repos.map(renderCard).join("");
    setupCarousels();
  } catch (e) {
    grid.textContent = "Could not load projects.";
  }
}
loadProjects();