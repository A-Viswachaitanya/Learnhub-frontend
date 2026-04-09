import React, { useState, useContext } from 'react';
import ReCAPTCHA from "react-google-recaptcha";
import { AuthContext } from '../context/Contexts.jsx';
import { Card, Input, Button } from '../components/UI.jsx';
import { api } from '../services/api';

export const Login = ({ onNavigate }) => {
  const { login } = useContext(AuthContext);
  const [data, setData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!recaptchaToken) {
      setFormError('Please complete the reCAPTCHA verification to continue.');
      return;
    }
    setLoading(true);

    try {
      const success = await login(data.email, data.password, recaptchaToken);
      if (success) {
        onNavigate('dashboard');
      }
    } catch (err) {
      // Login error handled by context/toast, but we stop loading
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <div className="auth-header">
          <h2 className="auth-title">Welcome Back</h2>
          <p className="auth-subtitle">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <Input
            label="Email"
            type="email"
            value={data.email}
            onChange={e => setData({ ...data, email: e.target.value })}
            placeholder="you@email.com"
            required
          />
          <Input
            label="Password"
            type="password"
            value={data.password}
            onChange={e => setData({ ...data, password: e.target.value })}
            required
          />



          {formError && (
            <div className="auth-error-box">
              {formError}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
            <ReCAPTCHA
              sitekey="6Lfo8KIsAAAAAJCoUJ0J5bghGfSk-CqinMxyK_DT"
              onChange={(token) => setRecaptchaToken(token)}
            />
          </div>

          <Button type="submit" className="btn-w-full" loading={loading}>
            Sign In
          </Button>
        </form>

        <p className="auth-link" onClick={() => onNavigate('register')}>Create an account</p>

        {/*<div className="auth-demo">
          <p className="auth-demo-title">Demo Credentials Reference:</p>
           <p>Admin: admin@test.com / password</p> 
          <p>Student: student@test.com / password</p>
        </div>*/}
      </Card>
    </div>
  );
};

export const Register = ({ onNavigate }) => {
  const { register } = useContext(AuthContext);
  const [data, setData] = useState({ name: '', email: '', password: '', role: 'student' });
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);

  const validate = () => {
    const newErrors = {};
    if (!recaptchaToken && !isOtpSent) {
      newErrors.general = "Please complete the reCAPTCHA verification.";
    }
    if (!/^[a-zA-Z\s]+$/.test(data.name)) {
      newErrors.name = "Name must contain only letters and spaces.";
    }
    if (data.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    try {
      console.log("Attempting to send OTP to:", data.email);
      await api.sendOtp(data.email, data.name, recaptchaToken);
      console.log("OTP sent successfully!");
      setIsOtpSent(true);
    } catch (err) {
      console.error("OTP send failed:", err);
      setErrors({ ...errors, general: err.response?.data || "Failed to send OTP. Check if the backend is running." });
    }
    setLoading(false);
  };

  const handleVerifyAndRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const isValid = await api.verifyOtp(data.email, otp);
      if (isValid) {
        const success = await register(data.name, data.email, data.password, data.role);
        if (success) onNavigate('login');
      } else {
        setErrors({ ...errors, otp: "Invalid OTP. Please check your email." });
      }
    } catch (err) {
      setErrors({ ...errors, general: "Verification failed. Please try again." });
    }
    setLoading(false);
  };

  return (
    <div className="auth-page">
      <Card className="auth-card">
        <h2 className="auth-title" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          {isOtpSent ? "Verify Email" : "Create Account"}
        </h2>

        {!isOtpSent ? (
          <form onSubmit={handleSendOtp}>
            <Input
              label="Full Name"
              value={data.name}
              onChange={e => setData({ ...data, name: e.target.value })}
              error={errors.name}
              placeholder="John Doe"
              required
            />
            <Input
              label="Email"
              type="email"
              value={data.email}
              onChange={e => setData({ ...data, email: e.target.value })}
              error={errors.email}
              placeholder="you@email.com"
              required
            />
            <Input
              label="Password"
              type="password"
              value={data.password}
              onChange={e => setData({ ...data, password: e.target.value })}
              error={errors.password}
              required
            />

            <div className="role-selector">
              <button type="button" onClick={() => setData({ ...data, role: 'student' })} className={`role-btn ${data.role === 'student' ? 'active' : ''}`}>Student</button>
              <button type="button" onClick={() => setData({ ...data, role: 'admin' })} className={`role-btn ${data.role === 'admin' ? 'active' : ''}`}>Educator</button>
            </div>

            <div style={{ display: 'flex', justifyContent: 'center', margin: '1.5rem 0' }}>
              <ReCAPTCHA
                sitekey="6Lfo8KIsAAAAAJCoUJ0J5bghGfSk-CqinMxyK_DT"
                onChange={(token) => setRecaptchaToken(token)}
              />
            </div>

            {errors.general && <p className="form-error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'center' }}>{errors.general}</p>}

            <Button type="submit" className="btn-w-full" loading={loading} style={{ marginTop: '1rem' }}>Send Verification OTP</Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndRegister}>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              We've sent a 6-digit code to <strong>{data.email}</strong>.
            </p>
            <Input
              label="One-Time Password"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              error={errors.otp}
              placeholder="######"
              required
            />
            {errors.general && <p className="form-error-text" style={{ color: 'red', fontSize: '0.8rem', marginTop: '0.5rem' }}>{errors.general}</p>}

            <Button type="submit" className="btn-w-full" loading={loading} style={{ marginTop: '1.5rem' }}>Verify & Register</Button>
            <p className="auth-link" style={{ textAlign: 'center', marginTop: '1rem' }} onClick={() => setIsOtpSent(false)}>Back to registration</p>
          </form>
        )}

        {!isOtpSent && <p className="auth-link" onClick={() => onNavigate('login')}>Already have an account?</p>}
      </Card>
    </div>
  );
};