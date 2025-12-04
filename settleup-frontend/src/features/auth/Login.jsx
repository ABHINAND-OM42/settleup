import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';
import Footer from '../../components/Footer';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/users/login', formData);

      if (response.data.success) {
        localStorage.setItem('user', JSON.stringify(response.data.data));
        toast.success("Welcome back!");
        window.location.href = '/dashboard'; 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Credentials");
    }
  };

  return (
    // 1. OUTER WRAPPER: Flex Column, Full Height (min-vh-100)
    <div className="d-flex flex-column min-vh-100 bg-light">
      
      {/* 2. MIDDLE SECTION: flex-grow-1 pushes footer down, align-items-center centers card */}
      <div className="flex-grow-1 d-flex align-items-center justify-content-center py-5">
        <div className="container">
          <div className="row g-0 shadow-lg rounded-4 overflow-hidden">
            
            {/* ================= LEFT SIDE: INFO & BRANDING ================= */}
            <div className="col-lg-6 bg-primary text-white p-5 d-flex flex-column justify-content-center">
              <div className="mb-4">
                 <i className="bi bi-wallet2 display-3"></i>
              </div>
              <h1 className="fw-bold display-5 mb-3">SettleUp</h1>
              <p className="lead fw-normal mb-4 text-white-50">
                Split bills, not friendships.
              </p>
              
              <ul className="list-unstyled">
                <li className="mb-3 d-flex align-items-start">
                  <i className="bi bi-check-circle-fill me-3 mt-1 text-info"></i>
                  <span>Track shared expenses easily</span>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="bi bi-check-circle-fill me-3 mt-1 text-info"></i>
                  <span>Split bills Equally or Exactly</span>
                </li>
                <li className="mb-3 d-flex align-items-start">
                  <i className="bi bi-check-circle-fill me-3 mt-1 text-info"></i>
                  <span>Simplify debts and settle up instantly</span>
                </li>
              </ul>
            </div>

            {/* ================= RIGHT SIDE: LOGIN FORM ================= */}
            <div className="col-lg-6 bg-white p-5">
              <div className="p-lg-4">
                <h3 className="fw-bold text-dark mb-2">Welcome to SettleUp</h3>
                <p className="text-muted mb-4">Please login to your account</p>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label text-muted small fw-bold text-uppercase">Email or Mobile</label>
                    <input 
                      type="text" 
                      name="identifier" 
                      className="form-control form-control-lg bg-light fs-6" 
                      placeholder="e.g. user@example.com"
                      onChange={handleChange} 
                      required 
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label text-muted small fw-bold text-uppercase">Password</label>
                    <input 
                      type="password" 
                      name="password" 
                      className="form-control form-control-lg bg-light fs-6"
                      onChange={handleChange} 
                      required 
                    />
                  </div>

                  <button type="submit" className="btn btn-primary btn-lg w-100 mb-4">Login</button>
                </form>

                <div className="text-center">
                  <div className="mb-2">
                    <Link to="/forgot-password" className="text-decoration-none text-muted small">Forgot Password?</Link>
                  </div>
                  <p className="mb-0 text-muted small">
                    Don't have an account? <Link to="/register" className="text-primary fw-bold text-decoration-none">Create one now</Link>
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      <Footer />
      
    </div>
  );
};

export default Login;