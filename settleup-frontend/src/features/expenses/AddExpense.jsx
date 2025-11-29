import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const AddExpense = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    paidByUserId: '',
    splitType: 'EQUAL'
  });

  // State for EXACT split amounts: { userId: amount } -> { 1: 200, 2: 300 }
  const [exactAmounts, setExactAmounts] = useState({});

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await api.get(`/groups/${groupId}`);
        const mems = response.data.data.members;
        setMembers(mems);
        
        // Default Payer
        if (mems.length > 0) {
           setFormData(prev => ({ ...prev, paidByUserId: mems[0].id }));
        }
        
        // Initialize exact amounts to 0 for everyone
        const initialAmounts = {};
        mems.forEach(m => initialAmounts[m.id] = '');
        setExactAmounts(initialAmounts);

      } catch (error) {
        toast.error("Failed to load members");
      } finally {
        setLoading(false);
      }
    };
    fetchGroup();
  }, [groupId]);

  // Handle changes for Exact Amount inputs
  const handleExactAmountChange = (userId, value) => {
    setExactAmounts(prev => ({
      ...prev,
      [userId]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const totalAmount = parseFloat(formData.amount);

    // 1. Validate EXACT Logic
    if (formData.splitType === 'EXACT') {
      let currentSum = 0;
      const splitMap = {};

      // Sum up inputs
      members.forEach(member => {
        const val = parseFloat(exactAmounts[member.id] || 0);
        currentSum += val;
        splitMap[member.id] = val;
      });

      // Check if sum matches total (allow small float diff)
      if (Math.abs(totalAmount - currentSum) > 0.01) {
        toast.error(`Split amounts (${currentSum}) do not equal Total (${totalAmount})`);
        return;
      }

      // 2. Prepare Payload for EXACT
      try {
        const payload = {
          groupId: parseInt(groupId),
          paidByUserId: parseInt(formData.paidByUserId),
          description: formData.description,
          amount: totalAmount,
          splitType: 'EXACT',
          exactSplits: splitMap // Send the map
        };
        await sendRequest(payload);
      } catch (err) { return; }

    } else {
      // 3. Prepare Payload for EQUAL
      try {
        const payload = {
          groupId: parseInt(groupId),
          paidByUserId: parseInt(formData.paidByUserId),
          description: formData.description,
          amount: totalAmount,
          splitType: 'EQUAL',
          involvedUserIds: members.map(m => m.id)
        };
        await sendRequest(payload);
      } catch (err) { return; }
    }
  };

  // Helper to send API call
  const sendRequest = async (payload) => {
    try {
      const response = await api.post('/expenses', payload);
      if (response.data.success) {
        toast.success("Expense Added!");
        navigate(`/groups/${groupId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to add expense");
    }
  };

  // Helper to calculate current sum for display
  const getCurrentSplitSum = () => {
    return Object.values(exactAmounts).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
      <div className="card-body p-4">
        <h3 className="mb-4 text-danger">Add New Expense</h3>
        
        <form onSubmit={handleSubmit}>
          {/* Description */}
          <div className="mb-3">
            <label className="form-label">Description</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="e.g. Dinner at Taj"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              required
            />
          </div>

          {/* Total Amount */}
          <div className="mb-3">
            <label className="form-label">Total Amount</label>
            <input 
              type="number" 
              className="form-control" 
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => setFormData({...formData, amount: e.target.value})}
              required
            />
          </div>

          {/* Paid By */}
          <div className="mb-3">
            <label className="form-label">Paid By</label>
            <select 
              className="form-select"
              value={formData.paidByUserId}
              onChange={(e) => setFormData({...formData, paidByUserId: e.target.value})}
            >
              {members.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Split Type Selector */}
          <div className="mb-3">
            <label className="form-label">Split Type</label>
            <select 
              className="form-select" 
              value={formData.splitType}
              onChange={(e) => setFormData({...formData, splitType: e.target.value})}
            >
              <option value="EQUAL">Split Equally</option>
              <option value="EXACT">Split by Exact Amounts</option>
            </select>
          </div>

          <hr />

          {/* CONDITIONAL UI: EQUAL SPLIT */}
          {formData.splitType === 'EQUAL' && (
             <div className="alert alert-light border small text-muted text-center">
                Total will be divided by {members.length}. <br/>
                Each person owes: <strong>${(formData.amount / members.length || 0).toFixed(2)}</strong>
             </div>
          )}

          {/* CONDITIONAL UI: EXACT SPLIT */}
          {formData.splitType === 'EXACT' && (
            <div className="mb-4 bg-light p-3 rounded">
              <label className="form-label fw-bold mb-3">Enter Shares:</label>
              
              {members.map(member => (
                <div key={member.id} className="mb-2 row align-items-center">
                  <div className="col-4 text-truncate">{member.name}</div>
                  <div className="col-8">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text">$</span>
                      <input 
                        type="number" 
                        className="form-control"
                        placeholder="0.00"
                        value={exactAmounts[member.id]}
                        onChange={(e) => handleExactAmountChange(member.id, e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Math Helper */}
              <div className="d-flex justify-content-between mt-3 pt-2 border-top">
                <span>Total Entered:</span>
                <span className={Math.abs(parseFloat(formData.amount) - getCurrentSplitSum()) > 0.01 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                  ${getCurrentSplitSum().toFixed(2)} / ${formData.amount || 0}
                </span>
              </div>
              {Math.abs(parseFloat(formData.amount) - getCurrentSplitSum()) > 0.01 && (
                  <div className="text-danger small text-end">Amounts must match total!</div>
              )}
            </div>
          )}

          <button type="submit" className="btn btn-danger w-100 py-2">Save Expense</button>
        </form>
      </div>
    </div>
  );
};

export default AddExpense;