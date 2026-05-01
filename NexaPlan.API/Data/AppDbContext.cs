using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Models;

namespace NexaPlan.API.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }

        // --- Core Infrastructure ---
        public DbSet<Tenant> Tenants { get; set; }
        public DbSet<Role> Roles { get; set; }
        public DbSet<Department> Departments { get; set; }
        public DbSet<User> Users { get; set; }

        // --- Financial Engine ---
        public DbSet<BudgetProposal> BudgetProposals { get; set; }
        public DbSet<LineItem> LineItems { get; set; }
        public DbSet<Approval> Approvals { get; set; }
        public DbSet<Transaction> Transactions { get; set; }

        // --- Forecasting & Planning ---
        public DbSet<Forecast> Forecasts { get; set; }
        public DbSet<BudgetScenario> BudgetScenarios { get; set; }

        // --- Admin, Security, & Attachments ---
        public DbSet<WorkflowRule> WorkflowRules { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<TenantSetting> TenantSettings { get; set; }
        public DbSet<UserToken> UserTokens { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<PaymentSession> PaymentSessions { get; set; }
    }
}