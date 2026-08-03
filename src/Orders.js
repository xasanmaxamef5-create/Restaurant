import React, { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { exportPDF } from './PDFExport';
import { exportToExcel } from './ExcelExport';
import API_BASE_URL from './apiConfig';
import './Orders.css';

// Create an axios instance with a request interceptor to add the auth token
const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState('name');
  const [dateFilter, setDateFilter] = useState('all');
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [todayStats, setTodayStats] = useState({ totalOrders: 0, totalMoney: 0, itemSummary: {} });

  const fetchOrders = useCallback(() => {
    setLoading(true);
    // Use the token-aware 'api' instance for all calls
    Promise.all([
      api.get('/api/orders'),
      api.get('/api/menu')
    ])
      .then(res => {
        setOrders(res[0].data);
        setMenuItems(res[1].data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching orders:', err);
        setError('Failed to load orders');
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    // This effect now only depends on 'orders' and will recalculate when they change.
    const calculateTodayStats = () => {
      const now = new Date();
      const todayDateString = now.toISOString().split('T')[0]; // YYYY-MM-DD

      const todaysOrders = orders.filter(order => {
        // Compare only the date part of the order's date
        return new Date(order.date).toISOString().split('T')[0] === todayDateString;
      });

      const totalMoney = todaysOrders
        .filter(order => order.status === 'completed')
        .reduce((sum, order) => sum + order.total, 0);

      const itemSummary = todaysOrders.reduce((summary, order) => {
        order.items.forEach(item => {
          if (!summary[item.name]) {
            summary[item.name] = { count: 0, total: 0 };
          }
          summary[item.name].count += item.quantity || 1;
          summary[item.name].total += (item.price * (item.quantity || 1));
        });
        return summary;
      }, {});

      setTodayStats({
        totalOrders: todaysOrders.length,
        totalMoney: totalMoney,
        itemSummary: itemSummary
      });
    };

    if (orders.length > 0) calculateTodayStats();
  }, [orders]);

  // Derive filteredOrders directly from state instead of using a separate state variable
  const filteredOrders = orders.filter(order => {
    let matches = true;

    if (dateFilter !== 'all') {
      const now = new Date();
      const orderDate = new Date(order.date);
      const diffDays = (now - orderDate) / (1000 * 60 * 60 * 24);
      if (dateFilter === 'today') matches = diffDays < 1;
      if (dateFilter === 'week') matches = diffDays < 7;
      if (dateFilter === 'month') matches = diffDays < 30;
    }

    if (matches && searchTerm && searchTerm.trim()) {
      if (searchType === 'name') {
        matches = order.items.some(item => 
          item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      } else { // search by date
        matches = new Date(order.date).toLocaleString().toLowerCase().includes(searchTerm.toLowerCase());
      }
    }
    return matches;
  });

  // Calculate summary for the filtered/searched orders
  const searchSummary = useMemo(() => {
    if (!searchTerm.trim()) {
      return null; // Don't show summary if search is empty
    }
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    return {
      count: filteredOrders.length,
      total: totalRevenue,
    };
  }, [filteredOrders, searchTerm]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleDateChange = (e) => {
    setDateFilter(e.target.value);
  };

  const handleTypeChange = (type) => {
    setSearchType(type);
    setSearchTerm('');
  };

  const toggleItemSelection = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(i => (i._id || i.id) === (item._id || item.id));
      if (exists) {
        return prev.filter(i => (i._id || i.id) !== (item._id || item.id));
      } else {
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  const updateQuantity = (itemId, newQuantity) => {
    setSelectedItems(prev => 
      prev.map(item => 
        (item._id || item.id) === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item
      )
    );
  };

  const placeNewOrder = () => {
    if (selectedItems.length === 0) {
      alert('Please select at least one item!');
      return;
    }

    const orderItems = selectedItems.map(item => ({
      id: item._id || item.id,
      name: item.name,
      price: item.price,
      icon: item.icon,
      quantity: item.quantity || 1
    }));

    const total = orderItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    // Use the token-aware 'api' instance
    api.post('/api/orders', { items: orderItems, total })
      .then(response => {
        alert(`✅ Order placed! Total: $${response.data.total.toFixed(2)}`);
        setSelectedItems([]);
        setShowAddOrder(false);
        fetchOrders();
      })
      .catch(error => {
        console.error('Error placing order:', error);
        alert('Failed to place order. Please try again.');
      });
  };

  const updateOrderStatus = (orderId, newStatus) => {
    // Use the admin endpoint and the token-aware 'api' instance
    api.put(`/api/admin/orders/${orderId}`, { status: newStatus })
      .then(() => fetchOrders())
      .catch(error => {
        console.error('Error updating order:', error);
        if (error.response?.status === 401 || error.response?.status === 403) {
          alert('Permission denied. Please log in again.');
        } else {
          alert('Failed to update order status.');
        }
      });
  };

  const deleteOrder = (orderId) => {
    if (window.confirm(`Are you sure you want to delete this order?`)) {
      // Use the admin endpoint and the token-aware 'api' instance
      api.delete(`/api/admin/orders/${orderId}`)
        .then(() => fetchOrders())
        .catch(error => {
          console.error('Error deleting order:', error);
          if (error.response?.status === 401 || error.response?.status === 403) {
            alert('Permission denied. Please log in again.');
          } else {
            alert('Failed to delete order.');
          }
        });
    }
  };

  const getStatusColor = (status) => {
    const map = { pending: '#ff9800', preparing: '#2196F3', ready: '#4CAF50', completed: '#9E9E9E' };
    return map[status] || '#666';
  };

  const handleExportPDF = () => {
    exportPDF('orders-content', `Orders_${new Date().toISOString().split('T')[0]}`);
  };

  const handleExportExcel = () => {
    const dataToExport = filteredOrders.map(order => ({
      'Order ID': order._id,
      'Date': new Date(order.date).toLocaleString(),
      'Status': order.status,
      'Total': order.total,
      'Items': order.items.map(item => `${item.name} (x${item.quantity || 1})`).join(', '),
      'Customer Name': order.customer?.name || 'N/A',
      'Payment Method': order.paymentMethod || 'N/A'
    }));
    exportToExcel(dataToExport, `Orders_${new Date().toISOString().split('T')[0]}`);
  };

  if (loading) {
    return (
      <div className="orders-container">
        <h2>Orders</h2>
        <p className="loading-text">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orders-container">
        <h2>Orders</h2>
        <p className="error-text">{error}</p>
        <button onClick={fetchOrders} className="refresh-btn">Retry</button>
      </div>
    );
  }

  return (
    <div className="orders-container">
      <div id="orders-content">
        <div className="orders-header">
          <h2>Orders ({filteredOrders.length})</h2>
          <div style={{ display: 'flex', gap: '0.8rem' }}>
            <button onClick={handleExportPDF} className="pdf-btn">📄 Export PDF</button>
            <button onClick={handleExportExcel} className="excel-btn">📊 Export Excel</button>
            <button onClick={() => setShowAddOrder(!showAddOrder)} className="add-order-btn">
              {showAddOrder ? 'Cancel' : 'New Order'}
            </button>
            <button onClick={fetchOrders} className="refresh-btn">Refresh</button>
          </div>
        </div>

        <div className="today-summary">
          <div className="summary-header">
            <h3>Today's Summary</h3>
            <span className="summary-date">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
          </div>
          <div className="summary-cards-container">
            <div className="summary-card">
              <span>Total Orders</span>
              <h4>{todayStats.totalOrders}</h4>
            </div>
            <div className="summary-card">
              <span>Total Revenue</span>
              <h4>${todayStats.totalMoney.toFixed(2)}</h4>
            </div>
          </div>
          <div className="item-summary">
            <h4>Items Sold Today</h4>
            {Object.keys(todayStats.itemSummary).length > 0 ? (
              <ul className="item-summary-list">
                {Object.entries(todayStats.itemSummary).sort(([,a],[,b]) => b.count - a.count).map(([name, stats]) => (
                  <li key={name}><strong>{name}</strong> (x{stats.count}) <span>${stats.total.toFixed(2)}</span></li>
                ))}
              </ul>
            ) : <p className="no-items-sold">No items sold yet today.</p>}
          </div>
        </div>

        {showAddOrder && (
          <div className="add-order-form">
            <h3>New Order</h3>
            <div className="menu-items-select">
              <p>Select items for the order:</p>
              <div className="item-grid">
                {menuItems.map(item => {
                  const selected = selectedItems.find(i => (i._id || i.id) === (item._id || item.id));
                  return (
                    <div 
                      key={item._id || item.id} 
                      className={`item-select-card ${selected ? 'selected' : ''}`}
                      onClick={() => toggleItemSelection(item)}
                    >
                      <span className="item-icon">{item.icon}</span>
                      <span className="item-name">{item.name}</span>
                      <span className="item-price">${item.price.toFixed(2)}</span>
                      {selected && (
                        <div className="quantity-control">
                          <button onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item._id || item.id, (selected.quantity || 1) - 1);
                          }}>-</button>
                          <span>{selected.quantity || 1}</span>
                          <button onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item._id || item.id, (selected.quantity || 1) + 1);
                          }}>+</button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="order-summary">
                <h4>Selected Items: {selectedItems.length}</h4>
                <h4>Total: ${selectedItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0).toFixed(2)}</h4>
                <button onClick={placeNewOrder} className="place-order-btn">Place Order</button>
              </div>
            </div>
          </div>
        )}

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
            </div>
            <div className="date-filter">
              <label>Filter by:</label>
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
              By Name
            </label>
            <label>
              <input type="radio" value="date" checked={searchType === 'date'} onChange={() => handleTypeChange('date')} />
              By Date
            </label>
            <span className="filter-badge">
              {dateFilter !== 'all' ? dateFilter : 'All Orders'}
            </span>
          </div>
        </div>

        {searchSummary && (
          <div className="search-summary">
            <div className="summary-card">
              <span>Matching Orders</span>
              <h4>{searchSummary.count}</h4>
            </div>
            <div className="summary-card">
              <span>Total from Search</span>
              <h4>${searchSummary.total.toFixed(2)}</h4>
            </div>
          </div>
        )}

        <div className="orders-grid">
          {filteredOrders.length === 0 ? (
            <div className="no-orders"><p>No orders found.</p></div>
          ) : (
            filteredOrders.map(order => (
              <div key={order._id || order.id} className="order-card">
                <div className="order-header">
                  <h3>Order #{order._id || order.id}</h3>
                  <span className="order-status" style={{ backgroundColor: getStatusColor(order.status) }}>
                    {order.status || 'pending'}
                  </span>
                </div>
                <div className="order-date">{new Date(order.date).toLocaleString()}</div>
                <div className="order-items">
                  <h4>Items ({order.items.length}):</h4>
                  {order.items.map((item, i) => (
                    <div key={`item-${i}-${item._id || item.id}`} className="order-item">
                      <span>{item.icon} {item.name} {item.quantity && item.quantity > 1 && `x${item.quantity}`}</span>
                      <span>${(item.price * (item.quantity || 1)).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="order-total"><strong>Total: ${order.total.toFixed(2)}</strong></div>
                <div className="order-actions">
                  <button onClick={() => updateOrderStatus(order._id || order.id, 'preparing')} className="status-btn">Prep</button>
                  <button onClick={() => updateOrderStatus(order._id || order.id, 'ready')} className="status-btn">Ready</button>
                  <button onClick={() => updateOrderStatus(order._id || order.id, 'completed')} className="status-btn">Done</button>
                  <button onClick={() => deleteOrder(order._id || order.id)} className="delete-btn">Del</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export default Orders;