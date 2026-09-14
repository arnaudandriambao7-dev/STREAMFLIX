const API_KEY = '6a8fb5d70b5b9122fc526ac1333fd789';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const HERO_IMG_URL = 'https://image.tmdb.org/t/p/original';

// Lecteurs vidéo optimisés pour le contenu multilingue / VF
const PLAYERS = {
 movie: [
    { name: 'Lecteur 1 (VF / STFR)', url: 'https://vidsrc.me/embed/movie?tmdb=' },
    { name: 'Lecteur 2 (AutoEmbed + STFR)', url: 'https://player.autoembed.cc/embed/movie/' },
    { name: 'Lecteur 3 (VidSrc SBS + STFR)', url: 'https://vidsrc.sbs/embed/movie/' }
  ],
  tv: [
    { name: 'Lecteur 1 (VF / STFR)', url: (id, s, e) => `https://vidsrc.me/embed/tv?tmdb=${id}&season=${s}&episode=${e}&sub=fr` },
    { name: 'Lecteur 2 (AutoEmbed + STFR)', url: (id, s, e) => `https://player.autoembed.cc/embed/tv/${id}/${s}/${e}` },
    { name: 'Lecteur 3 (VidSrc SBS + STFR)', url: (id, s, e) => `https://vidsrc.sbs/embed/tv/${id}/${s}/${e}?sub=fr` }
  ]
};

let currentMediaType = 'movie'; 
let activeMediaId = null;
let selectedServerIndex = 0;
let currentSeason = 1;
let currentEpisode = 1;

const searchInput = document.getElementById('search-input');
const genreSelect = document.getElementById('genre-select');
const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const closeModal = document.getElementById('close-modal');
const categoriesContainer = document.getElementById('categories-container');
const tvControls = document.getElementById('tv-controls');
const seasonSelect = document.getElementById('season-select');
const episodeSelect = document.getElementById('episode-select');

// Initialisation
async function init() {
  const endpoint = currentMediaType === 'movie' ? '/trending/movie/week' : '/trending/tv/week';
  const trending = await fetchMovies(endpoint);
  
  if (trending && trending.length > 0) {
    setupHero(trending[0]);
  }
  
  await populateGenreDropdown();
  loadAllCategories();
}

// Basculer entre Films et Séries
function switchMediaType(type) {
  currentMediaType = type;
  
  document.getElementById('btn-movies').style.color = type === 'movie' ? '#fff' : '#aaa';
  document.getElementById('btn-movies').style.borderBottom = type === 'movie' ? '2px solid #e50914' : 'none';
  
  document.getElementById('btn-series').style.color = type === 'tv' ? '#fff' : '#aaa';
  document.getElementById('btn-series').style.borderBottom = type === 'tv' ? '2px solid #e50914' : 'none';

  if (genreSelect) genreSelect.value = 'all';
  if (searchInput) searchInput.value = '';

  init();
}

