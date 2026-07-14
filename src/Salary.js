import React, { useState } from 'react';
import './Salary.css';

function Salary() {
  const [employees, setEmployees] = useState([
    { id: 1, name: 'Ahmed Ali', role: 'Cook', salary: 500, hours: 40, bonus: 0 },
    { id: 2, name: 'Fatima Hassan', role: 'Cashier', salary: 300, hours: 35, bonus: 20 },
    { id: 3, name: 'Omar Abdirahman', role: 'Waiter', salary: 250, hours: 30, bonus: 10 },
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ name: '', role: '', salary: 0, hours: 0, bonus: 0 });

  const calculateTotalSalary = (hours, salary, bonus) => {
    const hourlyRate = salary / 160;
    return (hours * hourlyRate) + bonus;
  };

  const addEmployee = () => {
    if (newEmployee.name && newEmployee.role) {
      setEmployees([...employees, { ...newEmployee, id: employees.length + 1 }]);
      setNewEmployee({ name: '', role: '', salary: 0, hours: 0, bonus: 0 });
      setShowAddForm(false);
    }
  };

  const deleteEmployee = (id) => {
    setEmployees(employees.filter(emp => emp.id !== id));
  };

  const totalPayroll = employees.reduce((sum, emp) => {
    return sum + calculateTotalSalary(emp.hours, emp.salary, emp.bonus);
  }, 0);

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
            <input type="text" placeholder="Full Name" value={newEmployee.name} onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })} />
            <input type="text" placeholder="Role (e.g. Cook, Waiter)" value={newEmployee.role} onChange={(e) => setNewEmployee({ ...newEmployee, role: e.target.value })} />
          </div>
          <div className="form-row">
            <input type="number" placeholder="Monthly Salary" value={newEmployee.salary || ''} onChange={(e) => setNewEmployee({ ...newEmployee, salary: Number(e.target.value) })} />
            <input type="number" placeholder="Hours Worked" value={newEmployee.hours || ''} onChange={(e) => setNewEmployee({ ...newEmployee, hours: Number(e.target.value) })} />
            <input type="number" placeholder="Bonus" value={newEmployee.bonus || ''} onChange={(e) => setNewEmployee({ ...newEmployee, bonus: Number(e.target.value) })} />
          </div>
          <button className="save-btn" onClick={addEmployee}>💾 Save Employee</button>
        </div>
      )}

      <div className="employees-table-wrapper">
        <table className="employees-table">
          <thead>
            <tr><th>#</th><th>Name</th><th>Role</th><th>Monthly Salary</th><th>Hours</th><th>Bonus</th><th>Total Salary</th><th>Action</th></tr>
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
                  <td><button className="delete-btn" onClick={() => deleteEmployee(emp.id)}>🗑️</button></td>
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
