import React from 'react';

export function Navigation({ onNavigate }) {
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (!element) {
      return;
    }

    const offset = 80;
    const elementPosition = element.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - offset;

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth',
    });
  };

  return (
    <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 h-20 flex items-center justify-between px-8">
      <div className="flex items-center">
        <span className="font-black text-2xl">
          <span className="text-[#0052FF]">Nexa</span>
          <span className="text-[#0A192F]">Plan</span>
        </span>
      </div>

      <div className="hidden md:flex items-center gap-8">
        <button
          onClick={() => scrollToSection('features')}
          className="text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-all duration-300"
        >
          Features
        </button>
        <button
          onClick={() => scrollToSection('ai-engine')}
          className="text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-all duration-300"
        >
          AI Engine
        </button>
        <button
          onClick={() => scrollToSection('pricing')}
          className="text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-all duration-300"
        >
          Pricing
        </button>
        <button
          onClick={() => scrollToSection('customers')}
          className="text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-all duration-300"
        >
          Customers
        </button>
      </div>

      <div className="flex items-center gap-4">
        <button
          onClick={() => onNavigate('login')}
          className="text-sm font-semibold text-slate-600 hover:text-[#0052FF] transition-all duration-300"
        >
          Log In
        </button>
        <button
          onClick={() => onNavigate('register')}
          className="bg-[#0A192F] text-white px-5 py-2.5 rounded-lg font-bold hover:bg-slate-800 transition-all duration-300"
        >
          Start Free Trial
        </button>
      </div>
    </nav>
  );
}
