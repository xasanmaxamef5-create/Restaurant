import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Orders from './Orders';
import Salary from './Salary';
import Expenses from './Expenses';
import Login from './Login';
import Register from './Register';
import { getFoodImage } from './foodImages';
import './App.css';

const API_BASE_URL = 'http://localhost:5000';

function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showOrders, setShowOrders] = useState(false);
  const [showSalary, setShowSalary] = useState(false);
  const [showExpenses, setShowExpenses] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=300&h=300&fit=crop'
  });
  
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [showLogin, setShowLogin] = useState(true);

  // Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (user) {
      setCurrentUser(JSON.parse(user));
      setIsAuthenticated(true);
    }
  }, []);

  // Fetch menu
  const fetchMenu = () => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/menu`)
      .then(response => {
        setMenuItems(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching menu:', error);
        setError('Failed to load menu. Make sure backend is running.');
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  // Auth functions
  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const switchToRegister = () => setShowLogin(false);
  const switchToLogin = () => setShowLogin(true);

  // Show Login/Register if not authenticated
  if (!isAuthenticated) {
    return (
      <div>
        {showLogin ? (
          <Login onLogin={handleLogin} switchToRegister={switchToRegister} />
        ) : (
          <Register onRegister={handleLogin} switchToLogin={switchToLogin} />
        )}
      </div>
    );
  }

  // Add new item
  const addNewItem = () => {
    if (!newItem.name || !newItem.price) {
      alert('Please enter item name and price!');
      return;
    }

    const newMenuItem = {
      id: menuItems.length > 0 ? Math.max(...menuItems.map(i => i.id)) + 1 : 1,
      name: newItem.name,
      price: parseFloat(newItem.price),
      image: newItem.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=300&fit=crop'
    };

    setMenuItems([...menuItems, newMenuItem]);
    setNewItem({ name: '', price: '', image: 'https://images.unsplash.com/photo-1586201375761-83865001e8ac?w=300&h=300&fit=crop' });
    setShowAddItem(false);
    alert(`✅ "${newItem.name}" added to menu!`);
  };

  // Cart functions
  const addToCart = (item) => {
    setCart([...cart, item]);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const totalPrice = cart.reduce((sum, item) => sum + item.price, 0);

  const placeOrder = () => {
    if (cart.length === 0) {
      alert('Cart-kaaga waa maran!');
      return;
    }

    const orderData = {
      items: cart,
      total: totalPrice
    };

    axios.post(`${API_BASE_URL}/api/orders`, orderData)
      .then(response => {
        alert(`✅ Order #${response.data.id} placed! Total: $${response.data.total.toFixed(2)}`);
        setCart([]);
      })
      .catch(error => {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
      });
  };

  // Orders Page
  if (showOrders) {
    return (
      <div>
        <div style={{ padding: '1rem 2rem', background: '#FFF8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E8DDD2' }}>
          <button onClick={() => setShowOrders(false)} className="btn btn-primary">← Back to Menu</button>
          <h2 style={{ color: '#E53935' }}>📋 Orders</h2>
          <button onClick={handleLogout} className="btn btn-danger" style={{ background: '#E53935', padding: '0.4rem 1rem' }}>Logout</button>
        </div>
        <Orders />
      </div>
    );
  }

  if (showSalary) {
    return (
      <div>
        <div style={{ padding: '1rem 2rem', background: '#FFF8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E8DDD2' }}>
          <button onClick={() => setShowSalary(false)} className="btn btn-primary">← Back to Menu</button>
          <h2 style={{ color: '#E53935' }}>💰 Mushaar</h2>
          <button onClick={handleLogout} className="btn btn-danger" style={{ background: '#E53935', padding: '0.4rem 1rem' }}>Logout</button>
        </div>
        <Salary />
      </div>
    );
  }

  if (showExpenses) {
    return (
      <div>
        <div style={{ padding: '1rem 2rem', background: '#FFF8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E8DDD2' }}>
          <button onClick={() => setShowExpenses(false)} className="btn btn-primary">← Back to Menu</button>
          <h2 style={{ color: '#E53935' }}>💰 Kharashaadka</h2>
          <button onClick={handleLogout} className="btn btn-danger" style={{ background: '#E53935', padding: '0.4rem 1rem' }}>Logout</button>
        </div>
        <Expenses />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="App">
        <header className="App-header" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
          <h1 style={{ color: '#E53935' }}>🍔 Friends Fast Food</h1>
          <p style={{ color: '#6B5344' }}>Loading menu...</p>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="App">
        <header className="App-header">
          <h1 style={{ color: '#E53935' }}>🍔 Friends Fast Food</h1>
          <p style={{ color: '#D94A4A' }}>{error}</p>
          <p style={{ color: '#6B5344' }}>Make sure server is running: <code style={{ background: '#F0EAE3', padding: '0.2rem 0.5rem', borderRadius: '4px' }}>node server.js</code></p>
        </header>
      </div>
    );
  }

  return (
    <div className="App">
      <header className="App-header">
        <div className="top-bar">
          <div className="brand">
            <span className="emoji">🍔</span>
            <div>
              <h1>Friends Fast Food</h1>
              <p className="subtitle">Fast · Fresh · Somali taste</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#6B5344', fontSize: '0.85rem' }}>👋 {currentUser?.name}</span>
            <button onClick={() => setShowOrders(true)} className="btn btn-orange">📋 Orders</button>
            <button onClick={() => setShowSalary(true)} className="btn btn-primary" style={{ background: '#4CAF50' }}>💰 Salary</button>
            <button onClick={() => setShowExpenses(true)} className="btn btn-primary" style={{ background: '#E07C3C' }}>💳 Expenses</button>
            <button onClick={handleLogout} className="btn btn-danger" style={{ background: '#E53935', padding: '0.4rem 1rem' }}>Logout</button>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={() => setShowAddItem(!showAddItem)} className="btn btn-primary" style={{ background: '#E53935' }}>
            {showAddItem ? '✖ Cancel' : '➕ Add New Item'}
          </button>
        </div>

        {showAddItem && (
          <div className="add-item-form">
            <h3>📝 Add New Menu Item</h3>
            <div className="form-row">
              <input type="text" placeholder="Item Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              <input type="number" placeholder="Price ($)" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} step="0.01" />
            </div>
            <div className="form-row">
              <input type="text" placeholder="Image URL (optional)" value={newItem.image} onChange={(e) => setNewItem({ ...newItem, image: e.target.value })} />
              <button onClick={addNewItem} className="save-btn">💾 Add to Menu</button>
            </div>
          </div>
        )}

        <div className="menu-section">
          <div className="section-title">
            📋 Menu
            <span>{menuItems.length} items</span>
          </div>

          <div className="menu-grid">
            {menuItems.map((item) => (
              <div key={item.id} className="menu-card">
                <div className="card-image">
                  <img src={getFoodImage(item.name)} alt={item.name} loading="lazy" />
                </div>
                <div className="card-info">
                  <h3>{item.name}</h3>
                  <p className="price">${item.price.toFixed(2)}</p>
                </div>
                <button onClick={() => addToCart(item)} className="add-btn">➕ Add</button>
              </div>
            ))}
          </div>
        </div>

        <div className="cart-section">
          <div className="cart-header">
            <h2>🛒 Cart</h2>
            <span className="cart-badge">{cart.length} items</span>
          </div>

          {cart.length === 0 ? (
            <div className="empty-cart">
              <p>Cart-kaaga waa maran</p>
              <p style={{ fontSize: '0.8rem', marginTop: '0.3rem' }}>Add items from the menu ✨</p>
            </div>
          ) : (
            <>
              {cart.map((item, index) => (
                <div key={index} className="cart-item">
                  <div className="cart-item-info">
                    <img src={getFoodImage(item.name)} alt={item.name} className="cart-item-image" />
                    <span className="item-name">{item.name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                    <span className="cart-item-price">${item.price.toFixed(2)}</span>
                    <button onClick={() => removeFromCart(index)} className="btn btn-danger">✕</button>
                  </div>
                </div>
              ))}
              <div className="cart-total">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <button onClick={placeOrder} className="btn btn-green" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }}>
                📦 Place Order
              </button>
            </>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
