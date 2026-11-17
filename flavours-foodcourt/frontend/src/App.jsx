import DeliveryTracking from './components/DeliveryTracking'

import { useEffect, useMemo, useState } from 'react'
import './App.css'


const categories = [
  'All',
  'Burgers',
  'Pizza',
  'Snacks',
  'Beverages',
  'Chinese',
  'Desserts',
  'Veg',
  'Non-Veg'
]

const foods = [
  {
    id: 1,
    name: 'Classic Burger',
    category: 'Burgers',
    price: 120,
    rating: 4.8,
    description: 'Juicy patty, fresh veggies and special sauce.',
    image:
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=85',
    type: 'Non-Veg'
  },
  {
    id: 2,
    name: 'Garden Veg Pizza',
    category: 'Pizza',
    price: 180,
    rating: 4.7,
    description: 'Loaded with fresh vegetables and cheese.',
    image:
      'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=700&auto=format&fit=crop&q=85',
    type: 'Veg'
  },
  {
    id: 3,
    name: 'Crispy French Fries',
    category: 'Snacks',
    price: 80,
    rating: 4.6,
    description: 'Golden, crispy fries served with dip.',
    image:
      'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=700&auto=format&fit=crop&q=85',
    type: 'Veg'
  },
  {
    id: 4,
    name: 'Chilled Cold Coffee',
    category: 'Beverages',
    price: 90,
    rating: 4.5,
    description: 'A refreshing coffee for every mood.',
    image:
      'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=700&auto=format&fit=crop&q=85',
    type: 'Veg'
  },
  {
    id: 5,
    name: 'Veg Hakka Noodles',
    category: 'Chinese',
    price: 130,
    rating: 4.7,
    description: 'Stir-fried noodles with crunchy vegetables.',
    image:
      'https://images.unsplash.com/photo-1585032226651-759b368d7246?w=700&auto=format&fit=crop&q=85',
    type: 'Veg'
  },
  {
    id: 6,
    name: 'Chocolate Dessert',
    category: 'Desserts',
    price: 110,
    rating: 4.8,
    description: 'A rich, sweet treat to finish your meal.',
    image:
      'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=700&auto=format&fit=crop&q=85',
    type: 'Veg'
  },
  {
    id: 7,
    name: 'Paneer Tikka',
    category: 'Veg',
    price: 160,
    rating: 4.6,
    description: 'Soft paneer with aromatic Indian spices.',
    image:
      'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=700&auto=format&fit=crop&q=85',
    type: 'Veg'
  },
  {
    id: 8,
    name: 'Grilled Chicken Burger',
    category: 'Non-Veg',
    price: 170,
    rating: 4.9,
    description: 'Grilled chicken with a delicious house sauce.',
    image:
      'https://images.unsplash.com/photo-1553979459-d2229ba7433a?w=700&auto=format&fit=crop&q=85',
    type: 'Non-Veg'
  }
]

const currentYear = new Date().getFullYear()

// Safely read JSON or plain-text API responses.
async function sendAuthRequest(endpoint, payload) {
  let response

  try {
    response = await fetch(`/api/auth${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
  } catch {
    try {
      response = await fetch(`http://localhost:8080/api/auth${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
    } catch {
      throw new Error(
        'Cannot connect to the backend. Please ensure the Spring Boot server is running on port 8080.'
      )
    }
  }

  const responseText = await response.text()
  let data = {}

  if (responseText) {
    try {
      data = JSON.parse(responseText)
    } catch {
      data = { message: responseText }
    }
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
        data.error ||
        `Request failed with status ${response.status}`
    )
  }

  return data
}

