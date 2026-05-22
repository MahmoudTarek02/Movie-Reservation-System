import { Link, useParams } from 'react-router-dom';
import './ContentPages.css';

const MovieDetails = () => {
  const { movieId } = useParams();

  return (
    <main className="page">
      <div className="page__header">
        <h1>Movie Details</h1>
        <p>Movie ID: {movieId}</p>
      </div>
      <section className="content-panel">
        <h2>Reservation flow placeholder</h2>
        <p>The protected route and authentication state are ready. Connect this page to the movie and reservation services when they exist behind the gateway.</p>
        <Link to="/movies">Back to movies</Link>
      </section>
    </main>
  );
};

export default MovieDetails;
