import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';
import Footer from '../../components/Footer'; // <--- 1. Import Footer

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check Login Status
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // 2. Fetch Groups for this User
    fetchGroups(parsedUser.id);
  }, [navigate]);

  const fetchGroups = async (userId) => {
    try {
      const response = await api.get(`/groups/user/${userId}`);
      if (response.data.success) {
        setGroups(response.data.data);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load groups");
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-5">Loading Dashboard...</div>;

  return (
    // Wrap in a flex column to push footer down if content is short
    <div className="d-flex flex-column min-vh-100"> 
      <div className="container flex-grow-1">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center mb-4 p-3 bg-white shadow-sm rounded">
          <h2 className="mb-0 text-primary">Welcome, {user?.name}! 👋</h2>
          <Link to="/groups/create" className="btn btn-success">
            <i className="bi bi-plus-lg"></i> Create Group
          </Link>
        </div>

        {/* Groups Grid */}
        {groups.length === 0 ? (
          <div className="text-center p-5 bg-light rounded border border-dashed">
            <h3 className="text-muted mb-3">You don't have any groups yet.</h3>
            <p>Start splitting expenses by creating a group for a trip, lunch, or rent!</p>
            <Link to="/groups/create" className="btn btn-primary mt-2">Create Your First Group</Link>
          </div>
        ) : (
          <div className="row">
            {groups.map((group) => (
              <div key={group.id} className="col-md-4 mb-4">
                <div className="card shadow-sm h-100 border-0 hover-shadow">
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title fw-bold text-dark">{group.name}</h5>
                    <p className="card-text text-muted flex-grow-1">
                      {group.description || ''}
                    </p>
                    
                    <div className="mt-3 border-top pt-3">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                          <small className="text-muted">
                              <i className="bi bi-people-fill me-1"></i> 
                              {group.members.length} Members
                          </small>
                          <small className="text-muted">
                              {new Date(group.createdAt).toLocaleDateString()}
                          </small>
                      </div>
                      <Link to={`/groups/${group.id}`} className="btn btn-outline-primary w-100">
                        View Expenses
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Add Footer Here */}
      <Footer />
    </div>
  );
};

export default Dashboard;