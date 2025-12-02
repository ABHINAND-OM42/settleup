import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

import Login from './features/auth/Login';
import Register from './features/auth/Register';
import ForgotPassword from './features/auth/ForgotPassword';
import AccountSettings from './features/auth/AccountSettings';
import Dashboard from './features/dashboard/Dashboard';
import CreateGroup from './features/groups/CreateGroup';
import GroupView from './features/groups/GroupView';

// 1. IMPORT NEW FILES
import AddExpense from './features/expenses/AddExpense';
import Settlement from './features/expenses/Settlement';

const PrivateRoute = ({ children }) => {
  const user = localStorage.getItem('user');
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <div className="container mt-4">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/groups/create" element={<PrivateRoute><CreateGroup /></PrivateRoute>} />
          <Route path="/groups/:groupId" element={<PrivateRoute><GroupView /></PrivateRoute>} />


          {/* 2. ADD THESE TWO NEW ROUTES */}
          
          {/* Add Expense Route */}
          <Route path="/groups/:groupId/add-expense" element={
            <PrivateRoute><AddExpense /></PrivateRoute>
          } />

          {/* Settle Up Route */}
          <Route path="/groups/:groupId/settle" element={
            <PrivateRoute><Settlement /></PrivateRoute>
          } />


<Route path="/settings" element={
            <PrivateRoute><AccountSettings /></PrivateRoute>
          } />


          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </BrowserRouter>
  );
}

export default App;