import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const GroupView = () => {
  const { groupId } = useParams();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // --- STATE MANAGEMENT ---
  const [group, setGroup] = useState(null);
  const [history, setHistory] = useState([]);
  const [balances, setBalances] = useState({ balances: [], simplifiedDebts: [] });
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [expandedId, setExpandedId] = useState(null); // Tracks which expense details are open
  const [showAddMember, setShowAddMember] = useState(false); // Toggles the search input
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Personalization State (My Status)
  const [myBalance, setMyBalance] = useState(0);
  const [iOwe, setIOwe] = useState([]);      
  const [owedToMe, setOwedToMe] = useState([]); 

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 1. Get Group Details
      const groupRes = await api.get(`/groups/${groupId}`);
      setGroup(groupRes.data.data);

      // 2. Get Activity History
      const historyRes = await api.get(`/expenses/group/${groupId}/history`);
      setHistory(historyRes.data.data);

      // 3. Get Balances
      const balanceRes = await api.get(`/expenses/group/${groupId}/balances`);
      const balanceData = balanceRes.data.data;
      setBalances(balanceData);

      // 4. Calculate Personal Status
      if (currentUser && balanceData) {
        const myEntry = balanceData.balances.find(b => b.userId === currentUser.id);
        const myName = myEntry ? myEntry.name : currentUser.name;
        
        setMyBalance(myEntry ? myEntry.amount : 0);
        
        // Filter simplified debts to find mine
        setIOwe(balanceData.simplifiedDebts.filter(d => d.fromUser === myName));
        setOwedToMe(balanceData.simplifiedDebts.filter(d => d.toUser === myName));
      }

    } catch (error) {
      console.error(error);
      toast.error("Failed to load group details");
    } finally {
      setLoading(false);
    }
  };

  // --- MEMBER SEARCH LOGIC (Debounced) ---
  useEffect(() => {
    if (!showAddMember || searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
    }
    const timeoutId = setTimeout(async () => {
        try {
            const response = await api.get(`/users?query=${searchQuery}`);
            if(response.data.success) {
                // Filter out users who are already in the group
                const currentMemberIds = group?.members.map(m => m.id) || [];
                const filtered = response.data.data.filter(u => !currentMemberIds.includes(u.id));
                setSearchResults(filtered);
            }
        } catch(err) { console.error(err); }
    }, 300); 
    return () => clearTimeout(timeoutId);
  }, [searchQuery, showAddMember, group]);

  // --- HANDLERS ---

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAddMember = async (userId) => {
      try {
          await api.post(`/groups/${groupId}/members/${userId}`);
          toast.success("Member added!");
          setSearchQuery('');
          setShowAddMember(false);
          fetchData(); 
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to add member");
      }
  };

  const handleRemoveMember = async (userId) => {
      if(!window.confirm("Are you sure? Only users with NO active expenses can be removed.")) return;
      
      try {
          // Pass requesterId so backend knows WE (the Admin) are asking
          await api.delete(`/groups/${groupId}/members/${userId}?requesterId=${currentUser.id}`);
          toast.success("Member removed successfully");
          fetchData(); 
      } catch (error) {
          const msg = error.response?.data?.message || "Failed to remove member";
          toast.error(msg);
      }
  };

  // Helper to check settlement status
  const isSettled = balances.simplifiedDebts.length === 0;

  if (loading) return <div className="text-center mt-5"><div className="spinner-border text-primary"></div><p>Loading Group...</p></div>;

  return (
    <div className="container pb-5">
      
      {/* --- HEADER --- */}
      <div className="d-flex justify-content-between align-items-center mb-4 p-4 bg-white shadow-sm rounded border">
        <div>
          <div className="d-flex align-items-center gap-3">
            <h2 className="mb-0 fw-bold text-primary">{group?.name}</h2>
            
            {/* Status Badge */}
            {isSettled ? (
                <span className="badge bg-success rounded-pill px-3">
                    <i className="bi bi-check-circle-fill me-1"></i> All Settled
                </span>
            ) : (
                <span className="badge bg-warning text-dark rounded-pill px-3">
                    <i className="bi bi-hourglass-split me-1"></i> Unsettled
                </span>
            )}
          </div>
          <p className="text-muted mb-0 mt-1">{group?.description}</p>
        </div>
        
        <div>
          <Link to={`/groups/${groupId}/add-expense`} className="btn btn-danger me-2">
            <i className="bi bi-receipt me-1"></i> Add Expense
          </Link>
          
          {/* Disable Settle Up if there are no debts */}
          {isSettled ? (
             <button className="btn btn-success disabled" title="Nothing to settle">
                <i className="bi bi-check-lg me-1"></i> Settle Up
             </button>
          ) : (
             <Link to={`/groups/${groupId}/settle`} className="btn btn-success">
                <i className="bi bi-cash-coin me-1"></i> Settle Up
             </Link>
          )}
        </div>
      </div>

      <div className="row">
        
        {/* --- LEFT COLUMN: ACTIVITY & PERSONAL STATUS --- */}
        <div className="col-md-8">
          
          {/* Personal Alert Box */}
          <div className={`alert ${myBalance >= 0 ? 'alert-success' : 'alert-danger'} shadow-sm mb-4`}>
            <h4 className="alert-heading fw-bold">
              {myBalance >= 0 ? `You are owed $${myBalance.toFixed(2)}` : `You owe $${Math.abs(myBalance).toFixed(2)}`}
            </h4>
            <hr />
            <div className="row">
               <div className="col-md-6 border-end">
                  <h6 className="fw-bold text-danger small text-uppercase">You need to pay</h6>
                  {iOwe.length === 0 ? <small className="text-muted">Nothing!</small> : (
                    <ul className="list-unstyled mb-0">
                      {iOwe.map((debt, idx) => <li key={idx} className="mb-1">Pay <strong>{debt.toUser}</strong> ${debt.amount}</li>)}
                    </ul>
                  )}
               </div>
               <div className="col-md-6 ps-md-4">
                  <h6 className="fw-bold text-success small text-uppercase">Owed to you</h6>
                  {owedToMe.length === 0 ? <small className="text-muted">Nothing!</small> : (
                    <ul className="list-unstyled mb-0">
                      {owedToMe.map((debt, idx) => <li key={idx} className="mb-1"><strong>{debt.fromUser}</strong> owes ${debt.amount}</li>)}
                    </ul>
                  )}
               </div>
            </div>
          </div>

          {/* Activity Feed */}
          <h4 className="mb-3">Activity</h4>
          {history.length === 0 ? (
            <div className="alert alert-secondary text-center p-5">
                <h5>No expenses yet! 🤷‍♂️</h5>
                <p>Click "Add Expense" to start splitting bills.</p>
            </div>
          ) : (
            <div className="list-group shadow-sm">
              {history.map((item) => (
                <div key={`${item.type}-${item.id}`} className="list-group-item p-0" style={{cursor: 'pointer'}} onClick={() => toggleExpand(item.id)}>
                  
                  {/* Summary Row */}
                  <div className="d-flex justify-content-between align-items-center p-3">
                    <div className="d-flex align-items-center">
                      <div className={`rounded-circle p-2 me-3 text-white ${item.type === 'SETTLEMENT' ? 'bg-success' : 'bg-secondary'}`} 
                           style={{width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                           {item.type === 'SETTLEMENT' ? <i className="bi bi-wallet2"></i> : <i className="bi bi-receipt"></i>}
                      </div>
                      <div>
                        <h5 className="mb-0 fs-6 fw-bold">{item.description}</h5>
                        <small className="text-muted">
                          {item.paidByUserName} {item.type === 'SETTLEMENT' ? 'paid' : 'added'} on {new Date(item.createdAt).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                    <div className="text-end">
                       <span className={`fs-5 fw-bold ${item.type === 'SETTLEMENT' ? 'text-success' : 'text-danger'}`}>
                         {item.type === 'SETTLEMENT' ? '+' : '-'}${item.amount}
                       </span>
                       {item.type === 'EXPENSE' && (
                           <div className="text-muted" style={{fontSize: '0.7rem'}}>
                               {expandedId === item.id ? 'Hide Details ▲' : 'Show Details ▼'}
                           </div>
                       )}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedId === item.id && item.type === 'EXPENSE' && (
                    <div className="bg-light border-top p-3">
                       <h6 className="fw-bold text-muted small text-uppercase mb-2">Split Details</h6>
                       <ul className="list-group list-group-flush bg-transparent">
                          {item.splits && item.splits.map((split, idx) => (
                             <li key={idx} className="list-group-item bg-transparent d-flex justify-content-between py-1 px-0 border-bottom-0">
                                <span>{split.userName}</span>
                                <span className="fw-bold text-danger small">owes ${split.amountOwed.toFixed(2)}</span>
                             </li>
                          ))}
                       </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* --- RIGHT COLUMN: MEMBERS & FULL SUMMARY --- */}
        <div className="col-md-4">
          
          {/* Members List */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <span className="fw-bold">Members</span>
                <button className="btn btn-sm btn-outline-primary" onClick={() => setShowAddMember(!showAddMember)}>
                    {showAddMember ? 'Cancel' : '+ Add'}
                </button>
            </div>
            
            {showAddMember && (
                <div className="p-2 border-bottom bg-light position-relative">
                    <input 
                        type="text" 
                        className="form-control form-control-sm" 
                        placeholder="Search Name or Mobile..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        autoFocus
                    />
                    {searchResults.length > 0 && (
                        <div className="list-group position-absolute mt-1 shadow-lg border start-0 end-0 mx-2" style={{zIndex: 1000}}>
                            {searchResults.map(u => (
                                <button key={u.id} className="list-group-item list-group-item-action" onClick={() => handleAddMember(u.id)}>
                                    <div className="d-flex justify-content-between">
                                        <strong>{u.name}</strong>
                                        <small className="text-muted">{u.mobileNumber}</small>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <ul className="list-group list-group-flush">
                {group?.members.map(m => (
                    <li key={m.id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                        <div>
                            <div>
                                <span className="fw-bold">{m.id === currentUser.id ? 'You' : m.name}</span>
                                {m.id === group.createdByUserId && (
                                    <span className="badge bg-secondary ms-2" style={{fontSize: '0.6rem'}}>ADMIN</span>
                                )}
                            </div>
                            <div className="text-muted small" style={{fontSize: '0.75rem'}}>{m.email}</div>
                        </div>
                        
                        {/* REMOVE BUTTON: Only show if I am Admin AND Target is not Me */}
                        {currentUser.id === group.createdByUserId && m.id !== currentUser.id && (
                            <button 
                                className="btn btn-outline-danger btn-sm px-3" 
                                title="Remove User" 
                                onClick={() => handleRemoveMember(m.id)}
                                style={{fontSize: '0.8rem'}}
                            >
                                Remove
                            </button>
                        )}
                    </li>
                ))}
            </ul>
          </div>

          {/* Full Group Balances */}
          <div className="card shadow-sm mb-4">
            <div className="card-header bg-light fw-bold text-muted">Full Group Balances</div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {balances.balances.map((user) => (
                  <li key={user.userId} className={`list-group-item d-flex justify-content-between ${user.userId === currentUser.id ? 'bg-light border-start border-4 border-primary' : ''}`}>
                      <span>{user.userId === currentUser.id ? <strong>You</strong> : user.name}</span>
                      <span className={`fw-bold ${user.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                          {user.amount >= 0 ? `+${user.amount.toFixed(2)}` : `${user.amount.toFixed(2)}`}
                      </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default GroupView;