import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

interface TermsAndConditionsPageProps {
  onBack: () => void;
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mb-10">
    <h2 className="text-xl font-extrabold text-[#0A192F] mb-4 pb-2 border-b-2 border-[#0052FF]/20">
      {title}
    </h2>
    <div className="space-y-3 text-slate-600 leading-relaxed text-[15px]">{children}</div>
  </div>
);

const SubSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="mt-5">
    <h3 className="font-bold text-[#0A192F] mb-2 text-base">{title}</h3>
    <div className="space-y-2 text-slate-600">{children}</div>
  </div>
);

export function TermsAndConditionsPage({ onBack }: TermsAndConditionsPageProps) {
  const effectiveDate = 'July 14, 2026';

  return (
    <div className="min-h-screen bg-slate-50 font-['Inter']">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-5xl mx-auto px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-600 hover:text-[#0052FF] font-semibold transition-colors text-sm"
            id="terms-back-button"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <div className="flex items-center gap-2">
            <span className="font-black text-xl">
              <span className="text-[#0052FF]">Nexa</span>
              <span className="text-[#0A192F]">Plan</span>
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Shield className="w-4 h-4" />
            <span>Legal</span>
          </div>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-gradient-to-br from-[#0A192F] to-slate-800 text-white py-16 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 mb-6 text-xs font-bold tracking-widest uppercase text-blue-300">
            Legal Agreement
          </div>
          <h1 className="text-4xl font-black mb-4">Terms and Conditions</h1>
          <p className="text-slate-300 text-lg max-w-2xl">
            Please read these Terms and Conditions carefully before using the NexaPlan platform. By registering or accessing our services, you agree to be bound by these terms.
          </p>
          <p className="text-slate-400 text-sm mt-4">
            <strong className="text-slate-300">Effective Date:</strong> {effectiveDate} &nbsp;&middot;&nbsp;
            <strong className="text-slate-300">Last Updated:</strong> {effectiveDate}
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-16">
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-10 lg:p-16">

          {/* Table of Contents */}
          <div className="bg-slate-50 rounded-2xl p-6 mb-12 border border-slate-200">
            <h2 className="font-bold text-[#0A192F] mb-4 text-base">Table of Contents</h2>
            <ol className="space-y-1.5 text-sm text-[#0052FF] font-semibold list-decimal list-inside">
              {[
                'Introduction and Agreement',
                'Description of Service',
                'Eligibility and Account Registration',
                'Subscription Plans and Payments',
                'Trial Accounts',
                'User Roles and Account Responsibilities',
                'Data, Privacy and Security',
                'Password Policy and Security Requirements',
                'Multi-Factor Authentication (MFA)',
                'Session Management',
                'Audit Logs',
                'Intellectual Property',
                'Prohibited Conduct',
                'Service Availability and Maintenance',
                'Termination and Cancellation',
                'Limitation of Liability',
                'Indemnification',
                'Governing Law and Jurisdiction',
                'Changes to These Terms',
                'Contact Information',
              ].map((item, i) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          </div>

          <Section title="1. Introduction and Agreement">
            <p>
              These Terms and Conditions ("Agreement") constitute a legally binding contract between you ("User," "Tenant," or "Organization") and <strong className="text-[#0A192F]">NexaPlan</strong> ("we," "us," or "our"), governing your access to and use of the NexaPlan enterprise budget planning platform, including all features, tools, dashboards, integrations, APIs, and support services (collectively, the "Service").
            </p>
            <p>
              By creating an account, starting a free trial, subscribing to a paid plan, or otherwise accessing the Service, you confirm that you have read, understood, and agree to be bound by this Agreement, as well as our Privacy Policy.
            </p>
            <p>
              If you are registering on behalf of a company or other legal entity, you represent and warrant that you have the authority to bind that entity to this Agreement. In that case, "you" refers to that entity.
            </p>
          </Section>

          <Section title="2. Description of Service">
            <p>
              NexaPlan is a cloud-based, Software-as-a-Service (SaaS) enterprise financial planning and budget management platform designed for Philippine businesses, government agencies, and educational institutions. The Service provides:
            </p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li><strong>Multi-level budget planning and approval workflows</strong> with configurable role-based permissions</li>
              <li><strong>Department-level budget visibility</strong> for Heads and Finance Managers</li>
              <li><strong>AI-powered expenditure forecasting</strong> with machine learning predictions</li>
              <li><strong>Real-time financial statements and reports</strong> including balance sheets, income statements, and cash flow summaries</li>
              <li><strong>Audit and compliance tracking</strong> with full immutable audit logs</li>
              <li><strong>Multi-tenant architecture</strong> ensuring complete data isolation between organizations</li>
              <li><strong>PayMongo-integrated subscription billing</strong> with support for GCash, Maya, and credit/debit cards</li>
              <li><strong>SMTP-based email notifications</strong> for account invitations, password resets, and billing events</li>
            </ul>
            <p>
              The Service is provided based on the subscribed plan tier. Features available to you depend on the plan you have purchased as described in Section 4.
            </p>
          </Section>

          <Section title="3. Eligibility and Account Registration">
            <p>To use NexaPlan, you must:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Be at least 18 years of age</li>
              <li>Represent a legally registered company, government body, or educational institution</li>
              <li>Provide accurate, current, and complete registration information</li>
              <li>Maintain the confidentiality of your account credentials</li>
            </ul>
            <p>
              Each organization ("Tenant") is issued a unique, isolated workspace. You are responsible for all activities that occur under your Tenant account, including actions taken by users you invite or provision within your workspace.
            </p>
            <p>
              NexaPlan reserves the right to refuse registration, suspend, or terminate accounts that violate this Agreement or applicable law.
            </p>
          </Section>

          <Section title="4. Subscription Plans and Payments">
            <SubSection title="4.1 Available Plans">
              <p>NexaPlan offers the following subscription tiers:</p>
              <div className="overflow-x-auto mt-3">
                <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="text-left px-4 py-3 font-bold text-[#0A192F] border-b border-slate-200">Plan</th>
                      <th className="text-left px-4 py-3 font-bold text-[#0A192F] border-b border-slate-200">Intended For</th>
                      <th className="text-left px-4 py-3 font-bold text-[#0A192F] border-b border-slate-200">Billing</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { plan: 'Starter', for: 'Small teams and growing SMEs', billing: 'Monthly, in Philippine Peso (\u20b1)' },
                      { plan: 'Professional', for: 'Mid-size companies and departments', billing: 'Monthly, in Philippine Peso (\u20b1)' },
                      { plan: 'Enterprise', for: 'Large corporations and government agencies', billing: 'Monthly, in Philippine Peso (\u20b1)' },
                    ].map((row) => (
                      <tr key={row.plan} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-4 py-3 font-semibold text-[#0052FF]">{row.plan}</td>
                        <td className="px-4 py-3">{row.for}</td>
                        <td className="px-4 py-3">{row.billing}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SubSection>

            <SubSection title="4.2 Payment Processing">
              <p>
                All paid subscriptions are processed through <strong>PayMongo</strong>, a licensed payment processor regulated in the Philippines. NexaPlan does not store your credit card numbers, GCash account details, or Maya credentials. All payment data is handled exclusively by PayMongo under their own security and compliance standards.
              </p>
              <p>
                Applicable taxes (VAT) are included in or added to subscription prices as configured and disclosed at checkout.
              </p>
            </SubSection>

            <SubSection title="4.3 Refund Policy">
              <p>
                All subscription fees are <strong>non-refundable</strong> once the payment has been processed and your workspace has been activated. If you believe a charge was made in error, please contact <strong>nexaplansupport@gmail.com</strong> within 7 days of the billing date.
              </p>
            </SubSection>

            <SubSection title="4.4 Plan Upgrades and Renewals">
              <p>
                You may upgrade or renew your plan at any time through the Billing section of your Main Admin dashboard. Upgrades take effect immediately upon payment confirmation. NexaPlan will send billing confirmation emails to the registered contact email address.
              </p>
            </SubSection>
          </Section>

          <Section title="5. Trial Accounts">
            <p>NexaPlan offers a <strong>14-day free trial</strong> for eligible organizations. Trial accounts are subject to the following:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>All trial requests are subject to manual review and approval by a NexaPlan Super Administrator</li>
              <li>Trial workspaces may have reduced feature access compared to paid plans</li>
              <li>Trial workspaces are activated only after approval — you will be notified via email</li>
              <li>Trial accounts that are not upgraded to a paid plan after the trial period may be deactivated without further notice</li>
              <li>One trial per organization or email domain is permitted</li>
            </ul>
          </Section>

          <Section title="6. User Roles and Account Responsibilities">
            <p>NexaPlan implements a role-based access control (RBAC) system. Each user is assigned one of the following roles within your organization's workspace:</p>
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm border border-slate-200 rounded-xl overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left px-4 py-3 font-bold text-[#0A192F] border-b border-slate-200">Role</th>
                    <th className="text-left px-4 py-3 font-bold text-[#0A192F] border-b border-slate-200">Responsibilities</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { role: 'Super Admin', resp: 'NexaPlan platform administrator. Manages all tenants, billing, system configuration, and pricing.' },
                    { role: 'Main Admin', resp: 'Organization-level administrator. Manages users, departments, settings, billing, and workspace-level configuration.' },
                    { role: 'Finance Manager', resp: 'Manages financial statements, approves budget items, and oversees forecasting.' },
                    { role: 'Department Head', resp: 'Submits and manages department-level budget requests and expenditures.' },
                    { role: 'Compliance Auditor', resp: 'Read-only access to audit logs, financial records, and compliance reports.' },
                  ].map((row) => (
                    <tr key={row.role} className="border-b border-slate-100 last:border-b-0">
                      <td className="px-4 py-3 font-semibold text-[#0052FF] whitespace-nowrap">{row.role}</td>
                      <td className="px-4 py-3">{row.resp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-4">
              As the Main Admin, you are solely responsible for managing who has access to your organization's workspace, including inviting, modifying, suspending, and removing users. You agree not to share credentials and to promptly revoke access for users who leave your organization.
            </p>
          </Section>

          <Section title="7. Data, Privacy and Security">
            <SubSection title="7.1 Data Ownership">
              <p>All data entered into your NexaPlan workspace — including budget records, financial statements, user information, and audit logs — belongs to your organization. NexaPlan does not sell, share, or exploit your organizational data for commercial purposes.</p>
            </SubSection>
            <SubSection title="7.2 Data Isolation">
              <p>NexaPlan uses a multi-tenant architecture with strict data isolation. Each Tenant's data is partitioned by a unique TenantID and cannot be accessed by users of other organizations.</p>
            </SubSection>
            <SubSection title="7.3 Communications">
              <p>By registering, you consent to receiving transactional emails from NexaPlan's SMTP service (sent via <strong>nexaplansupport@gmail.com</strong>), including: account activation notices, password reset codes, billing confirmations, and workspace invitation emails.</p>
            </SubSection>
            <SubSection title="7.4 Data Retention">
              <p>Upon account cancellation or termination, your organization's data is retained for a <strong>30-day grace period</strong> before being permanently deleted. During this period, you may contact us to retrieve an export of your data.</p>
            </SubSection>
          </Section>

          <Section title="8. Password Policy and Security Requirements">
            <p>To protect your organization's workspace, NexaPlan enforces the following mandatory password policy for all account registrations and password changes:</p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 mt-2">
              <p className="font-bold text-[#0A192F] mb-3">All passwords must meet every requirement below:</p>
              <ul className="space-y-2">
                {[
                  'Minimum 12 characters in length',
                  'At least one uppercase letter (A\u2013Z)',
                  'At least one lowercase letter (a\u2013z)',
                  'At least one number (0\u20139)',
                  'At least one special character (e.g. @, #, !, $, %, _, -)',
                ].map((req) => (
                  <li key={req} className="flex items-start gap-2 text-slate-700">
                    <span className="text-[#10B981] font-bold mt-0.5">&#10003;</span>
                    <span>{req}</span>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-3">
              You are responsible for keeping your password confidential. NexaPlan will never ask for your password via email or phone. Passwords are stored as one-way cryptographic hashes using bcrypt and are never stored in plaintext.
            </p>
            <p>
              Your organization's Main Admin may configure a tenant-level minimum password length policy in the workspace Settings panel, which applies to all users within your organization.
            </p>
          </Section>

          <Section title="9. Multi-Factor Authentication (MFA)">
            <p>NexaPlan supports optional Multi-Factor Authentication (MFA) via email-based one-time passwords (OTP). Main Admins may enforce MFA as mandatory for all users in their organization via the Settings panel.</p>
            <p>When MFA is enabled, users will be required to enter a 6-digit OTP code at each login. NexaPlan sends these codes via email to the user's registered address. MFA codes are valid for a limited time period. NexaPlan is not responsible for delays in email delivery that may affect MFA access.</p>
          </Section>

          <Section title="10. Session Management">
            <p>NexaPlan implements automatic session timeout to protect inactive accounts. Each organization's Main Admin may configure the session timeout duration in the workspace Settings panel. Sessions are automatically terminated after the configured period of inactivity, with a default of 30 minutes.</p>
            <p>NexaPlan uses JSON Web Tokens (JWT) for session authentication with a default expiration of 24 hours. Tokens are stored client-side and are invalidated on logout or expiry. NexaPlan is not responsible for unauthorized access resulting from a user failing to log out from a shared device.</p>
          </Section>

          <Section title="11. Audit Logs">
            <p>All significant actions within your NexaPlan workspace are captured in an immutable audit log, including but not limited to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>User logins, failed login attempts, and account lockouts</li>
              <li>User creation, modification, suspension, and deletion</li>
              <li>Budget submissions, approvals, and rejections</li>
              <li>Financial statement generation and modifications</li>
              <li>Department and settings changes</li>
              <li>Billing and subscription events</li>
              <li>MFA setup and changes</li>
            </ul>
            <p>Audit logs are accessible to users with the Compliance Auditor role and to your Main Admin. Audit logs cannot be deleted or altered through the UI and are retained for the lifetime of your subscription.</p>
          </Section>

          <Section title="12. Intellectual Property">
            <p>The NexaPlan platform, including all software, algorithms, AI models, UI designs, brand assets, documentation, and service marks, is the exclusive intellectual property of NexaPlan and its licensors. Nothing in this Agreement grants you any ownership rights to the platform.</p>
            <p>You retain all intellectual property rights in the data and content your organization inputs into the Service. By using the Service, you grant NexaPlan a limited, non-exclusive license to process and display your data solely for the purpose of providing the Service to you.</p>
          </Section>

          <Section title="13. Prohibited Conduct">
            <p>You agree not to, and not to allow others under your account to:</p>
            <ul className="list-disc list-inside space-y-1.5 ml-2">
              <li>Attempt to gain unauthorized access to other tenants' data or NexaPlan's infrastructure</li>
              <li>Reverse-engineer, decompile, or disassemble any part of the Service</li>
              <li>Use the Service for any illegal purpose or in violation of Philippine law</li>
              <li>Transmit malware, viruses, or disruptive code through the platform</li>
              <li>Misrepresent your identity or organizational affiliation during registration</li>
              <li>Resell, sublicense, or transfer access to the Service to third parties without written consent</li>
              <li>Circumvent any security controls, rate limits, or access restrictions in the platform</li>
            </ul>
            <p>Violation of these prohibitions may result in immediate account termination without refund.</p>
          </Section>

          <Section title="14. Service Availability and Maintenance">
            <p>NexaPlan strives to maintain high service availability but does not guarantee 100% uptime. Scheduled maintenance windows will be communicated in advance where possible. Emergency maintenance may be performed without prior notice.</p>
            <p>NexaPlan is not liable for any loss or damage caused by temporary service unavailability, including server downtime, database errors, or third-party service disruptions (including PayMongo, SMTP providers, or AI model services).</p>
          </Section>

          <Section title="15. Termination and Cancellation">
            <SubSection title="15.1 Cancellation by Tenant">
              <p>You may request cancellation of your subscription at any time from the Billing section of your Main Admin dashboard. Upon cancellation, your subscription remains active until the end of the current billing cycle. Your workspace is then archived and access restricted.</p>
            </SubSection>
            <SubSection title="15.2 Termination by NexaPlan">
              <p>NexaPlan reserves the right to suspend or terminate your account immediately if you violate this Agreement, fail to pay subscription fees when due, or engage in fraudulent, illegal, or abusive behavior.</p>
            </SubSection>
            <SubSection title="15.3 Effect of Termination">
              <p>Upon termination: your access to the Service is revoked; your data is retained for 30 days then permanently deleted; no subscription fees are refunded. Sections on intellectual property, limitation of liability, and governing law survive termination.</p>
            </SubSection>
          </Section>

          <Section title="16. Limitation of Liability">
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, NEXAPLAN SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO LOSS OF DATA, LOSS OF REVENUE, LOSS OF PROFITS, OR BUSINESS INTERRUPTION, ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE SERVICE.
            </p>
            <p>
              NEXAPLAN'S TOTAL CUMULATIVE LIABILITY TO YOU FOR ANY CLAIM ARISING FROM OR RELATED TO THE SERVICE SHALL NOT EXCEED THE TOTAL AMOUNT YOU PAID TO NEXAPLAN IN THE THREE (3) MONTHS IMMEDIATELY PRECEDING THE EVENT GIVING RISE TO THE CLAIM.
            </p>
          </Section>

          <Section title="17. Indemnification">
            <p>You agree to indemnify, defend, and hold harmless NexaPlan, its officers, employees, and agents from and against any claims, liabilities, damages, penalties, fines, costs, and expenses (including reasonable legal fees) arising from: (a) your use of the Service in violation of this Agreement; (b) your organization's data or content uploaded to the platform; or (c) your violation of applicable law.</p>
          </Section>

          <Section title="18. Governing Law and Jurisdiction">
            <p>This Agreement shall be governed by and construed in accordance with the laws of the <strong>Republic of the Philippines</strong>, without regard to its conflict of law provisions.</p>
            <p>Any dispute arising out of or relating to this Agreement shall be subject to the exclusive jurisdiction of the appropriate courts located in <strong>Manila, Philippines</strong>. Both parties consent to personal jurisdiction in such courts.</p>
          </Section>

          <Section title="19. Changes to These Terms">
            <p>NexaPlan reserves the right to modify these Terms and Conditions at any time. When material changes are made, we will notify you via email to your registered contact address and/or by posting a prominent notice within the platform at least <strong>14 days before</strong> the changes take effect.</p>
            <p>Your continued use of the Service after the effective date of the updated Terms constitutes your acceptance of the revised Agreement. If you do not agree to the updated Terms, you must stop using the Service and may request cancellation.</p>
          </Section>

          <Section title="20. Contact Information">
            <p>If you have questions about these Terms and Conditions, please contact:</p>
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 mt-3">
              <p className="font-bold text-[#0A192F] text-lg mb-1">NexaPlan Support Team</p>
              <p><strong>Email:</strong> <a href="mailto:nexaplansupport@gmail.com" className="text-[#0052FF] hover:underline">nexaplansupport@gmail.com</a></p>
              <p><strong>Location:</strong> Manila, Philippines</p>
              <p className="text-slate-500 text-sm mt-2">We aim to respond to all inquiries within 2 business days.</p>
            </div>
          </Section>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-slate-200 text-center text-slate-500 text-sm">
            <p>&copy; 2026 NexaPlan. All rights reserved. Made with precision in Manila, Philippines.</p>
            <p className="mt-1">Effective Date: {effectiveDate}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
