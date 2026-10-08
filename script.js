// ====== CONFIG ======
const USERNAME = "MathisPfaff";

// Option A (automatic): show repos tagged with this topic.
// Add the topic "portfolio" to a repo and it appears on your page.
const TOPIC = "portfolio";

// Option B (manual): list repo names here. If not empty, this is used instead of topics.
const MANUAL_REPOS = []; // e.g. ["my-game", "weather-app"]
// ====================

const grid = document.getElementById("project-grid");

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

    if (!repos.length) {
      grid.textContent = "No projects yet. Add the topic '" + TOPIC + "' to a repo!";
      return;
    }

    grid.innerHTML = repos.map(r => `
      <div class="card">
        <h3><a href="${r.html_url}" target="_blank">${r.name}</a></h3>
        <p>${r.description || "No description yet."}</p>
        <p class="meta">${r.language || ""} ⭐ ${r.stargazers_count}
          ${r.homepage ? ` • <a href="${r.homepage}" target="_blank">Live demo</a>` : ""}
        </p>
      </div>`).join("");
  } catch (e) {
    grid.textContent = "Could not load projects.";
  }
}
loadProjects();