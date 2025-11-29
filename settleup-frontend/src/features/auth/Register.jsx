import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Client-Side Validation
    if (formData.password !== formData.confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      // 2. Remove confirmPassword before sending to backend
      const { confirmPassword, ...apiPayload } = formData;

      const response = await api.post('/users/register', apiPayload);
      
      if (response.data.success) {
        toast.success("Registration Successful! Please Login.");
        navigate('/login'); 
      }
    } catch (error) {
      console.error("Registration Error:", error.response?.data);

      if (error.response && error.response.data) {
        const data = error.response.data;
        // Handle "Validation Failed" (e.g. bad email format)
        if (data.errors) {
            const firstErrorMsg = Object.values(data.errors)[0];
            toast.error(firstErrorMsg); 
        } 
        // Handle "Business Error" (e.g. Email already exists)
        else if (data.message) {
            toast.error(data.message);
        } else {
            toast.error("Registration Failed.");
        }
      } else {
        toast.error("Server Error. Is the backend running?");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-lg p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-4 fw-bold text-primary">SettleUp</h3>
        <h5 className="text-center mb-4 text-muted">Create Account</h5>
        
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Full Name</label>
            <input type="text" name="name" className="form-control" placeholder="John Doe"
              value={formData.name} onChange={handleChange} required />
          </div>
          
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input type="email" name="email" className="form-control" placeholder="john@example.com"
              value={formData.email} onChange={handleChange} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Mobile Number</label>
            <input type="text" name="mobileNumber" className="form-control" placeholder="9876543210"
              value={formData.mobileNumber} onChange={handleChange} required />
            <div className="form-text">Must be exactly 10 digits</div>
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input type="password" name="password" className="form-control"
              value={formData.password} onChange={handleChange} required />
            <div className="form-text">Min 6 characters</div>
          </div>

          <div className="mb-3">
            <label className="form-label">Confirm Password</label>
            <input type="password" name="confirmPassword" className="form-control"
              value={formData.confirmPassword} onChange={handleChange} required />
          </div>

          <button type="submit" className="btn btn-primary w-100 py-2" disabled={isLoading}>
            {isLoading ? "Registering..." : "Sign Up"}
          </button>
        </form>

        <div className="text-center mt-3">
          <p className="mb-0">Already have an account?</p>
          <Link to="/login" className="text-decoration-none fw-bold">Login here</Link>
        </div>
      </div>
    </div>
  );
};

export default Register;