function App() {
  const [activeCategory, setActiveCategory] = useState('All')
  const [cart, setCart] = useState([])
  const [search, setSearch] = useState('')
  const [showCart, setShowCart] = useState(false)
  const [notice, setNotice] = useState('')
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [ordersError, setOrdersError] = useState('')
  const [trackingOrderId, setTrackingOrderId] = useState(null)

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('flavours_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authFormData, setAuthFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    identifier: '',
    password: ''
  })

  const visibleFoods = useMemo(() => {
    return foods.filter((food) => {
      const matchesCategory =
        activeCategory === 'All' ||
        food.category === activeCategory ||
        food.type === activeCategory

      const matchesSearch = food.name
        .toLowerCase()
        .includes(search.toLowerCase().trim())

      return matchesCategory && matchesSearch
    })
  }, [activeCategory, search])

  useEffect(() => {
    if (!user) { setOrders([]); return }
    const authToken = localStorage.getItem('authToken') || user.token
    if (!authToken) return
    let active = true
    setOrdersLoading(true)
    setOrdersError('')
    fetch('/api/orders/my', { headers: { Authorization: `Bearer ${authToken}` } })
      .then(async (response) => {
        if (!response.ok) throw new Error(response.status === 401 ? 'Please log in again to view your orders.' : 'Orders are temporarily unavailable. Please try again.')
        return response.json()
      })
      .then((data) => { if (active) setOrders(Array.isArray(data) ? data : []) })
      .catch((error) => { if (active) setOrdersError(error.message || 'Could not load your orders.') })
      .finally(() => { if (active) setOrdersLoading(false) })
    return () => { active = false }
  }, [user])

  const cartCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  )

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  )

  function showMessage(message, duration = 2500) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), duration)
  }

  function addToCart(food) {
    setCart((current) => {
      const existing = current.find((item) => item.id === food.id)

      if (existing) {
        return current.map((item) =>
          item.id === food.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      }

      return [...current, { ...food, quantity: 1 }]
    })

    showMessage(`${food.name} added to cart`)
  }

  function changeQuantity(id, amount) {
    setCart((current) =>
      current
        .map((item) =>
          item.id === id
            ? { ...item, quantity: item.quantity + amount }
            : item
        )
        .filter((item) => item.quantity > 0)
    )
  }

  async function checkout() {
    if (!cart.length) {
      showMessage('Your cart is empty')
      return
    }

    if (!user) {
      showMessage('Please login or register to place your order')
      setAuthMode('login')
      setAuthError('')
      setShowCart(false)
      setShowAuthModal(true)
      return
    }

    try {
      const token = localStorage.getItem('authToken') || user.token
      let response

      const orderPayload = {
        customerId: user.customerId || user.id,
        totalAmount: total
      }

      try {
        response = await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderPayload)
        })
      } catch {
        response = await fetch('http://localhost:8080/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(orderPayload)
        })
      }

      const orderData = await response.json()
      if (!response.ok) {
        throw new Error(orderData.message || 'Failed to place order')
      }

      setCart([])
      setShowCart(false)
      setOrders((current) => [orderData, ...current])
      showMessage(
        `ðŸŽ‰ Order #${orderData.id} placed successfully for ${user.name}! Total: â‚¹${total}. Delivery will arrive shortly!`,
        5000
      )
    } catch (err) {
      showMessage(`Order failed: ${err.message}`, 4000)
    }
  }

  function handleAuthChange(event) {
    const { name, value } = event.target

    setAuthFormData((previous) => ({
      ...previous,
      [name]: value
    }))

    setAuthError('')
  }

  function handleLogout() {
    localStorage.removeItem('flavours_user')
    localStorage.removeItem('authToken')
    setUser(null)
    setTrackingOrderId(null)
    showMessage('Logged out successfully')
  }

  function openAuth(mode = 'login') {
    setAuthMode(mode)
    setAuthError('')
    setShowAuthModal(true)
  }

  async function handleAuthSubmit(event) {
    event.preventDefault()
    setAuthLoading(true)
    setAuthError('')

    try {
      if (authMode === 'login') {
        const data = await sendAuthRequest('/login', {
          identifier: authFormData.identifier.trim(),
          password: authFormData.password
        })

        // Support the expected backend response fields.
        const customer = {
          ...data,
          name: data.name || data.customerName || authFormData.identifier,
          email: data.email || '',
          mobile: data.mobile || ''
        }

        if (data.token) {
          localStorage.setItem('authToken', data.token)
        }

        localStorage.setItem('flavours_user', JSON.stringify(customer))
        setUser(customer)
        setShowAuthModal(false)

        setAuthFormData({
          name: '',
          email: '',
          mobile: '',
          identifier: '',
          password: ''
        })

        showMessage(`Welcome back, ${customer.name}! ðŸ‘‹`)
      } else {
        const data = await sendAuthRequest('/register', {
          name: authFormData.name.trim(),
          email: authFormData.email.trim(),
          mobile: authFormData.mobile.trim(),
          password: authFormData.password
        })

        // Registration is successful, but login is kept separate.
        showMessage(
          data.message || 'Account created successfully! Please login.',
          3500
        )

        setAuthFormData((previous) => ({
          ...previous,
          identifier: previous.email.trim(),
          password: ''
        }))

        setAuthMode('login')
      }
    } catch (error) {
      setAuthError(error.message || 'Something went wrong. Please try again.')
    } finally {
      setAuthLoading(false)
    }
  }

  return (
    <div className="app">
      <header className="navbar" id="home">
        <a
          className="brand"
          href="#home"
          aria-label="Flavours Food Court home"
        >
          <div className="logo" aria-hidden="true">
            <div className="logo-inner">
              <div className="logo-top">FLAVOURS</div>

              <div className="logo-art">
                <div className="roof" />
                <div className="house house-left" />
                <div className="house house-center" />
                <div className="house house-right" />
                <div className="fork" />
                <div className="spoon" />
              </div>

              <div className="logo-bottom">FOOD COURT</div>
              <div className="logo-flourish" />
            </div>
          </div>

          <div className="brand-name">
            <strong>FLAVOURS</strong>
            <span>FOOD COURT</span>
          </div>
        </a>

        <nav className="nav-links" aria-label="Main navigation">
          <a className="nav-active" href="#home">Home</a>
          <a href="#menu">Our Menu</a>
          <a href="#about">About Us</a>
          <a href="#contact">Contact</a>
          <a href="#orders">My Orders</a>
        </nav>

        <div className="nav-actions">
          <label className="search-box">
            <span aria-hidden="true">âŒ•</span>
            <input
              aria-label="Search food"
              placeholder="Search food..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </label>

          <button
            className="cart-button"
            onClick={() => setShowCart(true)}
            aria-label={`Open cart, ${cartCount} items`}
          >
            ðŸ›’ <span className="cart-count">{cartCount}</span>
          </button>

          {user ? (
            <div className="user-profile">
              <span className="user-name">ðŸ‘¤ {user.name}</span>
              <button className="logout-button" onClick={handleLogout}>
                Logout
              </button>
            </div>
          ) : (
            <button
              className="login-button"
              onClick={() => openAuth('login')}
            >
              Login
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-content">
            <p className="eyebrow">
              GOOD FOOD <span>â€¢</span> GOOD MOOD
            </p>

            <h1>
              Delicious Food
              <span>For Every Craving</span>
            </h1>

            <p className="hero-description">
              Fresh ingredients, authentic taste, and a cozy atmosphere.
              Experience the real flavors at Flavours Food Court.
            </p>

            <div className="hero-actions">
              <a className="primary-button" href="#menu">
                ðŸ´ Order Now
              </a>
              <a className="secondary-button" href="#about">
                Discover More â†—
              </a>
            </div>

            <div className="hero-note">
              <span>â˜…â˜…â˜…â˜…â˜…</span>
              <p>
                <strong>Freshly prepared</strong>
                <br />
                Made with love, served with flavour
              </p>
            </div>
          </div>

          <div className="hero-image">
            <img
              src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&auto=format&fit=crop&q=90"
              alt="Fresh gourmet burger with vegetables"
            />
            <div className="image-label">
              <span>CHEF'S SPECIAL</span>
              <strong>Made to satisfy.</strong>
            </div>
          </div>
        </section>

        <section className="menu-section" id="menu">
          <div className="section-heading">
            <div>
              <p className="eyebrow">EXPLORE OUR MENU</p>
              <h2>
                Find Your <span>Favourite</span>
              </h2>
              <p className="section-description">
                Delicious choices for every taste and every occasion.
              </p>
            </div>

            <span className="menu-count">
              {visibleFoods.length} items
            </span>
          </div>

          <div className="category-list">
            {categories.map((category) => (
              <button
                key={category}
                className={`category-chip ${
                  activeCategory === category ? 'selected' : ''
                }`}
                onClick={() => setActiveCategory(category)}
              >
                {category === 'All' && 'âœ¦ '}
                {category === 'Burgers' && 'ðŸ” '}
                {category === 'Pizza' && 'ðŸ• '}
                {category === 'Snacks' && 'ðŸŸ '}
                {category === 'Beverages' && 'ðŸ¥¤ '}
                {category === 'Chinese' && 'ðŸœ '}
                {category === 'Desserts' && 'ðŸ° '}
                {category === 'Veg' && 'ðŸ¥— '}
                {category === 'Non-Veg' && 'ðŸ— '}
                {category}
              </button>
            ))}
          </div>

          <div className="food-grid">
            {visibleFoods.map((food) => (
              <article className="food-card" key={food.id}>
                <div className="food-image-wrap">
                  <img
                    src={food.image}
                    alt={food.name}
                    loading="lazy"
                  />

                  <span className="food-type">
                    <span
                      className={
                        food.type === 'Veg' ? 'veg-dot' : 'nonveg-dot'
                      }
                    />
                    {food.type}
                  </span>

                  <span className="rating">â˜… {food.rating}</span>
                </div>

                <div className="food-details">
                  <div className="food-title-row">
                    <h3>{food.name}</h3>
                  </div>

                  <p>{food.description}</p>

                  <div className="food-bottom">
                    <strong className="food-price">â‚¹{food.price}</strong>
                    <button
                      className="add-button"
                      onClick={() => addToCart(food)}
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {visibleFoods.length === 0 && (
            <div className="empty-state">
              <span>ðŸ½ï¸</span>
              <h3>No dishes found</h3>
              <p>Try another search or category.</p>
              <button
                onClick={() => {
                  setSearch('')
                  setActiveCategory('All')
                }}
              >
                Show all dishes
              </button>
            </div>
          )}
        </section>

        <section className="features" id="about">
          <div className="feature">
            <span className="feature-icon">ðŸ›µ</span>
            <div>
              <h3>Fast Delivery</h3>
              <p>Hot and fresh to your door</p>
            </div>
          </div>

          <div className="feature">
            <span className="feature-icon">ðŸ›¡ï¸</span>
            <div>
              <h3>Secure Ordering</h3>
              <p>Your details stay protected</p>
            </div>
          </div>

          <div className="feature">
            <span className="feature-icon">ðŸŒ¿</span>
            <div>
              <h3>Fresh Ingredients</h3>
              <p>Quality you can taste</p>
            </div>
          </div>

          <div className="feature">
            <span className="feature-icon">â˜Ž</span>
            <div>
              <h3>Friendly Support</h3>
              <p>Here to help you</p>
            </div>
          </div>
        </section>
        <section className="orders-section" id="orders">
          <div className="section-heading"><div><p className="eyebrow">YOUR ACCOUNT</p><h2>My Orders</h2><p className="section-description">Review your orders and follow eligible deliveries.</p></div></div>
          {!user && <p>Log in to view your orders. Delivery agents can sign in below to share a real GPS location.</p>}
          {user && <>
          {ordersLoading && <p role="status">Loading your orders...</p>}
          {ordersError && <p role="alert">{ordersError}</p>}
          {!ordersLoading && !ordersError && orders.length === 0 && <p>You have not placed any orders yet.</p>}
          <div className="orders-list">{orders.map((order) => {
            const eligible = Boolean(order.deliveryAgentEmail) && !['DELIVERED', 'CANCELLED', 'COMPLETED'].includes(String(order.status || '').toUpperCase())
            return <article className="order-card" key={order.id}>
              <div><h3>Order #{order.id}</h3><p>Status: {String(order.status || 'PLACED').replaceAll('_', ' ')}</p><p>Total: ₹{order.totalAmount}</p>{order.createdAt && <p>Placed: {new Date(order.createdAt).toLocaleString()}</p>}</div>
              {eligible && <button className="primary-button" onClick={() => setTrackingOrderId(trackingOrderId === order.id ? null : order.id)}>{trackingOrderId === order.id ? 'Close Tracking' : 'Track Order'}</button>}
              {!eligible && <p className="order-tracking-unavailable">Live tracking is unavailable for this order.</p>}
              {trackingOrderId === order.id && <DeliveryTracking orderId={order.id} token={localStorage.getItem('authToken') || user.token} user={user} />}
            </article>
          })}</div>
          </>}
          {!user && <DeliveryTracking orderId={null} token={null} user={null} />}
        </section>
      </main>

      <footer id="contact">
        <a className="footer-brand" href="#home">
          Flavours <span>FOOD COURT</span>
        </a>
        <p>Good food, good mood. Thanks for visiting!</p>
        <p className="copyright">
          Â© {currentYear} Flavours Food Court
        </p>
      </footer>

      {notice && (
        <div className="toast" role="status">
          {notice}
        </div>
      )}

      {showCart && (
        <div
          className="cart-overlay"
          onClick={() => setShowCart(false)}
        >
          <section
            className="cart-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Your shopping cart"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="cart-header">
              <div>
                <p className="eyebrow">YOUR ORDER</p>
                <h2>Shopping Cart</h2>
              </div>

              <button
                className="close-cart"
                onClick={() => setShowCart(false)}
                aria-label="Close shopping cart"
              >
                âœ•
              </button>
            </div>

            {cart.length === 0 ? (
              <div className="cart-empty">
                <span>ðŸ›’</span>
                <h3>Your cart is empty</h3>
                <p>Add your favourite dishes to get started.</p>
                <button
                  className="primary-button"
                  onClick={() => setShowCart(false)}
                >
                  Explore Menu
                </button>
              </div>
            ) : (
              <>
                <div className="cart-items">
                  {cart.map((item) => (
                    <div className="cart-item" key={item.id}>
                      <img src={item.image} alt={item.name} />

                      <div className="cart-item-info">
                        <h3>{item.name}</h3>
                        <strong>â‚¹{item.price * item.quantity}</strong>

                        <div className="quantity-control">
                          <button
                            onClick={() => changeQuantity(item.id, -1)}
                            aria-label={`Remove one ${item.name}`}
                          >
                            âˆ’
                          </button>

                          <span>{item.quantity}</span>

                          <button
                            onClick={() => changeQuantity(item.id, 1)}
                            aria-label={`Add one ${item.name}`}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-total">
                  <span>Subtotal</span>
                  <strong>â‚¹{total}</strong>
                </div>

                <p className="checkout-note">
                  Delivery charges, if applicable, will be calculated at checkout.
                </p>

                <button className="checkout-button" onClick={checkout}>
                  Continue to Checkout Â· â‚¹{total}
                </button>
              </>
            )}
          </section>
        </div>
      )}

      {showAuthModal && (
        <div
          className="auth-overlay"
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="auth-modal"
            role="dialog"
            aria-modal="true"
            aria-label={
              authMode === 'login'
                ? 'Customer Login'
                : 'Customer Registration'
            }
            onClick={(event) => event.stopPropagation()}
          >
            <div className="auth-header">
              <div>
                <p className="eyebrow">CUSTOMER ACCESS</p>
                <h2>
                  {authMode === 'login'
                    ? 'Welcome Back'
                    : 'Create Account'}
                </h2>
              </div>

              <button
                className="close-auth"
                onClick={() => setShowAuthModal(false)}
                aria-label="Close dialog"
              >
                âœ•
              </button>
            </div>

            <div className="auth-tabs">
              <button
                type="button"
                className={`auth-tab ${
                  authMode === 'login' ? 'active' : ''
                }`}
                onClick={() => {
                  setAuthMode('login')
                  setAuthError('')
                }}
              >
                Login
              </button>

              <button
                type="button"
                className={`auth-tab ${
                  authMode === 'register' ? 'active' : ''
                }`}
                onClick={() => {
                  setAuthMode('register')
                  setAuthError('')
                }}
              >
                Sign Up
              </button>
            </div>

            {authError && (
              <div className="auth-error-banner" role="alert">
                {authError}
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="auth-form">
              {authMode === 'register' && (
                <>
                  <div className="form-group">
                    <label htmlFor="reg-name">Full Name</label>
                    <input
                      id="reg-name"
                      name="name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={authFormData.name}
                      onChange={handleAuthChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-email">Email Address</label>
                    <input
                      id="reg-email"
                      name="email"
                      type="email"
                      required
                      autoComplete="email"
                      placeholder="Enter your email"
                      value={authFormData.email}
                      onChange={handleAuthChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="reg-mobile">Mobile Number</label>
                    <input
                      id="reg-mobile"
                      name="mobile"
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      maxLength={10}
                      autoComplete="tel"
                      placeholder="10-digit mobile number"
                      value={authFormData.mobile}
                      onChange={handleAuthChange}
                    />
                  </div>
                </>
              )}

              {authMode === 'login' && (
                <div className="form-group">
                  <label htmlFor="login-id">Email or Mobile Number</label>
                  <input
                    id="login-id"
                    name="identifier"
                    type="text"
                    required
                    autoComplete="username"
                    placeholder="Enter email or mobile"
                    value={authFormData.identifier}
                    onChange={handleAuthChange}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="auth-pwd">Password</label>
                <input
                  id="auth-pwd"
                  name="password"
                  type="password"
                  required
                  minLength={authMode === 'register' ? 8 : undefined}
                  autoComplete={
                    authMode === 'register'
                      ? 'new-password'
                      : 'current-password'
                  }
                  placeholder={
                    authMode === 'register'
                      ? 'Minimum 8 characters'
                      : 'Enter password'
                  }
                  value={authFormData.password}
                  onChange={handleAuthChange}
                />
              </div>

              <button
                type="submit"
                className="auth-submit-button"
                disabled={authLoading}
              >
                {authLoading
                  ? 'Please wait...'
                  : authMode === 'login'
                    ? 'Log In'
                    : 'Register'}
              </button>
            </form>

            <div className="auth-footer">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => {
                      setAuthMode('register')
                      setAuthError('')
                    }}
                  >
                    Sign Up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    type="button"
                    className="auth-switch-link"
                    onClick={() => {
                      setAuthMode('login')
                      setAuthError('')
                    }}
                  >
                    Log In
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App


