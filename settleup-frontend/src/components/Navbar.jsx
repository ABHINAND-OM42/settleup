// ... existing imports
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  // We parse the user to get the name
  const userString = localStorage.getItem('user');
  const user = userString ? JSON.parse(userString) : null;

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login'; // Full refresh to clear state
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm">
      <div className="container">
        <Link className="navbar-brand fw-bold" to="/dashboard">
            <i className="bi bi-wallet2 me-2"></i>SettleUp
        </Link>
        
        <div className="ms-auto">
          {user ? (
            <div className="d-flex align-items-center gap-3">
               {/* New Account Link */}
              <Link to="/settings" className="text-white text-decoration-none d-flex align-items-center">
                  <i className="bi bi-person-circle me-1"></i> 
                  <span className="d-none d-md-inline">{user.name}</span>
              </Link>
              
              <Link className="btn btn-light btn-sm text-primary fw-bold" to="/groups/create">
                + New Group
              </Link>
              
              <button onClick={handleLogout} className="btn btn-danger btn-sm">
                Logout
              </button>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Link className="btn btn-outline-light btn-sm" to="/login">Login</Link>
              <Link className="btn btn-light btn-sm text-primary" to="/register">Register</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;