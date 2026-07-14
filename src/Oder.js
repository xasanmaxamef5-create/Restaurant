
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch orders from API
  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = () => {
    setLoading(true);
    axios.get('http://localhost:5000/api/orders')
      .then(response => {
        setOrders(response.data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching orders:', error);
        setError('Failed to load orders. Please check if server is running.');
        setLoading(false);
      });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'pending': return '#ff9800';
      case 'preparing': return '#2196F3';
      case 'ready': return '#4CAF50';
      case 'completed': return '#9E9E9E';
      default: return '#666';
    }
  };

  const updateOrderStatus = (orderId, newStatus) => {
    // This would be a PUT request to update status
    // For now, we'll just show a message
    alert(`Order #${orderId} status changed to: ${newStatus}`);
    // You can implement actual API call here
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
        <h2>📋 Orders</h2>
        <button onClick={fetchOrders} className="refresh-btn">🔄 Refresh</button>
      </div>

      {orders.length === 0 ? (
        <div className="no-orders">
          <p>No orders yet. Place an order from the menu!</p>
        </div>
      ) : (
        <div className="orders-grid">
          {orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <h3>Order #{order.id}</h3>
                <span 
                  className="order-status" 
                  style={{ backgroundColor: getStatusColor(order.status) }}
                >
                  {order.status || 'pending'}
                </span>
              </div>
              
              <div className="order-date">
                📅 {new Date(order.date).toLocaleString()}
              </div>
              
              <div className="order-items">
                <h4>Items:</h4>
                {order.items.map((item, index) => (
                  <div key={index} className="order-item">
                    <span>{item.icon} {item.name}</span>
                    <span>${item.price.toFixed(2)}</span>
                  </div>
                ))}
              </div>
              
              <div className="order-total">
                <strong>Total: ${order.total.toFixed(2)}</strong>
              </div>
              
              <div className="order-actions">
                <button 
                  onClick={() => updateOrderStatus(order.id, 'preparing')}
                  className="status-btn"
                >
                  👨‍🍳 Preparing
                </button>
                <button 
                  onClick={() => updateOrderStatus(order.id, 'ready')}
                  className="status-btn"
                >
                  ✅ Ready
                </button>
                <button 
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                  className="status-btn"
                >
                  ✔️ Complete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Orders;
