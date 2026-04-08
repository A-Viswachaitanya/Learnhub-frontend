import React, { useState, useContext } from 'react';
import { GraduationCap, LogOut, Menu, X, Moon, Sun } from './Icons.jsx';
import { AuthContext, ThemeContext } from '../context/Contexts';
import { Button } from './UI';

const Navbar = ({ onNavigate }) => {
  const { user, logout } = useContext(AuthContext);
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [menuOpen, setMenuOpen] = useState(false);
  
  const NavItem = ({ label, page }) => (
    <button 
      onClick={() => { onNavigate(page); setMenuOpen(false); }} 
      className="nav-item-btn"
    >
      {label}
    </button>
  );

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="navbar-row">
          <div className="navbar-brand" onClick={() => onNavigate(user ? 'dashboard' : 'login')}>
            <GraduationCap />
            <span className="navbar-brand-text">LearnHub</span>
          </div>
          <div className="navbar-desktop">
            <button onClick={toggleTheme} className="navbar-theme-btn">
              {isDark ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            {user ? (
              <>
                <Button variant="ghost" onClick={() => onNavigate('dashboard')}>Dashboard</Button>
                {user.role === 'admin' ? (
                  <>
                    <Button variant="ghost" onClick={() => onNavigate('admin-courses')}>Courses</Button>
                    <Button variant="ghost" onClick={() => onNavigate('admin-students')}>Students</Button>
                  </>
                ) : <Button variant="ghost" onClick={() => onNavigate('student-browse')}>Browse</Button>}
                <div className="navbar-divider"></div>
                <div className="navbar-avatar-group" onClick={() => onNavigate('profile')}>
                  <div className="navbar-avatar">{user.name[0]}</div>
                </div>
                <Button variant="secondary" onClick={() => { logout(); onNavigate('login'); }}><LogOut size={16} /></Button>
              </>
            ) : <div className="navbar-auth-group"><Button variant="ghost" onClick={() => onNavigate('login')}>Login</Button><Button variant="primary" onClick={() => onNavigate('register')}>Sign Up</Button></div>}
          </div>
          <div className="navbar-mobile-toggle"><button onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X /> : <Menu />}</button></div>
        </div>
      </div>
      {menuOpen && (
        <div className="navbar-mobile-menu">
          <div className="navbar-mobile-menu-inner">
            <div className="navbar-mobile-theme-row">
              <span className="navbar-mobile-theme-label">Dark Mode</span>
              <button onClick={toggleTheme}>{isDark ? <Sun size={18}/> : <Moon size={18}/>}</button>
            </div>
            {user ? (
              <>
                <NavItem label="Dashboard" page="dashboard" />
                <NavItem label="My Profile" page="profile" />
                {user.role === 'admin' ? (
                  <>
                    <NavItem label="Manage Courses" page="admin-courses" />
                    <NavItem label="Manage Students" page="admin-students" />
                  </>
                ) : <NavItem label="Browse Courses" page="student-browse" />}
                <button onClick={() => { logout(); onNavigate('login'); }} className="nav-signout-btn">Sign Out</button>
              </>
            ) : (
              <>
                <NavItem label="Login" page="login" />
                <NavItem label="Register" page="register" />
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;