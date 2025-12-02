import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

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
        // Save User Data
        localStorage.setItem('user', JSON.stringify(response.data.data));
        toast.success("Welcome back!");
        
        // Force refresh to update Navbar state (Simple MVP approach)
        window.location.href = '/dashboard'; 
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid Credentials");
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-lg p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-4 fw-bold text-primary">SettleUp</h3>
        <h5 className="text-center mb-4 text-muted">Login</h5>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email or Mobile</label>
            <input type="text" name="identifier" className="form-control" placeholder="e.g. 9876543210"
              onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-control"
              onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2">Login</button>
        </form>

        <div className="text-center mt-3">
          <div className="mb-2">
            <Link to="/forgot-password" className="text-danger text-decoration-none small">Forgot Password?</Link>
          </div>
          <small>New here? <Link to="/register">Create an account</Link></small>
        </div>
      </div>
    </div>
  );
};

export default Login;