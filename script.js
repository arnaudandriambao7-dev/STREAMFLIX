// Clé API TMDB configurée
const API_KEY = '6a8fb5d70b5b9122fc526ac1333fd789';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const HERO_IMG_URL = 'https://image.tmdb.org/t/p/original';

// Serveurs vidéo de secours
const PLAYERS = [
  { name: 'Lecteur 1', url: 'https://vidsrc.xyz/embed/movie/' },
  { name: 'Lecteur 2', url: 'https://vidsrc.me/embed/movie?tmdb=' },
  { name: 'Lecteur 3', url: 'https://www.2embed.cc/embed/' },
  { name: 'Lecteur 4', url: 'https://vidsrc.to/embed/movie/' }
];

let activeMovieId = null;
let selectedServerIndex = 0;

const searchInput = document.getElementById('search-input');
const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const closeModal = document.getElementById('close-modal');
const categoriesContainer = document.getElementById('categories-container');

// Initialisation globale
async function init() {
  // 1. Charger le Hero Banner avec un film tendance
  const trending = await fetchMovies('/trending/movie/week');
  if (trending && trending.length > 0) {
    setupHero(trending[0]);
  }

  // 2. Charger toutes les catégories par genre
  loadAllCategories();
}

// Récupérer les données depuis l'API TMDB
async function fetchMovies(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=fr-FR`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Erreur API:", error);
    return [];
  }
}

// Charger tous les genres et créer une section par catégorie
async function loadAllCategories() {
  try {
    // Récupère la liste complète des genres (Action, Comédie, etc.)
    const res = await fetch(`${BASE_URL}/genre/movie/list?api_key=${API_KEY}&language=fr-FR`);
    const data = await res.json();
    const genres = data.genres;

    categoriesContainer.innerHTML = ''; // Vider le message de chargement

    // Parcourir chaque genre et afficher ses films
    for (const genre of genres) {
      const movies = await fetchMovies(`/discover/movie&with_genres=${genre.id}`);
      
      if (movies.length > 0) {
        renderCategorySection(genre.name, movies);
      }
    }
  } catch (error) {
    console.error("Erreur lors du chargement des catégories:", error);
  }
}

// Afficher une section de catégorie spécifique
function renderCategorySection(title, movies) {
  const section = document.createElement('section');
  section.style.marginBottom = '40px';

  const categoryTitle = document.createElement('h2');
  categoryTitle.classList.add('section-title');
  categoryTitle.textContent = title;

  const grid = document.createElement('div');
  grid.classList.add('movie-grid');

  movies.forEach(movie => {
    if (!movie.poster_path) return;

    const card = document.createElement('div');
    card.classList.add('movie-card');
    card.innerHTML = `
      <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}">
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <div class="movie-rating">
          <i class="fa-solid fa-star"></i> ${(movie.vote_average || 0).toFixed(1)}
        </div>
      </div>
    `;
    card.onclick = () => openPlayer(movie.id);
    grid.appendChild(card);
  });

  section.appendChild(categoryTitle);
  section.appendChild(grid);
  categoriesContainer.appendChild(section);
}

// Configurer la bannière principale
function setupHero(movie) {
  const hero = document.getElementById('hero');
  document.getElementById('hero-title').textContent = movie.title || movie.original_title;
  document.getElementById('hero-overview').textContent = movie.overview || "Aucun synopsis disponible.";
  hero.style.backgroundImage = `url('${HERO_IMG_URL + movie.backdrop_path}')`;
  
  document.getElementById('hero-play-btn').onclick = () => openPlayer(movie.id);
}

// Gestion de la recherche
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  if (query.length > 2) {
    const searchResults = await fetchMovies(`/search/movie&query=${encodeURIComponent(query)}`);
    categoriesContainer.innerHTML = '';
    renderCategorySection(`Résultats pour "${query}"`, searchResults);
  } else if (query === '') {
    init();
  }
});

// Lecteur Vidéo
function openPlayer(movieId) {
  activeMovieId = movieId;
  selectedServerIndex = 0;
  loadStream();
  videoModal.style.display = 'flex';
}

function loadStream() {
  const server = PLAYERS[selectedServerIndex];
  videoPlayer.src = `${server.url}${activeMovieId}`;
}

function changeServer(index) {
  selectedServerIndex = index;
  loadStream();
}

closeModal.onclick = () => {
  videoModal.style.display = 'none';
  videoPlayer.src = '';
};

window.onclick = (e) => {
  if (e.target === videoModal) {
    videoModal.style.display = 'none';
    videoPlayer.src = '';
  }
};

init();
