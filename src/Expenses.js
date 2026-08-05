import React, { useState, useEffect } from 'react';
import { exportPDF } from './PDFExport';
import { exportToExcel } from './ExcelExport';
import api from './api'; // Import the centralized api instance
import './Expenses.css';

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newExpense, setNewExpense] = useState({
    name: '',
    category: 'Food',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    type: 'cash'
  });
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');

  const categories = ['Food', 'Utilities', 'Kitchen', 'Cleaning', 'Staff', 'Other'];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    setLoading(true);
    setError(null);
    api.get('/api/admin/expenses') // Use admin route to ensure token is used
      .then(response => {
        setExpenses(response.data.expenses || []);
      })
      .catch(err => {
      console.error('Error fetching expenses:', err);
        setError('Failed to load expenses. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  const addExpense = async () => {
    if (!newExpense.name || newExpense.amount <= 0) {
      alert('Please enter expense name and amount!');
      return;
    }

    try {
      const response = await api.post('/api/admin/expenses', newExpense);
      setExpenses([...expenses, response.data.expense]);
      setNewExpense({ name: '', category: 'Food', amount: 0, date: new Date().toISOString().split('T')[0], type: 'cash' });
      setShowAddForm(false);
      alert('Expense added successfully!');
    } catch (err) {
      console.error('Error adding expense:', err);
      if (err.response?.status === 401 || err.response?.status === 403) {
        alert('Permission denied. Please log in again.');
      } else {
        alert('Failed to add expense. Please try again.');
      }
    }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    try {
      await api.delete(`/api/admin/expenses/${id}`);
      setExpenses(expenses.filter(exp => (exp._id || exp.id) !== id));
    } catch (err) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense');
    }
  };

  const filteredExpenses = expenses.filter(exp => {
    const typeMatch = filterType === 'all' || exp.type === filterType;
    const categoryMatch = filterCategory === 'all' || exp.category === filterCategory;
    return typeMatch && categoryMatch;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalDeyn = filteredExpenses.filter(e => e.type === 'deyn').reduce((sum, e) => sum + e.amount, 0);
  const totalCash = filteredExpenses.filter(e => e.type === 'cash').reduce((sum, e) => sum + e.amount, 0);

  const handleExportPDF = () => {
    exportPDF('expenses-content', `Expenses_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredExpenses.map(exp => ({
      'Name': exp.name,
      'Category': exp.category,
      'Amount': exp.amount,
      'Date': new Date(exp.date).toLocaleDateString(),
      'Type': exp.type
    }));
    exportToExcel(dataToExport, `Expenses_${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) return <div className="loading">Loading expenses...</div>;
  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        {error.includes('login') && (
          <button onClick={() => window.location.href = '/login'} className="login-btn">
            Go to Login
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="expenses-container">
      <div id="expenses-content">
        <div className="expenses-header">
          <h2>💰 Kharashaadka Maqaayada</h2>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button onClick={handleExportPDF} className="pdf-btn">📄 Export PDF</button>
            <button onClick={handleExportExcel} className="excel-btn">📊 Export Excel</button>
            <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? '✖ Cancel' : '➕ Add Expense'}
            </button>
          </div>
        </div>

        <div className="expenses-summary">
          <div className="summary-card">
            <span>Total Expenses</span>
            <h3>${totalExpenses.toFixed(2)}</h3>
          </div>
          <div className="summary-card deyn">
            <span>Deyn (Amaah)</span>
            <h3>${totalDeyn.toFixed(2)}</h3>
          </div>
          <div className="summary-card cash">
            <span>Cash (La bixiyay)</span>
            <h3>${totalCash.toFixed(2)}</h3>
          </div>
        </div>

        <div className="filter-container">
          <div className="filter-group">
            <label>Type:</label>
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
              <option value="all">All</option>
              <option value="deyn">Deyn (Amaah)</option>
              <option value="cash">Cash (La bixiyay)</option>
            </select>
          </div>
          <div className="filter-group">
            <label>Category:</label>
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="all">All Categories</option>
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>

        {showAddForm && (
          <div className="add-expense-form">
            <h3>Add New Expense</h3>
            <div className="form-row">
              <input type="text" placeholder="Expense Name" value={newExpense.name} onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })} />
              <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="form-row">
              <input type="number" placeholder="Amount ($)" value={newExpense.amount || ''} onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })} />
              <input type="date" value={newExpense.date} onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })} />
              <select value={newExpense.type} onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}>
                <option value="cash">Cash (La bixiyay)</option>
                <option value="deyn">Deyn (Amaah)</option>
              </select>
            </div>
            <button className="save-btn" onClick={addExpense}>💾 Save Expense</button>
          </div>
        )}

        <div className="expenses-table-wrapper">
          <table className="expenses-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Type</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: '#7a5e46' }}>
                    No expenses found
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((exp, index) => (
                  <tr key={exp._id || exp.id}>
                    <td>{index + 1}</td>
                    <td><strong>{exp.name}</strong></td>
                    <td><span className="category-badge">{exp.category}</span></td>
                    <td>${exp.amount.toFixed(2)}</td>
                    <td>{exp.date}</td>
                    <td>
                      <span className={`type-badge ${exp.type}`}>
                        {exp.type === 'deyn' ? '💳 Deyn' : '💵 Cash'}
                      </span>
                    </td>
                    <td>
                      <button className="delete-btn" onClick={() => deleteExpense(exp._id || exp.id)}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Expenses;
