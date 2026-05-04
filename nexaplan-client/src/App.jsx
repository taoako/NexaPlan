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

export default function App() {
  const [currentView, setCurrentView] = useState('landing');
  const [selectedPlan, setSelectedPlan] = useState('trial');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const clearMessages = () => { setSuccessMessage(''); setErrorMessage(''); };

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
    if (paymentStatus === 'success') {
      setSuccessMessage('Payment received. We are activating your workspace now.');
      setCurrentView('success');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (paymentStatus === 'cancelled') {
      setErrorMessage('Payment was cancelled. You can try again anytime.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        // Restore session on page refresh - route by roleId
        switch (user.roleId) {
          case 1: setCurrentView('admin-dashboard'); break;
          case 2: setCurrentView('main-admin'); break;
          case 3: setCurrentView('finance-manager'); break;  // Finance Manager
          case 4: setCurrentView('dept-head'); break;         // Department Head
          case 5: setCurrentView('auditor'); break;
          default:
            // Impersonation sessions may not have roleId
            if (user.impersonated) setCurrentView('main-admin');
            break;
        }
      } catch (e) {
        localStorage.removeItem('user');
      }
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
      phone: phone,
      orgType: orgType,
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
      const response = await fetch('http://localhost:5189/api/Auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });

      const data = await response.json();

      if (response.ok) {
        // Save user details
        localStorage.setItem('user', JSON.stringify(data));
        
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
    return <MainAdminSystem onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'admin-dashboard') {
    return <SuperAdminSystem onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'finance-manager') {
    return <FinanceManagerSystem onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'dept-head') {
    return <DepartmentHeadSystem onBack={() => setCurrentView('landing')} />;
  }

  if (currentView === 'auditor') {
    return <ComplianceAuditSystem onBack={() => setCurrentView('landing')} />;
  }

  return null;
}
