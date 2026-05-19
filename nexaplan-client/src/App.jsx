import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Checkout } from './pages/Checkout';
import SuperAdminSystem from './app/(roles)/super-admin/SuperAdminSystem';
import { MainAdminSystem } from './app/(roles)/main-admin/MainAdminSystem';
import { BudgetPlanningSystem } from './app/(roles)/budget-planning/BudgetPlanningSystem';
import { ComplianceAuditSystem } from './app/(roles)/compliance-audit/ComplianceAuditSystem';
import { DepartmentHeadSystem } from './app/(roles)/department-head/DepartmentHeadSystem';
import { FinanceManagerSystem } from './app/(roles)/finance-manager/FinanceManagerSystem';
import { apiUrl } from './config/api';
import { saveSession, clearSession } from './config/auth';
import { CurrencyProvider } from './context/CurrencyContext';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentUser, setCurrentUser] = useState(null);

  const clearMessages = () => { setSuccessMessage(''); setErrorMessage(''); };

  const handleLogout = () => {
    clearSession();
    setCurrentUser(null);
    setCurrentView('landing');
  };
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [orgType, setOrgType] = useState('Corporate');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvc, setCvc] = useState('');

  const planLabels = {
    trial: '14-day Free Trial',
    starter: 'Starter Plan',
    professional: 'Professional Plan',
    enterprise: 'Enterprise Plan',
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    
    // 1. Handle Payment Redirects First
    if (paymentStatus === 'success') {
      setSuccessMessage('Payment received. We are activating your workspace now.');
      setCurrentView('success');
      window.history.replaceState({}, document.title, window.location.pathname);
      return;
    }
    if (paymentStatus === 'cancelled') {
      setErrorMessage('Payment was cancelled. You can try again anytime.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    // 2. Load user session but don't auto-redirect to dashboard
    // to satisfy user request for "default home is landing".
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setCurrentUser(user);
      } catch (e) {
        localStorage.removeItem('user');
      }
    }
  }, []);

  // --- 3. SESSION TIMEOUT IMPLEMENTATION ---
  useEffect(() => {
    if (!currentUser || currentView === 'landing' || currentView === 'login' || currentView === 'register') return;

    const timeoutMinutes = currentUser.sessionTimeoutMinutes || 30; // Default to 30 mins
    const timeoutMs = timeoutMinutes * 60 * 1000;
    
    let inactivityTimer;

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        alert(`You have been logged out due to ${timeoutMinutes} minutes of inactivity.`);
        handleLogout();
      }, timeoutMs);
    };

    resetTimer(); // Start the timer

    // Listeners for user activity
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];
    const handleActivity = () => resetTimer();

    activityEvents.forEach(evt => document.addEventListener(evt, handleActivity));

    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(evt => document.removeEventListener(evt, handleActivity));
    };
  }, [currentUser, currentView]);

  const startCheckout = async () => {
    setIsLoading(true);
    const payload = {
      firstName: firstName,
      lastName: lastName,
      email: registerEmail,
      companyName: companyName,
      password: registerPassword,
      planTier: selectedPlan,
      phone: phone,
      orgType: orgType,
    };

    try {
      const response = await fetch(apiUrl('/api/Payments/checkout'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        setErrorMessage(data.message || 'Checkout failed. Please try again.');
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      setErrorMessage('Could not start checkout. Connection to backend failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- WE WILL UPGRADE LOGIN NEXT ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(apiUrl('/api/Auth/login'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await response.json();

      if (response.ok) {
        // Save user session + JWT token securely
        saveSession(data);
        setCurrentUser(data);
        // 1: Super Admin, 2: Main Admin, 3: Finance Manager, 4: Dept Head, 5: Auditor, 6: Employee
        switch (data.roleId) {
          case 1:
            setCurrentView('admin-dashboard');
            break;
          case 2:
            setCurrentView('main-admin');
            break;
          case 3:
            setCurrentView('finance-manager');  // Finance Manager
            break;
          case 4:
            setCurrentView('dept-head');         // Department Head
            break;
          case 5:
            setCurrentView('auditor');
            break;
          default:
            setCurrentView('main-admin');
        }
      } else {
        setErrorMessage(data.message || 'Invalid credentials. Please try again.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setErrorMessage('Could not connect to backend.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- UPGRADED REGISTRATION LOGIC ---
  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const payload = {
      firstName: firstName,
      lastName: lastName,
      email: registerEmail,
      companyName: companyName,
      password: registerPassword,
      planTier: selectedPlan === 'trial' ? 'Trial' : selectedPlan,
      phone: phone,
      orgType: orgType,
    };

    try {
      if (selectedPlan !== 'trial') {
        await startCheckout();
        return;
      }

      const response = await fetch(apiUrl('/api/Auth/register'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(data.message || 'Your trial request was received.');
        setCurrentView('success');
      } else {
        setErrorMessage(data.message || 'Registration failed. Check your details.');
      }
    } catch (error) {
      console.error("Server connection error:", error);
      setErrorMessage("Could not connect to the backend.");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        onNavigate={setCurrentView}
        onSelectPlan={(plan) => setSelectedPlan(plan)}
        isLoggedIn={!!currentUser}
        userRole={currentUser?.roleId}
      />
    );
  }

  if (currentView === 'login') {
    return (
      <Login
        onNavigate={setCurrentView}
        onSubmit={handleLogin}
        isLoading={isLoading}
        loginEmail={loginEmail}
        setLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        setLoginPassword={setLoginPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        rememberDevice={rememberDevice}
        setRememberDevice={setRememberDevice}
        errorMessage={errorMessage}
        clearError={() => setErrorMessage('')}
      />
    );
  }

  if (currentView === 'register') {
    return (
      <Register
        onNavigate={setCurrentView}
        onSubmit={handleRegister}
        firstName={firstName}
        setFirstName={setFirstName}
        lastName={lastName}
        setLastName={setLastName}
        registerEmail={registerEmail}
        setRegisterEmail={setRegisterEmail}
        companyName={companyName}
        setCompanyName={setCompanyName}
        registerPassword={registerPassword}
        setRegisterPassword={setRegisterPassword}
        phone={phone}
        setPhone={setPhone}
        orgType={orgType}
        setOrgType={setOrgType}
        planLabel={planLabels[selectedPlan] || 'Plan'}
        errorMessage={errorMessage}
      />
    );
  }

  if (currentView === 'checkout') {
    return (
      <Checkout
        onNavigate={setCurrentView}
        onStartCheckout={startCheckout}
        isLoading={isLoading}
        planLabel={planLabels[selectedPlan] || 'Plan'}
        companyName={companyName}
        setCompanyName={setCompanyName}
        streetAddress={streetAddress}
        setStreetAddress={setStreetAddress}
        city={city}
        setCity={setCity}
        postalCode={postalCode}
        setPostalCode={setPostalCode}
        errorMessage={errorMessage}
      />
    );
  }

  if (currentView === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 font-['Inter']">
        <div className="bg-white p-12 text-center rounded-3xl shadow-2xl max-w-lg w-full">
          <div className="w-24 h-24 bg-[#10B981] rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-16 h-16 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Registration Successful!</h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            {successMessage || 'Your workspace has been provisioned. You can now log in with your credentials.'}
          </p>
          <button
            onClick={() => {
              setCurrentView('login');
              // Replace history state to prevent back-loops
              window.history.replaceState({}, document.title, '/');
            }}
            className="w-full bg-[#0052FF] text-white py-4 rounded-xl font-bold transition-all duration-300 hover:bg-blue-700 shadow-lg shadow-blue-200"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'main-admin') {
    return <CurrencyProvider><MainAdminSystem onLogout={handleLogout} /></CurrencyProvider>;
  }

  if (currentView === 'admin-dashboard') {
    return <SuperAdminSystem onLogout={handleLogout} />;
  }

  if (currentView === 'finance-manager') {
    return <CurrencyProvider><FinanceManagerSystem onLogout={handleLogout} /></CurrencyProvider>;
  }

  if (currentView === 'dept-head') {
    return <CurrencyProvider><DepartmentHeadSystem onLogout={handleLogout} /></CurrencyProvider>;
  }

  if (currentView === 'auditor') {
    return <CurrencyProvider><ComplianceAuditSystem onLogout={handleLogout} /></CurrencyProvider>;
  }

  return null;
}
