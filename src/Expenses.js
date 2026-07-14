import React, { useState } from 'react';
import './Expenses.css';

function Expenses() {
  const [expenses, setExpenses] = useState([
    { id: 1, name: 'Vegetables', category: 'Food', amount: 150, date: '2026-07-10', type: 'deyn' },
    { id: 2, name: 'Meat', category: 'Food', amount: 300, date: '2026-07-09', type: 'cash' },
    { id: 3, name: 'Electricity Bill', category: 'Utilities', amount: 80, date: '2026-07-08', type: 'deyn' },
    { id: 4, name: 'Water Bill', category: 'Utilities', amount: 40, date: '2026-07-07', type: 'cash' },
    { id: 5, name: 'Oil & Spices', category: 'Kitchen', amount: 120, date: '2026-07-06', type: 'deyn' },
  ]);

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

  const addExpense = () => {
    if (newExpense.name && newExpense.amount > 0) {
      setExpenses([...expenses, { ...newExpense, id: expenses.length + 1 }]);
      setNewExpense({ name: '', category: 'Food', amount: 0, date: new Date().toISOString().split('T')[0], type: 'cash' });
      setShowAddForm(false);
    }
  };

  const deleteExpense = (id) => {
    setExpenses(expenses.filter(exp => exp.id !== id));
  };

  // Filter expenses
  const filteredExpenses = expenses.filter(exp => {
    const typeMatch = filterType === 'all' || exp.type === filterType;
    const categoryMatch = filterCategory === 'all' || exp.category === filterCategory;
    return typeMatch && categoryMatch;
  });

  const totalExpenses = filteredExpenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalDeyn = filteredExpenses.filter(e => e.type === 'deyn').reduce((sum, e) => sum + e.amount, 0);
  const totalCash = filteredExpenses.filter(e => e.type === 'cash').reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="expenses-container">
      <div className="expenses-header">
        <h2>💰 Kharashaadka Maqaayada</h2>
        <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✖ Cancel' : '➕ Add Expense'}
        </button>
      </div>

      {/* Summary Cards */}
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

      {/* Filters */}
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

      {/* Add Form */}
      {showAddForm && (
        <div className="add-expense-form">
          <h3>Add New Expense</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Expense Name"
              value={newExpense.name}
              onChange={(e) => setNewExpense({ ...newExpense, name: e.target.value })}
            />
            <select
              value={newExpense.category}
              onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="form-row">
            <input
              type="number"
              placeholder="Amount ($)"
              value={newExpense.amount || ''}
              onChange={(e) => setNewExpense({ ...newExpense, amount: Number(e.target.value) })}
            />
            <input
              type="date"
              value={newExpense.date}
              onChange={(e) => setNewExpense({ ...newExpense, date: e.target.value })}
            />
            <select
              value={newExpense.type}
              onChange={(e) => setNewExpense({ ...newExpense, type: e.target.value })}
            >
              <option value="cash">Cash (La bixiyay)</option>
              <option value="deyn">Deyn (Amaah)</option>
            </select>
          </div>
          <button className="save-btn" onClick={addExpense}>💾 Save Expense</button>
        </div>
      )}

      {/* Expenses Table */}
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
                <tr key={exp.id}>
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
                    <button className="delete-btn" onClick={() => deleteExpense(exp.id)}>🗑️</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Expenses;
