// src/App.jsx — Main router with all routes wired up
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider }  from './context/AuthContext'
import { CartProvider }  from './context/CartContext'
import { ToastProvider } from './components/Toast'
import { ProtectedRoute, AdminRoute } from './components/ProtectedRoute'
import Header            from './components/Header'

// Pages
import LoginPage         from './pages/LoginPage'
import HomePage          from './pages/HomePage'
import ProductsPage      from './pages/ProductsPage'
import ProductDetailPage from './pages/ProductDetailPage'
import CartPage          from './pages/CartPage'
import WishlistPage      from './pages/WishlistPage'
import CheckoutPage      from './pages/CheckoutPage'
import OrdersPage        from './pages/OrdersPage'
import ProfilePage       from './pages/ProfilePage'
import AdminDashboard    from './pages/admin/AdminDashboard'

// Simple 404
function NotFound() {
  return (
    <div className="empty-state" style={{ marginTop: 80 }}>
      <div className="icon">🔍</div>
      <h3>404 — Page Not Found</h3>
      <p>The page you're looking for doesn't exist.</p>
      <a href="/" className="btn btn-primary" style={{ marginTop: 20, display: 'inline-flex' }}>Go Home</a>
    </div>
  )
}

// Layout wrapper — shows Header on all pages except Login
function Layout({ children, noHeader = false }) {
  return (
    <>
      {!noHeader && <Header />}
      <main>{children}</main>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <ToastProvider>
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Layout noHeader><LoginPage /></Layout>} />
              <Route path="/"         element={<Layout><HomePage /></Layout>} />
              <Route path="/products" element={<Layout><ProductsPage /></Layout>} />
              <Route path="/products/:id" element={<Layout><ProductDetailPage /></Layout>} />

              {/* Protected — any logged-in user */}
              <Route path="/cart"     element={<Layout><ProtectedRoute><CartPage /></ProtectedRoute></Layout>} />
              <Route path="/wishlist" element={<Layout><WishlistPage /></Layout>} />
              <Route path="/checkout" element={<Layout><ProtectedRoute><CheckoutPage /></ProtectedRoute></Layout>} />
              <Route path="/orders"   element={<Layout><ProtectedRoute><OrdersPage /></ProtectedRoute></Layout>} />
              <Route path="/profile"  element={<Layout><ProtectedRoute><ProfilePage /></ProtectedRoute></Layout>} />

              {/* Admin only */}
              <Route path="/admin" element={<Layout><AdminRoute><AdminDashboard /></AdminRoute></Layout>} />

              {/* Fallback */}
              <Route path="*" element={<Layout><NotFound /></Layout>} />
            </Routes>
          </ToastProvider>
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
