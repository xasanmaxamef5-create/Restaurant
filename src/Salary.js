import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Salary.css';

const API_BASE_URL = 'https://restu-production.up.railway.app';

function Salary() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', salary: 0, hours: 0, bonus: 0 });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/salary`);
      setEmployees(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching employees:', err);
      setError('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalSalary = (hours, salary, bonus) => {
    const hourlyRate = salary / 160;
    return (hours * hourlyRate) + bonus;
  };

  const addEmployee = async () => {
    if (!newEmployee.name || !newEmployee.role) {
      alert('Please fill all fields!');
      return;
    }

    try {
      const response = await axios.post(`${API_BASE_URL}/api/salary`, newEmployee);
      setEmployees([...employees, response.data]);
      setNewEmployee({ name: '', role: '', salary: 0, hours: 0, bonus: 0 });
      setShowAddForm(false);
    } catch (err) {
      console.error('Error adding employee:', err);
      alert('Failed to add employee');
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;

    try {
      await axios.delete(`${API_BASE_URL}/api/salary/${id}`);
      setEmployees(employees.filter(emp => emp.id !== id));
    } catch (err) {
      console.error('Error deleting employee:', err);
      alert('Failed to delete employee');
    }
  };

  const totalPayroll = employees.reduce((sum, emp) => {
    return sum + calculateTotalSalary(emp.hours, emp.salary, emp.bonus);
  }, 0);

  if (loading) return <div className="loading">Loading employees...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="salary-container">
      <div className="salary-header">
        <h2>💰 Mushaar Shaqaalaha</h2>
        <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
          {showAddForm ? '✖ Cancel' : '➕ Add Employee'}
        </button>
      </div>

      <div className="payroll-summary">
        <div className="summary-card">
          <span>Total Employees</span>
          <h3>{employees.length}</h3>
        </div>
        <div className="summary-card">
          <span>Total Payroll</span>
          <h3>${totalPayroll.toFixed(2)}</h3>
        </div>
      </div>

      {showAddForm && (
        <div className="add-employee-form">
          <h3>Add New Employee</h3>
          <div className="form-row">
            <input
              type="text"
              placeholder="Full Name"
              value={newEmployee.name}
              onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="Role (e.g. Cook, Waiter)"
              value={newEmployee.role}
              onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })}
            />
          </div>
          <div className="form-row">
            <input
              type="number"
              placeholder="Monthly Salary"
              value={newEmployee.salary || ''}
              onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Hours Worked"
              value={newEmployee.hours || ''}
              onChange={(e) => setNewEmployee({ ...newEmployee, hours: Number(e.target.value) })}
            />
            <input
              type="number"
              placeholder="Bonus"
              value={newEmployee.bonus || ''}
              onChange={(e) => setNewEmployee({ ...newEmployee, bonus: Number(e.target.value) })}
            />
          </div>
          <button className="save-btn" onClick={addEmployee}>💾 Save Employee</button>
        </div>
      )}

      <div className="employees-table-wrapper">
        <table className="employees-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Role</th>
              <th>Monthly Salary</th>
              <th>Hours</th>
              <th>Bonus</th>
              <th>Total Salary</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp, index) => {
              const total = calculateTotalSalary(emp.hours, emp.salary, emp.bonus);
              return (
                <tr key={emp.id}>
                  <td>{index + 1}</td>
                  <td><strong>{emp.name}</strong></td>
                  <td>{emp.role}</td>
                  <td>${emp.salary.toFixed(2)}</td>
                  <td>{emp.hours}h</td>
                  <td>${emp.bonus.toFixed(2)}</td>
                  <td><span className="total-salary">${total.toFixed(2)}</span></td>
                  <td>
                    <button className="delete-btn" onClick={() => deleteEmployee(emp.id)}>🗑️</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Salary;
