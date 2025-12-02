import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CreateGroup = () => {
  const navigate = useNavigate();
  // Get the logged-in user from local storage
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Redirect to login if user data is missing
  useEffect(() => {
    if (!currentUser || !currentUser.id) {
      toast.error("Session expired. Please login again.");
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Form State
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  
  // Search & Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]); 
  // Initialize selectedUsers with the current user (so they are part of the group)
  const [selectedUsers, setSelectedUsers] = useState(currentUser ? [currentUser] : []); 

  // 1. Search Logic (Debounced)
  useEffect(() => {
    // Only search if there is text
    if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.get(`/users?query=${searchQuery}`);
        if (response.data.success) {
          // Filter out users who are ALREADY selected
          const filtered = response.data.data.filter(
            u => !selectedUsers.some(selected => selected.id === u.id)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error("Search failed", error);
      }
    }, 300); // Wait 300ms before calling API

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedUsers]);

  // 2. Handler: Add User to list
  const addUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery(''); // Clear search box
    setSearchResults([]); // Clear results
  };

  // 3. Handler: Remove User from list
  const removeUser = (userId) => {
    if (userId === currentUser.id) {
      toast.warning("You cannot remove yourself from the group.");
      return;
    }
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  // 4. Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault();

    // UPDATED VALIDATION: Allow group of 1 (Just Admin)
    // We only check if the list is empty (which shouldn't happen logic-wise)
    if (selectedUsers.length === 0) {
      toast.error("Error: You must be part of the group.");
      return;
    }

    try {
      // CONSTRUCT PAYLOAD
      const payload = {
        name: groupName,
        description: description,
        // Extract just the IDs for the backend List<Long>
        memberIds: selectedUsers.map(u => u.id),
        
        // ⚠️ CRITICAL: Send who created this group
        createdByUserId: currentUser.id 
      };

      // Debugging: Check console to see exactly what is sent
      console.log("🚀 Sending Payload:", payload);

      const response = await api.post('/groups', payload);
      
      if (response.data.success) {
        toast.success("Group Created Successfully!");
        navigate('/dashboard');
      }
    } catch (error) {
      console.error("Create Group Error:", error.response?.data);
      // Show specific backend validation message if available
      const msg = error.response?.data?.errors 
        ? Object.values(error.response.data.errors)[0] // Get first validation error
        : error.response?.data?.message || "Failed to create group";
      
      toast.error(msg);
    }
  };

  return (
    <div className="card shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
      <div className="card-body p-4">
        <h3 className="card-title mb-4 text-primary">Create New Group</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Group Name Input */}
          <div className="mb-3">
            <label className="form-label fw-bold">Group Name</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Goa Trip 2025"
              value={groupName} 
              onChange={(e) => setGroupName(e.target.value)} 
              required 
            />
          </div>

          {/* Description Input */}
          <div className="mb-3">
            <label className="form-label">Description (Optional)</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Weekend fun"
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
            />
          </div>

          <hr />

          {/* User Search Input */}
          <div className="mb-3">
            <label className="form-label fw-bold">Add Members (Optional)</label>
            <div className="position-relative">
                <input 
                  type="text" 
                  className="form-control" 
                  placeholder="Search by Name or Mobile..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                
                {/* Search Results Dropdown (Only shows if results exist) */}
                {searchResults.length > 0 && (
                <ul className="list-group position-absolute shadow w-100" style={{ maxWidth: '100%', zIndex: 10 }}>
                    {searchResults.map(user => (
                    <button 
                        key={user.id} 
                        type="button"
                        className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        onClick={() => addUser(user)}
                    >
                        <span>{user.name}</span>
                        <small className="text-muted">{user.mobileNumber}</small>
                    </button>
                    ))}
                </ul>
                )}
            </div>
            <div className="form-text">You can add more people later from the group page.</div>
          </div>

          {/* Selected Members Chips */}
          <div className="mb-4">
            <label className="form-label text-muted small">Selected Members ({selectedUsers.length})</label>
            <div className="d-flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <span 
                  key={user.id} 
                  className={`badge border p-2 d-flex align-items-center ${user.id === currentUser.id ? 'bg-primary text-white' : 'bg-light text-dark'}`}
                >
                  {user.id === currentUser.id ? 'You' : user.name}
                  {/* Remove Button (X) - Don't show for self */}
                  {user.id !== currentUser.id && (
                    <i 
                      className="bi bi-x-circle-fill ms-2 text-danger" 
                      style={{cursor: 'pointer'}}
                      onClick={() => removeUser(user.id)}
                    ></i>
                  )}
                </span>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <button type="submit" className="btn btn-primary w-100 py-2">
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;