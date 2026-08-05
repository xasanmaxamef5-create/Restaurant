import React, { useState, useEffect } from 'react';
import { exportPDF } from './PDFExport';
import { exportToExcel } from './ExcelExport';
import api from './api'; // Import the centralized api instance
import './Salary.css';

function Salary() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ 
    name: '', 
    role: '', 
    salary: 0, 
    advance: 0 
  });
  const [editingEmployee, setEditingEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
  }, []); // This should only run once on component mount

  const fetchEmployees = async () => {
    setLoading(true);
    setError(null);
    api.get('/api/salary')
      .then(response => {
        // Ensure that we always set an array to the state
        setEmployees(Array.isArray(response.data) ? response.data : []);
      })
      .catch(err => {
      console.error('Error fetching employees:', err);
        setError('Failed to load employees. Please try again.');
      })
      .finally(() => setLoading(false));
  };

  const calculateNetSalary = (salary, advance) => {
    return (salary || 0) - (advance || 0);
  };

  const addEmployee = async () => {
    if (!newEmployee.name || !newEmployee.role) {
      alert('Please fill all fields!');
      return;
    }

    try {
      // Use the global api instance which includes the auth token
      const response = await api.post(
        '/api/admin/salary', 
        newEmployee
      );
      
      // Only add the new employee if the API call was successful and returned an employee
      if (response.data.success && response.data.employee) {
        setEmployees(prevEmployees => [...prevEmployees, response.data.employee]);
      }

      setNewEmployee({ name: '', role: '', salary: 0, advance: 0 });
      setShowAddForm(false);
      alert('Employee added successfully!');
    } catch (err) {
      console.error('Error adding employee:', err);
      
      if (err.response?.status === 401) {
        alert('Session expired. Please login again.');
        // Optional: Redirect to login page
        // window.location.href = '/login';
      } else if (err.response?.status === 403) {
        alert('Permission denied to add employees. Please log in again.');
      } else {
        alert('Failed to add employee. Please try again.');
      }
    }
  };

  const handleEdit = (employee) => {
    setEditingEmployee({ ...employee });
  };

  const handleCancelEdit = () => {
    setEditingEmployee(null);
  };

  const handleUpdate = async () => {
    if (!editingEmployee) return;
    try {
      const { _id, ...updateData } = editingEmployee;
      const response = await api.put(`/api/admin/salary/${_id}`, updateData);
      setEmployees(employees.map(emp => (emp._id === _id ? response.data.employee : emp)));
      setEditingEmployee(null);
      alert('Employee updated successfully!');
    } catch (err) {
      console.error('Error updating employee:', err);
      if (err.response?.status === 401) {
        alert('Session expired. Please login again.');
      } else if (err.response?.status === 404) {
        alert('Employee not found. It may have been deleted by another user.');
        fetchEmployees(); // Refresh list
      } else {
        alert('Failed to update employee.');
      }
    }
  };

  const deleteEmployee = async (id) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    
    try {
      // Use the global api instance which includes the auth token
      await api.delete(
        `/api/admin/salary/${id}`
      );
      
      setEmployees(prevEmployees => prevEmployees.filter(emp => (emp._id || emp.id) !== id));
      alert('Employee deleted successfully!');
    } catch (err) {
      console.error('Error deleting employee:', err);
      
      if (err.response?.status === 401) {
        alert('Session expired. Please login again.');
      } else {
        alert('Failed to delete employee');
      }
    }
  };

  const handleExportPDF = () => {
    exportPDF('salary-content', 'Salary_' + new Date().toISOString().split('T')[0]);
  };

  const handleExportExcel = () => {
    const dataToExport = employees.map(emp => ({
      'Name': emp.name,
      'Role': emp.role,
      'Monthly Salary': emp.salary || 0,
      'Advance (Hormaris)': emp.advance || 0,
      'Net Salary': calculateNetSalary(emp.salary, emp.advance)
    }));
    exportToExcel(dataToExport, 'Salary_' + new Date().toISOString().split('T')[0]);
  };

  if (loading) return <div className="loading">Loading employees...</div>;
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error">{error}</div>
        {error.includes('login') && (
          <button onClick={() => window.location.href = '/login'} className="login-btn">
            Go to Login
          </button>
        )}
        <button onClick={fetchEmployees} className="retry-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="salary-container">
      <div id="salary-content">
        <div className="salary-header">
          <h2>💰 Mushaar Shaqaalaha</h2>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button onClick={handleExportPDF} className="pdf-btn">📄 Export PDF</button>
            <button onClick={handleExportExcel} className="excel-btn">📊 Export Excel</button>
            <button className="add-btn" onClick={() => setShowAddForm(!showAddForm)}>
              {showAddForm ? '✖ Cancel' : '➕ Add Employee'}
            </button>
          </div>
        </div>

        <div className="payroll-summary">
          <div className="summary-card">
            <span>Total Employees</span>
            <h3>{employees.length}</h3>
          </div>
          <div className="summary-card">
            <span>Total Payroll</span>
            <h3>${employees.reduce((sum, emp) => sum + (emp.salary || 0), 0).toFixed(2)}</h3>
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
                placeholder="Role" 
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
                placeholder="Advance (Lacag Hormaris)"
                value={newEmployee.advance || ''}
                onChange={(e) => setNewEmployee({ ...newEmployee, advance: Number(e.target.value) })}
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
                <th>Advance (Hormaris)</th>
                <th>Net Salary</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((emp, index) => {
                const isEditing = editingEmployee?._id === emp._id;
                if (isEditing) {
                  return (
                    <tr key={emp._id} className="editing-row">
                      <td>{index + 1}</td>
                      <td><input type="text" value={editingEmployee.name} onChange={(e) => setEditingEmployee({...editingEmployee, name: e.target.value})} /></td>
                      <td><input type="text" value={editingEmployee.role} onChange={(e) => setEditingEmployee({...editingEmployee, role: e.target.value})} /></td>
                      <td><input type="number" value={editingEmployee.salary} onChange={(e) => setEditingEmployee({...editingEmployee, salary: Number(e.target.value)})} /></td>
                      <td><input type="number" value={editingEmployee.advance} onChange={(e) => setEditingEmployee({...editingEmployee, advance: Number(e.target.value)})} /></td>
                      <td><span className="total-salary">${calculateNetSalary(editingEmployee.salary, editingEmployee.advance).toFixed(2)}</span></td>
                      <td className="action-buttons">
                        <button className="save-btn" onClick={handleUpdate}>💾</button>
                        <button className="cancel-btn" onClick={handleCancelEdit}>✖️</button>
                      </td>
                    </tr>
                  );
                } else {
                  const netSalary = calculateNetSalary(emp.salary, emp.advance);
                  return (
                    <tr key={emp._id || emp.id || index}>
                      <td>{index + 1}</td>
                      <td><strong>{emp.name}</strong></td>
                      <td>{emp.role}</td>
                      <td>${(emp.salary || 0).toFixed(2)}</td>
                      <td>${(emp.advance || 0).toFixed(2)}</td>
                      <td><span className="total-salary">${netSalary.toFixed(2)}</span></td>
                      <td className="action-buttons">
                        <button 
                          className="edit-btn"
                          onClick={() => handleEdit(emp)}
                        >
                          ✏️
                        </button>
                        <button 
                          className="delete-btn" 
                          onClick={() => deleteEmployee(emp._id || emp.id)}
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  );
                }
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Salary;