// Requêtes TMDB forcées en Français (fr-FR) avec fallback région (FR)
async function fetchMovies(endpoint, extraParams = '') {
  try {
    const connector = endpoint.includes('?') ? '&' : '?';
    const res = await fetch(`${BASE_URL}${endpoint}${connector}api_key=${API_KEY}&language=fr-FR&region=FR${extraParams}`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Erreur API:", error);
    return [];
  }
}

// Remplir le menu des genres en français
async function populateGenreDropdown() {
  if (!genreSelect) return;
  try {
    const genreEndpoint = `/genre/${currentMediaType}/list`;
    const res = await fetch(`${BASE_URL}${genreEndpoint}?api_key=${API_KEY}&language=fr-FR`);
    const data = await res.json();
    const genres = data.genres || [];

    genreSelect.innerHTML = '<option value="all">Tous les genres</option>';
    genres.forEach(genre => {
      const option = document.createElement('option');
      option.value = genre.id;
      option.textContent = genre.name;
      genreSelect.appendChild(option);
    });
  } catch (error) {
    console.error("Erreur chargement genres:", error);
  }
}

// Filtrage par genre
async function filterByGenre() {
  const selectedGenreId = genreSelect.value;
  
  if (selectedGenreId === 'all') {
    loadAllCategories();
    return;
  }

  if (categoriesContainer) categoriesContainer.innerHTML = '<p style="color: #aaa; text-align: center; margin-top: 50px;">Chargement...</p>';
  
  const selectedGenreName = genreSelect.options[genreSelect.selectedIndex].text;
  const mediaList = await fetchMovies(`/discover/${currentMediaType}`, `&with_genres=${selectedGenreId}`);
  
  if (categoriesContainer) categoriesContainer.innerHTML = '';
  if (mediaList && mediaList.length > 0) {
    renderCategorySection(`Genre : ${selectedGenreName}`, mediaList);
  } else {
    categoriesContainer.innerHTML = '<p style="color: #aaa; text-align: center; margin-top: 50px;">Aucun titre trouvé.</p>';
  }
}

// Charger tous les genres sur la page principale
async function loadAllCategories() {
  try {
    const genreEndpoint = `/genre/${currentMediaType}/list`;
    const res = await fetch(`${BASE_URL}${genreEndpoint}?api_key=${API_KEY}&language=fr-FR`);
    const data = await res.json();
    const genres = data.genres || [];

    if (categoriesContainer) categoriesContainer.innerHTML = '';

    for (const genre of genres) {
      const mediaList = await fetchMovies(`/discover/${currentMediaType}`, `&with_genres=${genre.id}`);
      if (mediaList && mediaList.length > 0) {
        renderCategorySection(genre.name, mediaList);
      }
    }
  } catch (error) {
    console.error("Erreur chargement catégories:", error);
  }
}

// Générer une section
function renderCategorySection(title, items) {
  const section = document.createElement('section');
  section.style.marginBottom = '40px';

  const categoryTitle = document.createElement('h2');
  categoryTitle.classList.add('section-title');
  categoryTitle.textContent = title;

  const grid = document.createElement('div');
  grid.classList.add('movie-grid');

  items.forEach(item => {
    if (!item.poster_path) return;

    const displayTitle = item.title || item.name;
    const card = document.createElement('div');
    card.classList.add('movie-card');
    card.innerHTML = `
      <img src="${IMG_URL + item.poster_path}" alt="${displayTitle}">
      <div class="movie-info">
        <h3>${displayTitle}</h3>
        <div class="movie-rating">
          <i class="fa-solid fa-star"></i> ${(item.vote_average || 0).toFixed(1)}
        </div>
      </div>
    `;
    card.onclick = () => openPlayer(item.id);
    grid.appendChild(card);
  });

  section.appendChild(categoryTitle);
  section.appendChild(grid);
  if (categoriesContainer) categoriesContainer.appendChild(section);
}

// Configurer Hero Banner en Français
function setupHero(item) {
  const hero = document.getElementById('hero');
  if (!hero) return;

  document.getElementById('hero-title').textContent = item.title || item.name;
  document.getElementById('hero-overview').textContent = item.overview || "Aucun synopsis disponible en français.";
  if (item.backdrop_path) {
    hero.style.backgroundImage = `url('${HERO_IMG_URL + item.backdrop_path}')`;
  }
  document.getElementById('hero-play-btn').onclick = () => openPlayer(item.id);
}

// Recherche
if (searchInput) {
  searchInput.addEventListener('input', async (e) => {
    const query = e.target.value.trim();
    if (query.length > 2) {
      const searchResults = await fetchMovies(`/search/${currentMediaType}`, `&query=${encodeURIComponent(query)}`);
      if (categoriesContainer) {
        categoriesContainer.innerHTML = '';
        renderCategorySection(`Résultats pour "${query}"`, searchResults);
      }
    } else if (query === '') {
      init();
    }
  });
}

// Modal & Lecteur
async function openPlayer(mediaId) {
  activeMediaId = mediaId;
  selectedServerIndex = 0;
  currentSeason = 1;
  currentEpisode = 1;

  if (currentMediaType === 'tv') {
    tvControls.style.display = 'block';
    await setupTvSeasons(mediaId);
  } else {
    tvControls.style.display = 'none';
  }

  loadStream();
  if (videoModal) videoModal.style.display = 'flex';
}

// Gestion Séries
async function setupTvSeasons(seriesId) {
  try {
    const res = await fetch(`${BASE_URL}/tv/${seriesId}?api_key=${API_KEY}&language=fr-FR`);
    const data = await res.json();
    
    seasonSelect.innerHTML = '';
    const seasons = data.seasons ? data.seasons.filter(s => s.season_number > 0) : [];

    seasons.forEach(s => {
      const option = document.createElement('option');
      option.value = s.season_number;
      option.textContent = `Saison ${s.season_number} (${s.episode_count} éps)`;
      seasonSelect.appendChild(option);
    });

    currentSeason = seasons.length > 0 ? seasons[0].season_number : 1;
    await updateEpisodeList(seriesId, currentSeason);
  } catch (error) {
    console.error("Erreur séries:", error);
  }
}

async function updateEpisodeList(seriesId, seasonNum) {
  try {
    const res = await fetch(`${BASE_URL}/tv/${seriesId}/season/${seasonNum}?api_key=${API_KEY}&language=fr-FR`);
    const data = await res.json();
    
    episodeSelect.innerHTML = '';
    const episodes = data.episodes || [];

    episodes.forEach(ep => {
      const option = document.createElement('option');
      option.value = ep.episode_number;
      option.textContent = `Épisode ${ep.episode_number} : ${ep.name}`;
      episodeSelect.appendChild(option);
    });

    currentEpisode = 1;
  } catch (error) {
    console.error("Erreur épisodes:", error);
  }
}

async function onSeasonChange() {
  currentSeason = seasonSelect.value;
  await updateEpisodeList(activeMediaId, currentSeason);
  loadStream();
}

function onEpisodeChange() {
  currentEpisode = episodeSelect.value;
  loadStream();
}

function loadStream() {
 if (currentMediaType === 'movie') {
    const server = PLAYERS.movie[selectedServerIndex];
    if (videoPlayer) {
      if (server.url.includes('vidsrc.me')) {
        // Force la langue française et sous-titres FR
        videoPlayer.src = `${server.url}${activeMediaId}&sub=fr&lang=fr`;
      } else if (server.url.includes('vidsrc.sbs')) {
        videoPlayer.src = `${server.url}${activeMediaId}?sub=fr`;
      } else {
        videoPlayer.src = `${server.url}${activeMediaId}`;
      }
    }
  } else {
    const server = PLAYERS.tv[selectedServerIndex];
    if (videoPlayer) videoPlayer.src = server.url(activeMediaId, currentSeason, currentEpisode);
  }
}

function changeServer(index) {
  selectedServerIndex = index;
  loadStream();
}

if (closeModal) {
  closeModal.onclick = () => {
    if (videoModal) videoModal.style.display = 'none';
    if (videoPlayer) videoPlayer.src = '';
  };
}

window.onclick = (e) => {
  if (e.target === videoModal) {
    if (videoModal) videoModal.style.display = 'none';
    if (videoPlayer) videoPlayer.src = '';
  }
};

init();
