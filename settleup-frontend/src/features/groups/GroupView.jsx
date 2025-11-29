import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { toast } from 'react-toastify';

const GroupView = () => {
  const { groupId } = useParams();
  const currentUser = JSON.parse(localStorage.getItem('user'));

  const [group, setGroup] = useState(null);
  const [history, setHistory] = useState([]);
  const [balances, setBalances] = useState({ balances: [], simplifiedDebts: [] });
  const [loading, setLoading] = useState(true);

  // State to track which expense is currently "Expanded" (showing details)
  const [expandedId, setExpandedId] = useState(null);

  // Personalization States
  const [myBalance, setMyBalance] = useState(0);
  const [iOwe, setIOwe] = useState([]);      
  const [owedToMe, setOwedToMe] = useState([]); 

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

      // Personalization Logic
      if (currentUser && balanceData) {
        const myEntry = balanceData.balances.find(b => b.userId === currentUser.id);
        const myName = myEntry ? myEntry.name : currentUser.name;
        setMyBalance(myEntry ? myEntry.amount : 0);
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

  // Toggle detail view
  const toggleExpand = (id) => {
    if (expandedId === id) setExpandedId(null); // Close if open
    else setExpandedId(id); // Open new
  };

  if (loading) return <div className="text-center mt-5">Loading Group...</div>;

  return (
    <div className="container pb-5">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4 p-4 bg-white shadow-sm rounded border">
        <div>
          <h2 className="mb-0 fw-bold">{group?.name}</h2>
          <p className="text-muted mb-0">{group?.description}</p>
        </div>
        <div>
          <Link to={`/groups/${groupId}/add-expense`} className="btn btn-danger me-2">Add Expense</Link>
          <Link to={`/groups/${groupId}/settle`} className="btn btn-success">Settle Up</Link>
        </div>
      </div>

      <div className="row">
        
        {/* LEFT COLUMN: Activity */}
        <div className="col-md-8">
          
          {/* Personal Dashboard Alert (Same as before) */}
          <div className={`alert ${myBalance >= 0 ? 'alert-success' : 'alert-danger'} shadow-sm mb-4`}>
            <h4 className="alert-heading fw-bold">
              {myBalance >= 0 ? `You are owed $${myBalance}` : `You owe $${Math.abs(myBalance)}`}
            </h4>
            <hr />
            <div className="row">
               {/* ... (Keep existing Pay/Receive lists) ... */}
               <div className="col-md-6 border-end">
                  <h6 className="fw-bold text-danger">You need to pay:</h6>
                  {iOwe.length === 0 ? <small className="text-muted">Nothing!</small> : (
                    <ul className="list-unstyled mb-0">
                      {iOwe.map((debt, idx) => <li key={idx} className="mb-1">Pay <strong>{debt.toUser}</strong> ${debt.amount}</li>)}
                    </ul>
                  )}
               </div>
               <div className="col-md-6 ps-md-4">
                  <h6 className="fw-bold text-success">Owed to you:</h6>
                  {owedToMe.length === 0 ? <small className="text-muted">Nothing!</small> : (
                    <ul className="list-unstyled mb-0">
                      {owedToMe.map((debt, idx) => <li key={idx} className="mb-1"><strong>{debt.fromUser}</strong> owes ${debt.amount}</li>)}
                    </ul>
                  )}
               </div>
            </div>
          </div>

          <h4 className="mb-3">Activity</h4>
          {history.length === 0 ? (
            <div className="alert alert-secondary text-center p-4">No expenses yet.</div>
          ) : (
            <div className="list-group shadow-sm">
              {history.map((item) => (
                <div key={`${item.type}-${item.id}`} className="list-group-item p-0" style={{cursor: 'pointer'}} onClick={() => toggleExpand(item.id)}>
                  
                  {/* MAIN ROW (Always Visible) */}
                  <div className="d-flex justify-content-between align-items-center p-3">
                    <div className="d-flex align-items-center">
                      <div className={`rounded-circle p-2 me-3 text-white ${item.type === 'SETTLEMENT' ? 'bg-success' : 'bg-primary'}`} 
                           style={{width: '45px', height: '45px', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
                           {item.type === 'SETTLEMENT' ? '$' : 'Exp'}
                      </div>
                      <div>
                        <h5 className="mb-0">{item.description}</h5>
                        <small className="text-muted">
                          {item.paidByUserName} paid ${item.amount}
                        </small>
                      </div>
                    </div>
                    <div className="text-end">
                       <div className={`fs-5 fw-bold ${item.type === 'SETTLEMENT' ? 'text-success' : 'text-dark'}`}>
                         {item.type === 'SETTLEMENT' ? 'PAYMENT' : `$${item.amount}`}
                       </div>
                       {item.type !== 'SETTLEMENT' && <small className="text-muted" style={{fontSize: '0.8rem'}}>Click for details ▼</small>}
                    </div>
                  </div>

                  {/* EXPANDED DETAILS (Only if clicked) */}
                  {expandedId === item.id && item.type === 'EXPENSE' && (
                    <div className="bg-light border-top p-3">
                       <h6 className="fw-bold text-muted small text-uppercase">Who owes what?</h6>
                       <ul className="list-group list-group-flush bg-transparent">
                          {item.splits.map((split, idx) => (
                             <li key={idx} className="list-group-item bg-transparent d-flex justify-content-between py-1 px-0">
                                <span>{split.userName}</span>
                                <span className="fw-bold text-danger">owes ${split.amountOwed}</span>
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

        {/* RIGHT COLUMN: Full Overview (Same as before) */}
        <div className="col-md-4">
             {/* ... (Keep existing Full Group Overview code) ... */}
             <div className="card shadow-sm mb-4">
                <div className="card-header bg-light fw-bold text-muted">Full Group Overview</div>
                <div className="card-body p-0">
                  <ul className="list-group list-group-flush">
                    {balances.balances.map((user) => (
                      <li key={user.userId} className={`list-group-item d-flex justify-content-between ${user.userId === currentUser.id ? 'bg-light border-start border-4 border-primary' : ''}`}>
                          <span>{user.userId === currentUser.id ? <strong>You</strong> : user.name}</span>
                          <span className={`fw-bold ${user.amount >= 0 ? 'text-success' : 'text-danger'}`}>
                              {user.amount >= 0 ? `+${user.amount}` : `${user.amount}`}
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