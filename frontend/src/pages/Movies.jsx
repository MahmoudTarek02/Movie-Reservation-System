import MovieCard from '../components/MovieCard';
import './ContentPages.css';

const movies = [
  {
    id: 'coming-soon',
    title: 'Movies Service Coming Soon',
    description: 'Authentication is connected. Movie catalog data can be wired here when the movies service is added.'
  }
];

const Movies = () => {
  return (
    <main className="page">
      <div className="page__header">
        <h1>Movies</h1>
        <p>Browse available movies and continue to details when the catalog service is connected.</p>
      </div>
      <div className="movie-grid">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} />
        ))}
      </div>
    </main>
  );
};

export default Movies;
