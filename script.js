// Clé API TMDB configurée
const API_KEY = '6a8fb5d70b5b9122fc526ac1333fd789';

const BASE_URL = 'https://api.themoviedb.org/3';
const IMG_URL = 'https://image.tmdb.org/t/p/w500';
const HERO_IMG_URL = 'https://image.tmdb.org/t/p/original';

// Serveurs vidéo de secours (Embeds stables en HTTPS)
const PLAYERS = [
  { name: 'Lecteur 1 (Principal)', url: 'https://vidsrc.xyz/embed/movie/' },
  { name: 'Lecteur 2 (Rapide)', url: 'https://vidsrc.me/embed/movie?tmdb=' },
  { name: 'Lecteur 3 (Multi-langues)', url: 'https://www.2embed.cc/embed/' },
  { name: 'Lecteur 4 (Secours)', url: 'https://vidsrc.to/embed/movie/' }
];

let activeMovieId = null;
let selectedServerIndex = 0;

const movieGrid = document.getElementById('movie-grid');
const searchInput = document.getElementById('search-input');
const videoModal = document.getElementById('video-modal');
const videoPlayer = document.getElementById('video-player');
const closeModal = document.getElementById('close-modal');

// Initialisation avec chargement étendu
async function init() {
  // Récupérer un large catalogue (Populaires + Tendances)
  const popularMovies = await fetchMovies('/movie/popular');
  const trendingMovies = await fetchMovies('/trending/movie/week');
  
  // Fusionner pour éviter les doublons
  const allMovies = [...popularMovies, ...trendingMovies];
  const uniqueMovies = Array.from(new Set(allMovies.map(a => a.id)))
    .map(id => allMovies.find(a => a.id === id));

  if (uniqueMovies.length > 0) {
    // Sélection d'un grand film pour le Hero
    const heroMovie = uniqueMovies[Math.floor(Math.random() * 5)];
    setupHero(heroMovie);
    displayMovies(uniqueMovies);
  }
}

// Récupérer les données via TMDB API
async function fetchMovies(endpoint) {
  try {
    const res = await fetch(`${BASE_URL}${endpoint}?api_key=${API_KEY}&language=fr-FR&page=1`);
    const data = await res.json();
    return data.results || [];
  } catch (error) {
    console.error("Erreur lors de la récupération des films:", error);
    return [];
  }
}

// Configurer la bannière principale
function setupHero(movie) {
  const hero = document.getElementById('hero');
  document.getElementById('hero-title').textContent = movie.title || movie.original_title;
  document.getElementById('hero-overview').textContent = movie.overview || "Aucun synopsis disponible.";
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
          <i class="fa-solid fa-star"></i> ${(movie.vote_average || 0).toFixed(1)}
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

// Ouvrir le lecteur vidéo avec barre de choix du serveur
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

// Changer de lecteur de vidéo si le premier ne fonctionne pas
function changeServer(index) {
  selectedServerIndex = index;
  loadStream();
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
