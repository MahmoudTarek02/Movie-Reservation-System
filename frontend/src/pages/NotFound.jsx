import { Link } from 'react-router-dom';
import './ContentPages.css';

const NotFound = () => {
  return (
    <main className="page page--center">
      <section className="content-panel">
        <h1>Page not found</h1>
        <p>The page you are looking for does not exist.</p>
        <Link to="/movies">Go to movies</Link>
      </section>
    </main>
  );
};

export default NotFound;
