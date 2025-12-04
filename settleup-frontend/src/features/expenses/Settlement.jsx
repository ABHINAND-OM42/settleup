import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../services/api';

const Settlement = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const [members, setMembers] = useState([]);
  const [debts, setDebts] = useState([]); 
  const [loading, setLoading] = useState(true);

  // Mode: 'PAY' (I am paying) or 'RECEIVE' (Someone paid me)
  const [mode, setMode] = useState('PAY'); 

  // Selected User ID to Pay/Receive from
  const [selectedUserId, setSelectedUserId] = useState('');
  const [amount, setAmount] = useState('');

  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    try {
      // 1. Get Group Members (Need IDs)
      const groupRes = await api.get(`/groups/${groupId}`);
      const mems = groupRes.data.data.members;
      setMembers(mems);

      const balanceRes = await api.get(`/expenses/group/${groupId}/balances`);
      setDebts(balanceRes.data.data.simplifiedDebts);
    } catch (error) {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  // Filter relevant options based on Mode
  const getOptions = () => {
    if (!currentUser || members.length === 0) return [];

    if (mode === 'PAY') {

      const myDebts = debts.filter(d => d.fromUser === currentUser.name);
      
      // Return the 'toUser' (The person I owe) as options
      // We need to map Name back to ID
      return myDebts.map(d => {
        const member = members.find(m => m.name === d.toUser);
        return { 
          id: member?.id, 
          name: member?.name, 
          amount: d.amount // The debt amount
        };
      }).filter(opt => opt.id); // Remove nulls
    } 
    else {
      // Mode === 'RECEIVE'
      // Find debts where "toUser" is ME
      const incomingDebts = debts.filter(d => d.toUser === currentUser.name);
      
      // Return the 'fromUser' (The person who owes me)
      return incomingDebts.map(d => {
        const member = members.find(m => m.name === d.fromUser);
        return { 
          id: member?.id, 
          name: member?.name, 
          amount: d.amount 
        };
      }).filter(opt => opt.id);
    }
  };

  const options = getOptions();

  // Auto-select first option when mode changes
  useEffect(() => {
    if (options.length > 0) {
      setSelectedUserId(options[0].id);
      setAmount(options[0].amount); // Auto-fill full amount
    } else {
      setSelectedUserId('');
      setAmount('');
    }
  }, [mode, debts]); // Re-run when debts load or mode changes

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUserId) {
        toast.error("No user selected to settle with.");
        return;
    }

    try {
      // Construct Payload based on Mode
      const payload = {
        groupId: parseInt(groupId),
        amount: parseFloat(amount),
        // If I am Paying: Payer = Me, Payee = Selected
        // If I Receive: Payer = Selected, Payee = Me
        payerId: mode === 'PAY' ? currentUser.id : parseInt(selectedUserId),
        payeeId: mode === 'PAY' ? parseInt(selectedUserId) : currentUser.id
      };

      const response = await api.post('/settlements', payload);
      if (response.data.success) {
        toast.success("Settlement Recorded!");
        navigate(`/groups/${groupId}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to settle");
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="card shadow-sm mx-auto" style={{ maxWidth: '500px' }}>
      <div className="card-body p-4">
        <h3 className="mb-4 text-center">Settle Up</h3>

        {/* MODE TOGGLE */}
        <div className="btn-group w-100 mb-4" role="group">
          <input 
            type="radio" className="btn-check" name="btnradio" id="btnPay" 
            checked={mode === 'PAY'} onChange={() => setMode('PAY')} 
          />
          <label className={`btn ${mode === 'PAY' ? 'btn-danger' : 'btn-outline-danger'}`} htmlFor="btnPay">
            I am Paying
          </label>

          <input 
            type="radio" className="btn-check" name="btnradio" id="btnReceive" 
            checked={mode === 'RECEIVE'} onChange={() => setMode('RECEIVE')} 
          />
          <label className={`btn ${mode === 'RECEIVE' ? 'btn-success' : 'btn-outline-success'}`} htmlFor="btnReceive">
            I Received Money
          </label>
        </div>
        
        {options.length === 0 ? (
           <div className="alert alert-secondary text-center">
              {mode === 'PAY' ? "You don't owe anyone! 🎉" : "No one owes you money! 🤷‍♂️"}
           </div>
        ) : (
          <form onSubmit={handleSubmit}>
            
            {/* DYNAMIC LABEL */}
            <div className="mb-3">
              <label className="form-label fw-bold">
                {mode === 'PAY' ? "Who are you paying?" : "Who paid you?"}
              </label>
              <select 
                className="form-select"
                value={selectedUserId}
                onChange={(e) => {
                    const id = e.target.value;
                    setSelectedUserId(id);
                    // Update amount to match the selected user's specific debt
                    const opt = options.find(o => o.id == id);
                    if(opt) setAmount(opt.amount);
                }}
              >
                {options.map(opt => (
                  <option key={opt.id} value={opt.id}>
                    {opt.name} (Outstanding: ${opt.amount})
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Amount</label>
              <div className="input-group">
                <span className="input-group-text">$</span>
                <input 
                  type="number" 
                  className="form-control" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className={`btn w-100 py-2 ${mode === 'PAY' ? 'btn-danger' : 'btn-success'}`}>
              {mode === 'PAY' ? "Confirm Payment" : "Confirm Receipt"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Settlement;