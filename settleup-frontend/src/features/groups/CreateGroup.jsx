import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const CreateGroup = () => {
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // Form State
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  
  // Search & Selection State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]); // Results from API
  const [selectedUsers, setSelectedUsers] = useState([currentUser]); // Array of User Objects (start with self)

  // 1. Search Effect (Debounced logic simplified)
  useEffect(() => {
    const fetchUsers = async () => {
      // Don't search if query is too short (optional optimization)
      if (searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
      }

      try {
        // GET /api/users?query=bob
        const response = await api.get(`/users?query=${searchQuery}`);
        if (response.data.success) {
          // Filter out users who are already selected
          const filtered = response.data.data.filter(
            u => !selectedUsers.some(selected => selected.id === u.id)
          );
          setSearchResults(filtered);
        }
      } catch (error) {
        console.error("Search failed", error);
      }
    };

    // Small delay to prevent too many API calls while typing
    const timeoutId = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(timeoutId);

  }, [searchQuery, selectedUsers]);

  // 2. Add User to Selection
  const addUser = (user) => {
    setSelectedUsers([...selectedUsers, user]);
    setSearchQuery(''); // Clear search after adding
    setSearchResults([]); // Clear results
  };

  // 3. Remove User from Selection
  const removeUser = (userId) => {
    if (userId === currentUser.id) {
      toast.warning("You cannot remove yourself from the group.");
      return;
    }
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  // 4. Submit
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (selectedUsers.length < 2) {
      toast.error("Please add at least one friend!");
      return;
    }

    try {
      const payload = {
        name: groupName,
        description: description,
        memberIds: selectedUsers.map(u => u.id) // Extract IDs
      };

      const response = await api.post('/groups', payload);
      
      if (response.data.success) {
        toast.success("Group Created Successfully!");
        navigate('/dashboard');
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to create group");
    }
  };

  return (
    <div className="card shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
      <div className="card-body p-4">
        <h3 className="card-title mb-4 text-primary">Create New Group</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Name & Desc */}
          <div className="mb-3">
            <label className="form-label fw-bold">Group Name</label>
            <input type="text" className="form-control" placeholder="e.g. Goa Trip"
              value={groupName} onChange={(e) => setGroupName(e.target.value)} required />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <input type="text" className="form-control" placeholder="e.g. Weekend fun"
              value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <hr />

          {/* SEARCH SECTION */}
          <div className="mb-3">
            <label className="form-label fw-bold">Add Members</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Name or Mobile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Search Results Dropdown */}
            {searchResults.length > 0 && (
              <ul className="list-group position-absolute shadow w-100" style={{ maxWidth: '550px', zIndex: 10 }}>
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

          {/* SELECTED MEMBERS CHIPS */}
          <div className="mb-4">
            <label className="form-label text-muted small">Selected Members ({selectedUsers.length})</label>
            <div className="d-flex flex-wrap gap-2">
              {selectedUsers.map(user => (
                <span key={user.id} className="badge bg-light text-dark border p-2 d-flex align-items-center">
                  {user.name}
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

          <button type="submit" className="btn btn-primary w-100 py-2">
            Create Group
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroup;