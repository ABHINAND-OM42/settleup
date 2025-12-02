import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    mobileNumber: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Optional: Keep Client-side check for better UX (faster feedback)
    if (formData.newPassword !== formData.confirmPassword) {
        toast.error("Passwords do not match");
        return;
    }

    setIsLoading(true);

    try {
      // Prepare Payload (Send EVERYTHING including confirmPassword)
      const payload = {
          email: formData.email,
          mobileNumber: formData.mobileNumber,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword // <--- Sending to Backend
      };

      const response = await api.post('/users/forgot-password', payload);
      
      if (response.data.success) {
        toast.success("Password Reset Successful! Login now.");
        navigate('/login'); 
      }
    } catch (error) {
      console.error("Reset Error:", error);
      
      if (error.response && error.response.data) {
          const data = error.response.data;
          
          // 1. Handle Validation Errors (e.g. "Confirm Password is required")
          if (data.errors) {
             const firstMsg = Object.values(data.errors)[0];
             toast.error(firstMsg);
          }
          // 2. Handle Logic Errors (e.g. "Passwords do not match" from Backend)
          else if (data.message) {
             toast.error(data.message);
          }
          else {
             toast.error("Reset Failed");
          }
      } else {
          toast.error("Server Error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container d-flex justify-content-center align-items-center" style={{ minHeight: '80vh' }}>
      <div className="card shadow-lg p-4" style={{ width: '100%', maxWidth: '400px' }}>
        <h3 className="text-center mb-4 fw-bold text-danger">Reset Password</h3>
        <p className="text-muted text-center small mb-4">
          Verify your identity to set a new password.
        </p>
        
        <form onSubmit={handleSubmit}>
          {/* Identity Fields */}
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input 
              type="email" name="email" className="form-control" 
              onChange={handleChange} required 
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Mobile Number</label>
            <input 
              type="text" name="mobileNumber" className="form-control" 
              onChange={handleChange} required 
            />
          </div>

          <hr className="my-4"/>

          {/* Password Fields */}
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input 
              type="password" name="newPassword" className="form-control" 
              onChange={handleChange} required 
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Confirm Password</label>
            <input 
              type="password" name="confirmPassword" className="form-control" 
              onChange={handleChange} required 
            />
          </div>

          <button type="submit" className="btn btn-danger w-100 py-2" disabled={isLoading}>
            {isLoading ? "Processing..." : "Reset Password"}
          </button>
        </form>

        <div className="text-center mt-3">
          <Link to="/login" className="text-decoration-none text-muted">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;