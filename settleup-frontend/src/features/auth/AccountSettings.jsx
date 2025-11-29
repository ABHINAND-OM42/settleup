import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AccountSettings = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobileNumber: ''
  });

  useEffect(() => {
    // Load user from local storage initially
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      setFormData({
        name: storedUser.name,
        email: storedUser.email,
        mobileNumber: storedUser.mobileNumber
      });
    }
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // PUT /api/users/{id}
      const response = await api.put(`/users/${user.id}`, formData);

      if (response.data.success) {
        const updatedUser = response.data.data;
        
        // 1. Update Local Storage
        localStorage.setItem('user', JSON.stringify(updatedUser));
        
        // 2. Update State
        setUser(updatedUser);
        
        toast.success("Profile Updated Successfully!");
      }
    } catch (error) {
      console.error(error);
      if (error.response && error.response.data) {
          const data = error.response.data;
          if (data.errors) toast.error(Object.values(data.errors)[0]);
          else if (data.message) toast.error(data.message);
          else toast.error("Update failed");
      } else {
          toast.error("Server Error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="container mt-5">
      <div className="card shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
        <div className="card-header bg-white">
            <h4 className="mb-0 text-primary">Account Settings</h4>
        </div>
        <div className="card-body p-4">
          
          <form onSubmit={handleSubmit}>
            {/* Name */}
            <div className="mb-3">
              <label className="form-label fw-bold">Full Name</label>
              <input 
                type="text" 
                name="name" 
                className="form-control" 
                value={formData.name} 
                onChange={handleChange} 
                required 
              />
            </div>

            {/* Email */}
            <div className="mb-3">
              <label className="form-label fw-bold">Email Address</label>
              <input 
                type="email" 
                name="email" 
                className="form-control" 
                value={formData.email} 
                onChange={handleChange} 
                required 
              />
            </div>

            {/* Mobile */}
            <div className="mb-4">
              <label className="form-label fw-bold">Mobile Number</label>
              <input 
                type="text" 
                name="mobileNumber" 
                className="form-control" 
                value={formData.mobileNumber} 
                onChange={handleChange} 
                required 
              />
              <div className="form-text">Must be 10 digits</div>
            </div>

            <div className="d-flex justify-content-between">
                <button type="button" className="btn btn-outline-secondary" onClick={() => window.history.back()}>
                    Cancel
                </button>
                <button type="submit" className="btn btn-primary px-4" disabled={loading}>
                    {loading ? "Saving..." : "Save Changes"}
                </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
};

export default AccountSettings;