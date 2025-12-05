import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const GroupView = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  // --- STATE ---
  const [group, setGroup] = useState(null);
  const [history, setHistory] = useState([]);
  const [balances, setBalances] = useState({ balances: [], simplifiedDebts: [] });
  const [loading, setLoading] = useState(true);
  
  // UI State
  const [expandedId, setExpandedId] = useState(null);
  const [showAddMember, setShowAddMember] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Personal Status
  const [myBalance, setMyBalance] = useState(0);
  const [iOwe, setIOwe] = useState([]);      
  const [owedToMe, setOwedToMe] = useState([]); 

  // --- FETCH DATA ---
  useEffect(() => {
    fetchData();
  }, [groupId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const groupRes = await api.get(`/groups/${groupId}`);
      setGroup(groupRes.data.data);

      const historyRes = await api.get(`/expenses/group/${groupId}/history`);
      setHistory(historyRes.data.data);

      const balanceRes = await api.get(`/expenses/group/${groupId}/balances`);
      const balanceData = balanceRes.data.data;
      setBalances(balanceData);

      if (currentUser && balanceData) {
        const myEntry = balanceData.balances.find(b => b.userId === currentUser.id);
        const myName = myEntry ? myEntry.name : currentUser.name;
        
        setMyBalance(myEntry ? myEntry.amount : 0);
        setIOwe(balanceData.simplifiedDebts.filter(d => d.fromUser === myName));
        setOwedToMe(balanceData.simplifiedDebts.filter(d => d.toUser === myName));
      }
    } catch (error) {
      console.error(error);
      // If the backend prevents non-members from even seeing the group, redirect here
      if (error.response && error.response.status === 403) {
          toast.error("You are no longer a member of this group.");
          navigate('/dashboard');
      } else {
          toast.error("Failed to load group details");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- DERIVED STATE: IS MEMBER? ---
  // Check if the current user exists in the fetched member list
  const isMember = group?.members?.some(m => m.id === currentUser.id);
  const isSettled = balances.simplifiedDebts.length === 0;

  // --- HANDLERS ---

  useEffect(() => {
    if (!showAddMember || searchQuery.trim().length === 0) {
        setSearchResults([]);
        return;
    }
    const timeoutId = setTimeout(async () => {
        try {
            const response = await api.get(`/users?query=${encodeURIComponent(searchQuery)}`);
            if(response.data.success) {
                const currentMemberIds = group?.members.map(m => m.id) || [];
                const filtered = response.data.data.filter(u => !currentMemberIds.includes(u.id));
                setSearchResults(filtered);
            }
        } catch(err) { console.error(err); }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, showAddMember, group]);

  const toggleExpand = (id) => setExpandedId(expandedId === id ? null : id);

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
      const confirmMsg = "Are you sure?\n\n" +
        "1. They will be removed from the member list.\n" +
        "2. Their past expenses remain in history.\n" +
        "3. If they owe money, SETTLE IT FIRST, otherwise it stays as a 'Ghost Debt'.";

      if(!window.confirm(confirmMsg)) return;
      try {
          await api.delete(`/groups/${groupId}/members/${userId}?requesterId=${currentUser.id}`);
          toast.success("Member removed successfully");
          fetchData();
      } catch (error) {
          toast.error(error.response?.data?.message || "Failed to remove member");
      }
  };

  const handleDeleteItem = async (e, type, id) => {
    e.stopPropagation();
    if(!window.confirm(`Delete this ${type.toLowerCase()}? Balances will be updated.`)) return;
    try {
        await api.delete(type === 'EXPENSE' ? `/expenses/${id}` : `/settlements/${id}`);
        toast.success("Deleted successfully");
        fetchData();
    } catch (error) {
        toast.error("Failed to delete item");
    }
  };

  const handleDeleteGroup = async () => {
    if (!isSettled) {
        toast.error("Cannot delete group. There are unpaid debts! Settle everyone up first.");
        return;
    }
    const confirmMsg = "Are you sure you want to PERMANENTLY DELETE this group?";
    if (!window.confirm(confirmMsg)) return;

    try {
        await api.delete(`/groups/${groupId}?requesterId=${currentUser.id}`);
        toast.success("Group deleted successfully");
        navigate('/dashboard'); 
    } catch (error) {
        toast.error(error.response?.data?.message || "Failed to delete group");
    }
  };

  // --- SORT MEMBERS ---
  const sortedMembers = group?.members ? [...group.members].sort((a, b) => {
      if (a.id == group.createdByUserId) return -1;
      if (b.id == group.createdByUserId) return 1;
      return 0;
  }) : [];

  if (loading) return <div className="d-flex justify-content-center mt-5"><div className="spinner-border text-primary"></div></div>;

  return (
    <div className="container pb-5">
      
      {/* ================= HEADER SECTION ================= */}
      <div className="card shadow-sm border-0 mb-4 bg-white">
        <div className="card-body p-4 d-flex flex-column flex-xl-row justify-content-between align-items-center">
            <div className="mb-3 mb-xl-0">
                <div className="d-flex align-items-center gap-3 mb-1">
                    <h2 className="fw-bold text-dark mb-0">{group?.name}</h2>
                    {isSettled ? (
                        <span className="badge bg-success-subtle text-success rounded-pill border border-success px-3">
                            <i className="bi bi-check-all me-1"></i> All Settled
                        </span>
                    ) : (
                        <span className="badge bg-warning-subtle text-warning-emphasis rounded-pill border border-warning px-3">
                            <i className="bi bi-hourglass-split me-1"></i> Unsettled
                        </span>
                    )}
                </div>
                <p className="text-muted mb-0"><small>{group?.description || ''}</small></p>
            </div>
            
            <div className="d-flex flex-wrap gap-2 justify-content-center">
                
                {/* 🔒 LOGIC FIX: ONLY SHOW BUTTONS IF USER IS A MEMBER */}
                {isMember ? (
                    <>
                        {!isSettled && (
                            <button 
                                className="btn btn-info text-white px-4 rounded-pill shadow-sm" 
                                onClick={() => setShowPlanModal(true)}
                            >
                                <i className="bi bi-diagram-3-fill me-1"></i> View Plan
                            </button>
                        )}

                        <Link to={`/groups/${groupId}/add-expense`} className="btn btn-primary px-4 rounded-pill shadow-sm">
                            <i className="bi bi-plus-lg me-1"></i> Add Expense
                        </Link>
                        
                        {isSettled ? (
                            <button className="btn btn-secondary px-4 rounded-pill disabled opacity-50">Settle Up</button>
                        ) : (
                            <Link to={`/groups/${groupId}/settle`} className="btn btn-outline-success px-4 rounded-pill">
                                Settle Up
                            </Link>
                        )}

                        {group?.createdByUserId == currentUser.id && (
                            <button 
                                className="btn btn-outline-danger px-3 rounded-pill ms-2"
                                onClick={handleDeleteGroup}
                                title="Delete Group"
                            >
                                <i className="bi bi-trash3-fill"></i>Delete Group
                            </button>
                        )}
                    </>
                ) : (
                    // 🔒 IF REMOVED, SHOW ALERT INSTEAD OF BUTTONS
                    <div className="alert alert-danger mb-0 py-2 px-3 fw-bold border-danger">
                        <i className="bi bi-exclamation-triangle-fill me-2"></i>
                        You are no longer a member of this group.
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="row">
        
        {/* ================= LEFT COLUMN ================= */}
        <div className="col-lg-8">
          
          {/* --- PERSONAL DASHBOARD CARD --- */}
          <div className="card shadow-sm border-0 mb-4 overflow-hidden">
            <div className={`card-header fw-bold py-3 ${myBalance >= 0 ? 'bg-success-subtle text-success-emphasis' : 'bg-danger-subtle text-danger-emphasis'}`}>
                <div className="d-flex justify-content-between align-items-center">
                    <span><i className="bi bi-wallet2 me-2"></i> Your Status</span>
                    <span className="fs-5">
                        {myBalance >= 0 ? `You get back ₹${myBalance.toFixed(2)}` : `You owe ₹${Math.abs(myBalance).toFixed(2)}`}
                    </span>
                </div>
            </div>
            <div className="card-body">
                <div className="row">
                    {/* RED: I OWE */}
                    <div className="col-md-6 border-end">
                        <h6 className="text-muted text-uppercase small fw-bold mb-3">You need to pay</h6>
                        {iOwe.length === 0 ? (
                            <div className="text-muted fst-italic"><i className="bi bi-check-circle me-1"></i> Nothing to pay</div>
                        ) : (
                            <ul className="list-group list-group-flush">
                                {iOwe.map((d, i) => (
                                    <li key={i} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-0">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-danger-subtle text-danger rounded-circle p-2 me-2" style={{width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center'}}><i className="bi bi-person"></i></div>
                                            <span className="fw-medium">{d.toUser}</span>
                                        </div>
                                        <span className="text-danger fw-bold">₹{d.amount}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                    {/* GREEN: OWED TO ME */}
                    <div className="col-md-6 ps-md-4 mt-3 mt-md-0">
                        <h6 className="text-muted text-uppercase small fw-bold mb-3">Owed to you</h6>
                        {owedToMe.length === 0 ? (
                            <div className="text-muted fst-italic"><i className="bi bi-emoji-neutral me-1"></i> No one owes you</div>
                        ) : (
                            <ul className="list-group list-group-flush">
                                {owedToMe.map((d, i) => (
                                    <li key={i} className="list-group-item px-0 py-2 d-flex justify-content-between align-items-center border-0">
                                        <div className="d-flex align-items-center">
                                            <div className="bg-success-subtle text-success rounded-circle p-2 me-2" style={{width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center'}}><i className="bi bi-person"></i></div>
                                            <span className="fw-medium">{d.fromUser}</span>
                                        </div>
                                        <span className="text-success fw-bold">₹{d.amount}</span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                </div>
            </div>
          </div>

          {/* --- ACTIVITY FEED --- */}
          <h5 className="mb-3 fw-bold text-secondary ps-1">Recent Activity</h5>
          {history.length === 0 ? (
            <div className="card border-0 shadow-sm p-5 text-center bg-light">
                <div className="display-4 mb-3">🧾</div>
                <h5>No expenses recorded yet</h5>
                <p className="text-muted">Click "Add Expense" to start tracking bills.</p>
            </div>
          ) : (
            <div className="card shadow-sm border-0">
                <ul className="list-group list-group-flush">
                {history.map((item) => (
                    <li key={`${item.type}-${item.id}`} className="list-group-item p-0 border-bottom">
                    <div 
                        className="d-flex justify-content-between align-items-center p-3 bg-white" 
                        style={{cursor: 'pointer', transition: 'background 0.2s'}} 
                        onClick={() => toggleExpand(item.id)}
                        onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                        <div className="d-flex align-items-center">
                            <div className={`rounded-3 p-3 me-3 text-center shadow-sm ${item.type === 'SETTLEMENT' ? 'bg-success-subtle' : 'bg-warning-subtle'}`}
                                style={{width: '50px', height: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                                {item.type === 'SETTLEMENT' ? <i className="bi bi-cash-stack fs-4 text-success"></i> : <i className="bi bi-receipt-cutoff fs-4 text-warning-emphasis"></i>}
                            </div>
                            <div>
                                <h6 className="mb-0 fw-bold text-dark">{item.description}</h6>
                                <small className="text-muted">
                                    {item.paidByUserName} {item.type === 'SETTLEMENT' ? `paid ₹${item.amount}` : 'added'} on {new Date(item.createdAt).toLocaleDateString()}
                                </small>
                            </div>
                        </div>
                        <div className="text-end">
                            <div className={`fs-5 fw-bold ${item.type === 'SETTLEMENT' ? 'text-success' : 'text-danger'}`}>
                                {item.type === 'SETTLEMENT' ? 'PAID' : `₹${item.amount}`}
                            </div>
                            {/* Hide Edit/Delete buttons if not a member anymore (Visual only, backend also protects this) */}
                            {isMember && (
                                <div className="d-flex gap-2 justify-content-end mt-1">
                                    {item.type === 'EXPENSE' && (
                                        <small className="text-primary" style={{fontSize: '0.75rem'}}>
                                            {expandedId === item.id ? 'Hide Details' : 'View Split'}
                                        </small>
                                    )}
                                    <button className="btn btn-link text-muted p-0 text-decoration-none" style={{fontSize: '0.75rem'}} onClick={(e) => handleDeleteItem(e, item.type, item.id)}>
                                        <i className="bi bi-trash"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                    {expandedId === item.id && item.type === 'EXPENSE' && (
                        <div className="bg-light p-3 border-top" style={{fontSize: '0.9rem'}}>
                            <h6 className="text-muted text-uppercase small fw-bold mb-2">Split Breakdown</h6>
                            <div className="row g-2">
                                {item.splits.map((split, idx) => (
                                    <div key={idx} className="col-md-6">
                                        <div className="d-flex justify-content-between align-items-center bg-white border rounded px-3 py-2">
                                            <span className="fw-medium">{split.userName}</span>
                                            <span className="text-danger fw-bold">owes ₹{split.amountOwed.toFixed(2)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    </li>
                ))}
                </ul>
            </div>
          )}
        </div>

        {/* ================= RIGHT COLUMN ================= */}
        <div className="col-lg-4 mt-4 mt-lg-0">
          
          {/* MEMBERS CARD */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
                <span className="fw-bold"><i className="bi bi-people me-2"></i>Members</span>
                {/* Only Show "Add Member" if I am still a member */}
                {isMember && (
                    <button className="btn btn-sm btn-light text-primary border" onClick={() => setShowAddMember(!showAddMember)}>
                        {showAddMember ? 'Cancel' : '+ Add'}
                    </button>
                )}
            </div>
            
            {showAddMember && isMember && (
                <div className="p-3 bg-light border-bottom">
                    <input type="text" className="form-control" placeholder="Search Name or Mobile..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} autoFocus />
                    {searchResults.length > 0 && (
                        <div className="list-group mt-2 shadow-sm">
                            {searchResults.map(u => (
                                <button key={u.id} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center" onClick={() => handleAddMember(u.id)}>
                                    <div><div className="fw-bold">{u.name}</div><small className="text-muted">{u.mobileNumber}</small></div>
                                    <i className="bi bi-plus-circle-fill text-primary"></i>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            <ul className="list-group list-group-flush">
                {sortedMembers.map(m => {
                    const isAdmin = group.createdByUserId == currentUser.id;
                    const isNotMe = m.id != currentUser.id;
                    return (
                    <li key={m.id} className="list-group-item d-flex justify-content-between align-items-center py-3">
                        <div className="d-flex align-items-center">
                            <div className="bg-primary-subtle text-primary rounded-circle me-3 fw-bold" style={{width:35, height:35, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                {m.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <div className="fw-bold text-dark">{m.id == currentUser.id ? 'You' : m.name}
                                    {m.id == group.createdByUserId && <span className="badge bg-warning text-dark ms-2" style={{fontSize: '0.65rem'}}>ADMIN</span>}
                                </div>
                                <div className="text-muted small">{m.email}</div>
                            </div>
                        </div>
                        {isAdmin && isNotMe && isMember && (
                            <button className="btn btn-outline-danger btn-sm px-3 shadow-sm py-0" title="Remove User" onClick={() => handleRemoveMember(m.id)} style={{fontSize: '0.75rem', fontWeight: 'bold'}}>Remove</button>
                        )}
                    </li>
                    );
                })}
            </ul>
          </div>

          {/* NET BALANCES CARD */}
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3 fw-bold"><i className="bi bi-pie-chart me-2"></i>Net Balances</div>
            <div className="card-body p-0">
              <ul className="list-group list-group-flush">
                {balances.balances.map((user) => (
                  <li key={user.userId} className={`list-group-item d-flex justify-content-between align-items-center py-3 ${user.userId === currentUser.id ? 'bg-primary-subtle border-start border-4 border-primary' : ''}`}>
                      <span className="fw-medium">{user.userId === currentUser.id ? 'You' : user.name}</span>
                      <span className={`fw-bold ${user.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                          {user.amount >= 0 ? `+₹${user.amount.toFixed(2)}` : `₹${user.amount.toFixed(2)}`}
                      </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

        </div>
      </div>

      {/* ================== SETTLEMENT PLAN MODAL ================== */}
      {showPlanModal && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-info-subtle border-0">
                <h5 className="modal-title fw-bold text-dark">
                    <i className="bi bi-diagram-3 me-2"></i>Settlement Plan
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowPlanModal(false)}></button>
              </div>
              <div className="modal-body p-0">
                 {balances.simplifiedDebts.length === 0 ? (
                     <div className="text-center p-5 text-muted">
                         <h4>🎉</h4>
                         <p>Everyone is settled up!</p>
                     </div>
                 ) : (
                    <ul className="list-group list-group-flush">
                        {balances.simplifiedDebts.map((debt, idx) => (
                            <li key={idx} className="list-group-item py-4">
                                <div className="d-flex align-items-center justify-content-between">
                                    {/* Payer */}
                                    <div className="d-flex align-items-center text-start" style={{width: '35%'}}>
                                        <div className="bg-danger-subtle text-danger rounded-circle p-1 me-2 small fw-bold flex-shrink-0" style={{width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                            {debt.fromUser.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="fw-bold text-truncate">{debt.fromUser}</span>
                                    </div>

                                    {/* Arrow & Amount */}
                                    <div className="text-center px-2 flex-grow-1">
                                        <div className="text-muted small fw-bold" style={{fontSize: '0.65rem', letterSpacing:'1px'}}>PAYS</div>
                                        <div className="fw-bold fs-5 text-dark my-1">₹{debt.amount}</div>
                                        <i className="bi bi-arrow-right text-muted"></i>
                                    </div>

                                    {/* Receiver */}
                                    <div className="d-flex align-items-center justify-content-end text-end" style={{width: '35%'}}>
                                        <span className="fw-bold text-truncate me-2">{debt.toUser}</span>
                                        <div className="bg-success-subtle text-success rounded-circle p-1 small fw-bold flex-shrink-0" style={{width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center'}}>
                                            {debt.toUser.charAt(0).toUpperCase()}
                                        </div>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                 )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default GroupView;