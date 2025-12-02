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

  // Exact Split State
  const [exactAmounts, setExactAmounts] = useState({});

  useEffect(() => {
    const fetchGroup = async () => {
      try {
        const response = await api.get(`/groups/${groupId}`);
        const mems = response.data.data.members;
        setMembers(mems);
        
        if (mems.length > 0) {
           setFormData(prev => ({ ...prev, paidByUserId: mems[0].id }));
        }
        
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

  const handleExactAmountChange = (userId, value) => {
    setExactAmounts(prev => ({ ...prev, [userId]: value }));
  };

  // Math Helpers
  const getCurrentSplitSum = () => {
    return Object.values(exactAmounts).reduce((acc, curr) => acc + (parseFloat(curr) || 0), 0);
  };
  const getTotalAmount = () => parseFloat(formData.amount) || 0;
  const getRemaining = () => getTotalAmount() - getCurrentSplitSum();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const totalAmount = getTotalAmount();

    if (totalAmount <= 0) {
        toast.error("Please enter a valid amount");
        return;
    }

    // Exact Split Validation
    if (formData.splitType === 'EXACT') {
      const currentSum = getCurrentSplitSum();
      
      if (Math.abs(totalAmount - currentSum) > 0.01) {
        toast.error(`Amounts sum to ₹${currentSum}, but Total is ₹${totalAmount}`);
        return;
      }

      const splitMap = {};
      members.forEach(member => {
        splitMap[member.id] = parseFloat(exactAmounts[member.id] || 0);
      });

      try {
        await sendRequest({
          groupId: parseInt(groupId),
          paidByUserId: parseInt(formData.paidByUserId),
          description: formData.description,
          amount: totalAmount,
          splitType: 'EXACT',
          exactSplits: splitMap
        });
      } catch (err) { return; }

    } else {
      // Equal Split
      try {
        await sendRequest({
          groupId: parseInt(groupId),
          paidByUserId: parseInt(formData.paidByUserId),
          description: formData.description,
          amount: totalAmount,
          splitType: 'EQUAL',
          involvedUserIds: members.map(m => m.id)
        });
      } catch (err) { return; }
    }
  };

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

  if (loading) return <div className="text-center mt-5">Loading...</div>;

  return (
    <div className="container mt-4">
      <div className="card shadow-sm mx-auto" style={{ maxWidth: '600px' }}>
        <div className="card-header bg-white py-3">
            <h4 className="mb-0 text-center">Add Expense</h4>
        </div>
        <div className="card-body p-4">
          <form onSubmit={handleSubmit}>
            
            {/* Description */}
            <div className="mb-3">
              <label className="form-label">Description</label>
              <input 
                type="text" 
                className="form-control" 
                placeholder="e.g. Dinner, Taxi"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                required
                autoFocus
              />
            </div>

            {/* Amount & Payer Row */}
            <div className="row g-3 mb-3">
                <div className="col-md-6">
                    <label className="form-label">Amount</label>
                    <div className="input-group">
                        <span className="input-group-text">₹</span>
                        <input 
                            type="number" 
                            className="form-control" 
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                            required
                        />
                    </div>
                </div>
                <div className="col-md-6">
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
            </div>

            {/* Split Type Toggle */}
            <div className="mb-3">
                <label className="form-label d-block">Split Method</label>
                <div className="btn-group w-100" role="group">
                    <input 
                        type="radio" 
                        className="btn-check" 
                        name="splitType" 
                        id="equal" 
                        checked={formData.splitType === 'EQUAL'}
                        onChange={() => setFormData({...formData, splitType: 'EQUAL'})}
                    />
                    <label className="btn btn-outline-primary" htmlFor="equal">Equally</label>

                    <input 
                        type="radio" 
                        className="btn-check" 
                        name="splitType" 
                        id="exact" 
                        checked={formData.splitType === 'EXACT'}
                        onChange={() => setFormData({...formData, splitType: 'EXACT'})}
                    />
                    <label className="btn btn-outline-primary" htmlFor="exact">Exact Amounts</label>
                </div>
            </div>

            {/* --- EQUAL SPLIT INFO --- */}
            {formData.splitType === 'EQUAL' && (
                <div className="alert alert-info py-2 small text-center">
                    Each person owes <strong>₹{(getTotalAmount() / members.length || 0).toFixed(2)}</strong>
                </div>
            )}

            {/* --- EXACT SPLIT INPUTS --- */}
            {formData.splitType === 'EXACT' && (
                <div className="card bg-light border-0 mb-3">
                    <div className="card-body">
                        <div className="d-flex justify-content-between mb-2 small fw-bold">
                            <span>Specify shares:</span>
                            <span className={getRemaining() === 0 ? 'text-success' : 'text-danger'}>
                                Remaining: ₹{getRemaining().toFixed(2)}
                            </span>
                        </div>
                        
                        {members.map(member => (
                            <div key={member.id} className="d-flex align-items-center mb-2">
                                <label className="flex-grow-1 mb-0 text-truncate pe-2">{member.name}</label>
                                <div className="input-group input-group-sm" style={{width: '140px'}}>
                                    <span className="input-group-text">₹</span>
                                    <input 
                                        type="number" 
                                        className="form-control"
                                        placeholder="0"
                                        value={exactAmounts[member.id]}
                                        onChange={(e) => handleExactAmountChange(member.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="d-grid gap-2 mt-4">
                <button type="submit" className="btn btn-danger">Save Expense</button>
                <button type="button" className="btn btn-light text-muted" onClick={() => navigate(`/groups/${groupId}`)}>
                    Cancel
                </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};

export default AddExpense;