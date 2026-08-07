import React, { useState, useEffect } from 'react';
import api from './api'; // Import the centralized api instance
import Orders from './Orders';
import Salary from './Salary';
import Expenses from './Expenses';
import Login from './Login';
import Register from './Register';
import { getFoodImage } from './foodImages';
import { useAuth } from './AuthContext';
import './App.css';

/**
 * A portal component to handle the display and toggling of Login and Register forms.
 * It encapsulates its own state, avoiding conditional hook calls in the main App component.
 */
function AuthPortal() {
  const [showLogin, setShowLogin] = useState(true);
  const switchToRegister = () => setShowLogin(false);
  const switchToLogin = () => setShowLogin(true);

  return (
    <div>
      {showLogin ? (
        <Login switchToRegister={switchToRegister} />
      ) : (
        <Register switchToLogin={switchToLogin} />
      )}
    </div>
  );
}

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
  });
  const [imageFile, setImageFile] = useState(null);
  const [editingItem, setEditingItem] = useState(null); // New state for editing
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(getFoodImage('')); // Use the default from getFoodImage
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState({ type: '', text: '' });
  const [isSubmitting, setIsSubmitting] = useState(false); // To prevent double submissions
  
  const { isAuthenticated, currentUser, logout, loading: authLoading } = useAuth();

  // Fetch menu
  const fetchMenu = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/menu'); // Assuming response.data is an array of menu items
      setMenuItems(response.data.filter(item => item != null)); // Filter out any null or undefined items
    } catch (error) {
      console.error('Error fetching menu:', error);
      setError('Failed to load menu. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchMenu();
  }, []);

  // Show Login/Register if not authenticated
  if (authLoading || !isAuthenticated) {
    return <AuthPortal />;
  }

  // Add new item
  const addNewItem = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    if (!newItem.name || !newItem.price) {
      alert('Please enter item name and price!');
      setIsSubmitting(false);
      return;
    }

    const formData = new FormData();
    formData.append('name', newItem.name);
    formData.append('price', parseFloat(newItem.price));
    if (imageFile) {
      formData.append('image', imageFile); // Append the actual file
    }

    try {
      // Assuming backend endpoint for adding menu items is /api/admin/menu
      // and it returns the newly created item with its _id and image URL
      const response = await api.post('/api/admin/menu', formData); // Backend returns { success, message, data }
      const addedItem = response.data?.data;

      // Revoke temporary URL if it was a local file preview
      if (imageFile) {
        URL.revokeObjectURL(imagePreview);
      }

      if (!addedItem) {
        throw new Error('Backend did not return created menu item');
      }

      setMenuItems((prevItems) => [...prevItems.filter(Boolean), addedItem]);
      setNewItem({ name: '', price: '' });
      setImageFile(null);
      setImagePreview(getFoodImage(''));
      setEditingItem(null); // Ensure edit form is closed
      setShowAddItem(false);
      alert(`✅ "${addedItem.name}" added to menu!`);
    } catch (error) {
      console.error('Error adding new menu item:', error);
      alert('Failed to add new menu item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle editing an item (pre-fill form)
  const handleEditItem = (item) => {
    if (!item) {
      return; // Prevent setting state with undefined
    }
    setEditingItem(item);
    setNewItem({ name: item.name, price: item.price.toString() }); // Pre-fill form
    setImagePreview(item.image || getFoodImage('')); // Use existing image or default
    setShowAddItem(false); // Ensure add form is closed
    setImageFile(null); // Clear file input for edit, user can re-upload
  };

  // Cancel editing an item
  const handleCancelEdit = () => {
    setEditingItem(null);
    setNewItem({ name: '', price: '' });
    setImagePreview(getFoodImage(''));
    setImageFile(null);
  };

  // Change password
  const handleChangePassword = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match!' });
      setIsSubmitting(false);
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await api.post('/api/users/change-password', {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });


      if (response.data.success) {
        setPasswordMessage({ type: 'success', text: '✅ Password changed successfully!' });
        setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => {
          setShowChangePassword(false);
          setPasswordMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setPasswordMessage({ type: 'error', text: response.data.message || 'Failed to change password.' });
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'An error occurred. Please try again.';
      setPasswordMessage({ type: 'error', text: `❌ ${errorMessage}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordFormChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordMessage({ type: '', text: '' });
  };

  // Handle updating an item (save changes to backend)
  const handleUpdateItem = async () => { // Make it async
    if (!editingItem || isSubmitting) return;

    const itemId = editingItem._id || editingItem.id;

    if (!itemId) {
      alert('❌ Menu item ID lama helin.');
      return;
    }

    if (!newItem?.name || !newItem?.price) {
      alert('Please enter item name and price!');
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('name', newItem.name.trim());
    formData.append('price', parseFloat(newItem.price));

    if (imageFile) {
      formData.append('image', imageFile);
    }

    try {
      const response = await api.put(
        `/api/admin/menu/${itemId}`,
        formData
      );

      // Backend-kaaga wuxuu soo celiyaa data, ma aha item
      const updatedItem = response.data?.data;

      if (!updatedItem) {
        throw new Error('Backend did not return updated menu item');
      }

      const updatedId = updatedItem._id || updatedItem.id;

      if (!updatedId) {
        throw new Error('Updated menu item has no ID');
      }

      setMenuItems((prevItems) =>
        prevItems
          .filter(Boolean)
          .map((item) => {
            if (!item) return item;
            const itemId = item._id || item.id;
            return itemId === updatedId ? updatedItem : item;
          })
      );

      handleCancelEdit();

      alert(`✅ "${updatedItem.name}" updated successfully!`);
    } catch (error) {
      console.error('Error updating menu item:', error.response?.data || error);
      alert(error.response?.data?.message || 'Failed to update menu item. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cart functions
  const addToCart = (item) => {
    if (!item) return;

    setCart(prevCart => [...prevCart, item]);
  };

  const removeFromCart = (index) => {
    const newCart = [...cart];
    newCart.splice(index, 1);
    setCart(newCart);
  };

  const totalPrice = cart.reduce((sum, item) => sum + (Number(item?.price) || 0), 0);

  const placeOrder = async () => {
    if (isSubmitting) return;

    if (cart.length === 0) {
      alert('Cart-kaaga waa maran!');
      return;
    }

    setIsSubmitting(true);

    // Calculate total price at the time of placing the order to ensure accuracy
    const currentTotal = cart.reduce((sum, item) => sum + (Number(item?.price) || 0), 0);

    const orderData = {
      items: cart.filter(Boolean),
      total: currentTotal,
      customer: currentUser?._id || currentUser?.id,
    };

    try {
      const response = await api.post('/api/orders', orderData);

      const orderTotal = Number(response.data?.total) || Number(response.data?.data?.total) || currentTotal;

      alert(`✅ Order placed! Total: $${orderTotal.toFixed(2)}`);

      setCart([]);

      await fetchMenu();

      setShowOrders(true);
    } catch (error) {
      console.error('Error placing order:', error.response?.data || error);
      alert(error.response?.data?.message || 'Failed to place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Orders Page
  if (showOrders) {
    return (
      <div>
        <div style={{ padding: '1rem 2rem', background: '#FFF8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #E8DDD2' }}>
          <button onClick={() => setShowOrders(false)} className="btn btn-primary">← Back to Menu</button>
          <h2 style={{ color: '#E53935' }}>📋 Dalabaadka</h2>
          <button onClick={logout} className="btn btn-danger" style={{ background: '#E53935', padding: '0.4rem 1rem' }}>Logout</button>
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
          <h2 style={{ color: '#E53935' }}>💰 Mushaarka</h2>
          <button onClick={logout} className="btn btn-danger" style={{ background: '#E53935', padding: '0.4rem 1rem' }}>Logout</button>
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
          <button onClick={logout} className="btn btn-danger" style={{ background: '#E53935', padding: '0.4rem 1rem' }}>Logout</button>
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
            <button onClick={() => setShowChangePassword(true)} className="btn" style={{ background: '#607D8B', color: 'white' }}>🔑 Change Password</button>
            <button onClick={logout} className="btn btn-danger" style={{ background: '#E53935', padding: '0.4rem 1rem' }}>Logout</button>
          </div>
        </div>

        {showChangePassword && (
          <div className="add-item-form">
            <h3>🔑 Change Your Password</h3>
            {passwordMessage.text && (
              <div className={`auth-${passwordMessage.type === 'error' ? 'error' : 'success'}`} style={{ marginBottom: '1rem' }}>
                {passwordMessage.text}
              </div>
            )}
            <div className="form-row">
              <input
                type="password"
                name="oldPassword"
                placeholder="Current Password"
                value={passwordData.oldPassword}
                onChange={handlePasswordFormChange}
              />
            </div>
            <div className="form-row">
              <input
                type="password"
                name="newPassword"
                placeholder="New Password (min 6 chars)"
                value={passwordData.newPassword}
                onChange={handlePasswordFormChange}
              />
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm New Password"
                value={passwordData.confirmPassword}
                onChange={handlePasswordFormChange}
              />
            </div>
            <div className="form-row" style={{ justifyContent: 'flex-end' }}>
              <button onClick={() => setShowChangePassword(false)} className="btn btn-danger">Cancel</button>
              <button onClick={handleChangePassword} className="save-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Updating...' : '💾 Update Password'}
              </button>
            </div>
          </div>
        )}
        
        {/* Edit Item Form */}
        {showAddItem && (
          <div className="add-item-form">
            <h3>📝 Add New Menu Item</h3>
            <div className="form-row">
              <input type="text" placeholder="Item Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              <input type="number" placeholder="Price ($)" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} step="0.01" />
            </div>
            <div className="form-row">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  } else {
                    // User cancelled file selection, reset to default
                    setImageFile(null);
                    setImagePreview(getFoodImage(''));
                  }
                }}
              />
              {imagePreview && <img src={imagePreview} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />}
              <button onClick={addNewItem} className="save-btn" style={{ marginLeft: 'auto' }} disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : '💾 Add to Menu'}
              </button>
            </div>
          </div>
        )}
        
        {editingItem && ( // Show edit form if an item is being edited
          <div className="add-item-form">
            <h3>✏️ Edit Menu Item: {editingItem.name}</h3>
            <div className="form-row">
              <input type="text" placeholder="Item Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
              <input type="number" placeholder="Price ($)" value={newItem.price} onChange={(e) => setNewItem({ ...newItem, price: e.target.value })} step="0.01" />
            </div>
            <div className="form-row">
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files[0];
                  if (file) {
                    setImageFile(file);
                    setImagePreview(URL.createObjectURL(file));
                  } else {
                    setImageFile(null); // Clear the file input
                    setImagePreview(editingItem.image || getFoodImage('')); // Revert to original image or default
                  }
                }}
              />
              {imagePreview && <img src={imagePreview} alt="Preview" style={{ width: '50px', height: '50px', borderRadius: '8px', objectFit: 'cover' }} />}
            </div>
            <div className="form-row" style={{ justifyContent: 'flex-end' }}>
              <button onClick={handleCancelEdit} className="btn btn-danger">Cancel</button>
              <button onClick={handleUpdateItem} className="save-btn" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          </div>
        )}

        {/* Action buttons for Add/Edit */}
        <div style={{ width: '100%', maxWidth: '1200px', marginBottom: '1rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
          {!editingItem && !showAddItem && (
            <button onClick={() => {
              setShowAddItem(true);
              setEditingItem(null); // Ensure edit form is closed
            }} className="btn btn-primary" style={{ background: '#E53935' }}>
            ➕ Add New Item
          </button>
          )}
          {showAddItem && (
            <button onClick={() => {
              setShowAddItem(false);
              setNewItem({ name: '', price: '' });
              setImageFile(null);
              setImagePreview(getFoodImage(''));
            }} className="btn btn-danger">
              ✖ Cancel Add
            </button>
          )}
        </div>

        <div className="menu-section">
          <div className="section-title">
            📋 Menu
            <span>{menuItems.length} items</span>
          </div>

          <div className="menu-grid">
          {menuItems.filter(Boolean).map((item) => (
            <div key={item?._id || item?.id} className="menu-card">
                <div className="card-image">
                <img src={item?.image || getFoodImage(item?.name || '')} alt={item?.name || 'Menu item'} loading="lazy" />
                </div>
                <div className="card-info">
                <h3>{item?.name}</h3>
                <p className="price">${(Number(item?.price) || 0).toFixed(2)}</p>
                </div>
                <button onClick={() => addToCart(item)} className="add-btn">➕ Add</button>
                {
                  <button onClick={() => handleEditItem(item)} className="btn btn-orange" style={{ width: '80%', marginTop: '0.5rem', fontSize: '0.85rem', padding: '0.4rem 1.2rem' }}>✏️ Edit</button>
                }
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
            {cart.filter(Boolean).map((item, index) => (
              <div key={`cart-${index}-${item?._id || item?.id || index}`} className="cart-item">
                  <div className="cart-item-info">
                  <img src={getFoodImage(item?.name || '')} alt={item?.name || 'Food'} className="cart-item-image" />
                  <span className="item-name">{item?.name || 'Unknown item'}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <span className="cart-item-price">${(Number(item?.price) || 0).toFixed(2)}</span>
                    <button onClick={() => removeFromCart(index)} className="btn btn-danger">✕</button>
                  </div>
                </div>
              ))}
              <div className="cart-total">
                <span>Total</span>
                <span>${totalPrice.toFixed(2)}</span>
              </div>
              <button onClick={placeOrder} className="btn btn-green" style={{ width: '100%', marginTop: '1rem', justifyContent: 'center' }} disabled={isSubmitting}>
                {isSubmitting ? 'Placing Order...' : '📦 Place Order'}
              </button>
            </>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;
