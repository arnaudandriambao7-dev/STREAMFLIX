// Clé API TMDB configurée
const API_KEY = '6a8fb5d70b5b9122fc526ac1333fd789';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const HERO_IMG_URL = 'https://image.tmdb.org/t/p/original';

// URL pour les serveurs de lecteur vidéo tierce (Embed)
const EMBED_URL = 'https://vidsrc.to/embed/movie/';

const movieGrid = document.getElementById('movie-grid');
const searchInput = document.getElementById('search-input');
const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const closeModal = document.getElementById('close-modal');

// Initialisation
async function init() {
  const movies = await fetchMovies('/trending/movie/week');
  if (movies && movies.length > 0) {
    setupHero(movies[0]);
    displayMovies(movies);
  }
}

// Récupérer les données via TMDB API
async function fetchMovies(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=fr-FR`);
    const data = await res.json();
    return data.results;
  } catch (error) {
    console.error("Erreur lors de la récupération des films:", error);
  }
}

// Configurer la bannière principale
function setupHero(movie) {
  const hero = document.getElementById('hero');
  document.getElementById('hero-title').textContent = movie.title;
  document.getElementById('hero-overview').textContent = movie.overview;
  hero.style.backgroundImage = `url('${HERO_IMG_URL + movie.backdrop_path}')`;
  
  document.getElementById('hero-play-btn').onclick = () => openPlayer(movie.id);
}

// Afficher la grille de films
function displayMovies(movies) {
  movieGrid.innerHTML = '';
  movies.forEach(movie => {
    if (!movie.poster_path) return;
    
    const card = document.createElement('div');
    card.classList.add('movie-card');
    card.innerHTML = `
      <img src="${IMG_URL + movie.poster_path}" alt="${movie.title}">
      <div class="movie-info">
        <h3>${movie.title}</h3>
        <div class="movie-rating">
          <i class="fa-solid fa-star"></i> ${movie.vote_average.toFixed(1)}
        </div>
      </div>
    `;
    card.onclick = () => openPlayer(movie.id);
    movieGrid.appendChild(card);
  });
}

// Gestion de la recherche dynamique
searchInput.addEventListener('input', async (e) => {
  const query = e.target.value.trim();
  if (query.length > 2) {
    const searchResults = await fetchMovies(`/search/movie?query=${encodeURIComponent(query)}`);
    displayMovies(searchResults);
  } else if (query === '') {
    init();
  }
});

// Ouvrir le lecteur vidéo
function openPlayer(movieId) {
  videoPlayer.src = `${EMBED_URL}${movieId}`;
  videoModal.style.display = 'flex';
}

// Fermer le lecteur vidéo
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