import React, { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { LandingPage } from './pages/LandingPage';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Checkout } from './pages/Checkout';
import { SuperAdminDashboard } from './features/dashboards/super-admin/SuperAdminDashboard';
import { MainAdminDashboard } from './features/dashboards/main-admin/MainAdminDashboard';
import { BudgetPlanningDashboard } from './features/dashboards/budget-planning/BudgetPlanningDashboard';
import { ComplianceAuditDashboard } from './features/dashboards/compliance-audit/ComplianceAuditDashboard';
import { DepartmentHeadDashboard } from './features/dashboards/department-head/DepartmentHeadDashboard';
import { FinanceManagerDashboard } from './features/dashboards/finance-manager/FinanceManagerDashboard';

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
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
    if (paymentStatus === 'success') {
      setSuccessMessage('Payment received. We are activating your workspace now.');
      setCurrentView('success');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (paymentStatus === 'cancelled') {
      alert('Payment was cancelled. You can try again anytime.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const startCheckout = async () => {
    setIsLoading(true);
    const payload = {
      firstName: firstName,
      lastName: lastName,
      email: registerEmail,
      companyName: companyName,
      password: registerPassword,
      planTier: selectedPlan,
    };

    try {
      const response = await fetch('http://localhost:5189/api/Payments/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        alert(`Checkout failed: ${data.message || 'Please try again.'}`);
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Could not start checkout. Is your C# server running?');
    } finally {
      setIsLoading(false);
    }
  };

  // --- WE WILL UPGRADE LOGIN NEXT ---
  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      const email = loginEmail.toLowerCase();

      if (email === 'justin@nexaplan.ph' || email.includes('superadmin')) {
        setCurrentView('admin-dashboard');
      } else if (email.includes('auditor')) {
        setCurrentView('auditor');
      } else if (email.includes('finance')) {
        setCurrentView('finance-manager');
      } else if (email.includes('dept') || email.includes('department')) {
        setCurrentView('dept-head');
      } else if (email.includes('admin')) {
        setCurrentView('main-admin');
      } else {
        setCurrentView('checkout');
      }
    }, 1500);
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
    };

    try {
      if (selectedPlan !== 'trial') {
        await startCheckout();
        return;
      }

      const response = await fetch('http://localhost:5189/api/Auth/register', {
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
        alert(`Registration failed: ${data.message || 'Check your details.'}`);
      }
    } catch (error) {
      console.error("Server connection error:", error);
      alert("Could not connect to the backend. Is your C# server running?");
    } finally {
      setIsLoading(false);
    }
  };

  if (currentView === 'landing') {
    return (
      <LandingPage
        onNavigate={setCurrentView}
        onSelectPlan={(plan) => setSelectedPlan(plan)}
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
        planLabel={planLabels[selectedPlan] || 'Plan'}
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
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Thanks! We received your request.</h2>
          <p className="text-slate-600 leading-relaxed mb-8">
            {successMessage || 'Your workspace is being provisioned. We will email you once it is ready.'}
          </p>
          <button
            onClick={() => setCurrentView('landing')}
            className="w-full bg-[#0A192F] text-white py-4 rounded-xl font-bold transition-all duration-300 hover:bg-slate-800"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'main-admin') {
    return <MainAdminDashboard onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'admin-dashboard') {
    return <SuperAdminDashboard onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'finance-manager') {
    return <FinanceManagerDashboard onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'dept-head') {
    return <DepartmentHeadDashboard onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'auditor') {
    return <ComplianceAuditDashboard onBack={() => setCurrentView('landing')} />;
  }

  return null;
}