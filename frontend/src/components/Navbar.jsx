import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar__brand">
        Movie Reservation
      </Link>

      <nav className="navbar__links" aria-label="Primary navigation">
        {isAuthenticated ? (
          <>
            <NavLink to="/movies">Movies</NavLink>
            <NavLink to="/my-reservations">My Reservations</NavLink>
            <span className="navbar__user">{user?.email}</span>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <>
            <NavLink to="/login">Login</NavLink>
            <NavLink to="/register">Register</NavLink>
          </>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
