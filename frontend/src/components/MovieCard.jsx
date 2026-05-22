import { Link } from 'react-router-dom';
import './MovieCard.css';

const MovieCard = ({ movie }) => {
  return (
    <article className="movie-card">
      <div className="movie-card__poster" aria-hidden="true">
        {movie.title.slice(0, 1)}
      </div>
      <div className="movie-card__body">
        <h3>{movie.title}</h3>
        <p>{movie.description}</p>
        <Link to={`/movies/${movie.id}`}>View details</Link>
      </div>
    </article>
  );
};

export default MovieCard;
