import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './Orders.css';

// ===== BACKEND URL (Kaliya Localhost) =====
const API_BASE_URL = 'https://restu-production.up.railway.app';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);

  // Fetch menu items for adding new order
  useEffect(() => {
    axios.get(`${API_BASE_URL}/api/menu`)
      .then(response => {
        setMenuItems(response.data);
      })
      .catch(error => {
        console.error('Error fetching menu:', error);
      });
  }, []);

  // Fetch orders
  const fetchOrders = useCallback(() => {
    setLoading(true);
    axios.get(`${API_BASE_URL}/api/orders`)
      .then(res => {
        setOrders(res.data);
        applyFilters(res.data, searchTerm, searchType, dateFilter);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
        setLoading(false);
      });
  }, [searchTerm, searchType, dateFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Apply filters
  const applyFilters = (data, term, type, date) => {
    let filtered = data;
    if (date !== 'all') {
      const now = new Date();
      filtered = filtered.filter(order => {
        const diff = (now - new Date(order.date)) / (1000 * 60 * 60 * 24);
        if (date === 'today') return diff < 1;
        if (date === 'week') return diff < 7;
        if (date === 'month') return diff < 30;
        return true;
      });
    }
    if (term.trim()) {
      filtered = filtered.filter(order => {
        if (type === 'name') {
          return order.items.some(item => 
            item.name.toLowerCase().includes(term.toLowerCase())
          );
        } else {
          return new Date(order.date).toLocaleString().toLowerCase().includes(term.toLowerCase());
        }
      });
    }
    setFilteredOrders(filtered);
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    applyFilters(orders, val, searchType, dateFilter);
  };

  const handleDateChange = (e) => {
    const val = e.target.value;
    setDateFilter(val);
    applyFilters(orders, searchTerm, searchType, val);
  };

  const handleTypeChange = (type) => {
    setSearchType(type);
    setSearchTerm('');
    applyFilters(orders, '', type, dateFilter);
  };

  // Toggle item selection for new order
  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        return prev.filter(i => i.id !== item.id);
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  // Update quantity
  const updateQuantity = (itemId, newQuantity) => {
    setSelectedItems(prev => 
      prev.map(item => 
        item.id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item
      )
    );
  };

  // Place new order
  const placeNewOrder = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item!');
      return;
    }

    const orderItems = selectedItems.map(item => ({
      id: item.id,
      name: item.name,
      price: item.price,
      icon: item.icon,
      quantity: item.quantity || 1
    }));

    // Calculate total with quantities
    const total = orderItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    const orderData = {
      items: orderItems,
      total: total
    };

    axios.post(`${API_BASE_URL}/api/orders`, orderData)
      .then(response => {
        alert(`✅ Order #${response.data.id} placed! Total: $${response.data.total.toFixed(2)}`);
        setSelectedItems([]);
        setShowAddOrder(false);
        fetchOrders();
      })
      .catch(error => {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
      });
  };

  // Update order status
  const updateOrderStatus = (orderId, newStatus) => {
    axios.put(`${API_BASE_URL}/api/orders/${orderId}`, { status: newStatus })
      .then(() => {
        fetchOrders();
      })
      .catch(error => {
        console.error('Error updating order:', error);
        alert('Failed to update order status.');
      });
  };

  // Delete order
  const deleteOrder = (orderId) => {
    if (window.confirm(`Are you sure you want to delete Order #${orderId}?`)) {
      axios.delete(`${API_BASE_URL}/api/orders/${orderId}`)
        .then(() => {
          fetchOrders();
        })
        .catch(error => {
          console.error('Error deleting order:', error);
          alert('Failed to delete order.');
        });
    }
  };

  const getStatusColor = (status) => {
    const map = { 
      pending: '#ff9800', 
      preparing: '#2196F3', 
      ready: '#4CAF50', 
      completed: '#9E9E9E' 
    };
    return map[status] || '#666';
  };

  if (loading) {
    return (
      <div className="orders-container">
        <h2>📋 Orders</h2>
        <p className="loading-text">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container">
        <h2>📋 Orders</h2>
        <p className="error-text">{error}</p>
        <button onClick={fetchOrders} className="refresh-btn">🔄 Retry</button>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div className="orders-header">
        <h2>📋 Orders ({filteredOrders.length})</h2>
        <div style={{ display: 'flex', gap: '0.8rem' }}>
          <button onClick={() => setShowAddOrder(!showAddOrder)} className="add-order-btn">
            {showAddOrder ? '✖ Cancel' : '➕ New Order'}
          </button>
          <button onClick={fetchOrders} className="refresh-btn">🔄 Refresh</button>
        </div>
      </div>

      {/* Add New Order Form */}
      {showAddOrder && (
        <div className="add-order-form">
          <h3>📝 New Order</h3>
          <div className="menu-items-select">
            <p>Select items for the order:</p>
            <div className="item-grid">
              {menuItems.map(item => {
                const selected = selectedItems.find(i => i.id === item.id);
                return (
                  <div 
                    key={item.id} 
                    className={`item-select-card ${selected ? 'selected' : ''}`}
                    onClick={() => toggleItemSelection(item)}
                  >
                    <span className="item-icon">{item.icon}</span>
                    <span className="item-name">{item.name}</span>
                    <span className="item-price">${item.price.toFixed(2)}</span>
                    {selected && (
                      <div className="quantity-control">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, (selected.quantity || 1) - 1);
                          }}
                        >−</button>
                        <span>{selected.quantity || 1}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.id, (selected.quantity || 1) + 1);
                          }}
                        >+</button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="order-summary">
            <h4>Selected Items: {selectedItems.length}</h4>
            <h4>Total: ${selectedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0).toFixed(2)}</h4>
            <button onClick={placeNewOrder} className="place-order-btn">
              📦 Place Order
            </button>
          </div>
        </div>
      )}

      {/* Search and Filter */}
      <div className="search-container">
        <div className="search-row">
          <div className="search-box">
            <input 
              type="text" 
              placeholder={searchType === 'name' ? 'Search by item name...' : 'Search by date...'} 
              value={searchTerm} 
              onChange={handleSearch} 
              className="search-input" 
            />
            <button className="search-btn">🔍</button>
          </div>
          <div className="date-filter">
            <label>📅 Filter by:</label>
            <select value={dateFilter} onChange={handleDateChange} className="date-select">
              <option value="all">All Orders</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
        <div className="search-type">
          <label>
            <input type="radio" value="name" checked={searchType === 'name'} onChange={() => handleTypeChange('name')} />
            🔍 By Name
          </label>
          <label>
            <input type="radio" value="date" checked={searchType === 'date'} onChange={() => handleTypeChange('date')} />
            📅 By Date
          </label>
          <span className="filter-badge">
            {dateFilter !== 'all' ? `📊 ${dateFilter}` : '📊 All Orders'}
          </span>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="no-orders">
          <p>No orders found.</p>
        </div>
      ) : (
        <div className="orders-grid">
          {filteredOrders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.id}</h3>
                <span className="order-status" style={{ backgroundColor: getStatusColor(order.status) }}>
                  {order.status || 'pending'}
                </span>
              </div>
              <div className="order-date">📅 {new Date(order.date).toLocaleString()}</div>
              <div className="order-items">
                <h4>Items ({order.items.length}):</h4>
                {order.items.map((item, i) => (
                  <div key={i} className="order-item">
                    <span>{item.icon} {item.name} {item.quantity && item.quantity > 1 && `x${item.quantity}`}</span>
                    <span>${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="order-total">
                <strong>Total: ${order.total.toFixed(2)}</strong>
              </div>
              <div className="order-actions">
                <button onClick={() => updateOrderStatus(order.id, 'preparing')} className="status-btn">👨‍🍳 Prep</button>
                <button onClick={() => updateOrderStatus(order.id, 'ready')} className="status-btn">✅ Ready</button>
                <button onClick={() => updateOrderStatus(order.id, 'completed')} className="status-btn">✔️ Done</button>
                <button onClick={() => deleteOrder(order.id)} className="delete-btn">🗑️</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
