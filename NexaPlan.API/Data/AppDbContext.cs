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
        public DbSet<DepartmentAllocation> DepartmentAllocations { get; set; }

        // --- Financial Engine ---
        public DbSet<BudgetProposal> BudgetProposals { get; set; }
        public DbSet<LineItem> LineItems { get; set; }
        public DbSet<Approval> Approvals { get; set; }
        public DbSet<Transaction> Transactions { get; set; }
        public DbSet<Expense> Expenses { get; set; }

        // --- Forecasting & Planning ---
        public DbSet<Forecast> Forecasts { get; set; }
        public DbSet<BudgetScenario> BudgetScenarios { get; set; }

        // --- Auditor / Compliance ---
        public DbSet<ComplianceRule> ComplianceRules { get; set; }
        public DbSet<FinancialStatement> FinancialStatements { get; set; }
        public DbSet<StatementAccessLog> StatementAccessLogs { get; set; }

        // --- Admin, Security, & Attachments ---
        public DbSet<WorkflowRule> WorkflowRules { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<Attachment> Attachments { get; set; }
        public DbSet<TenantSetting> TenantSettings { get; set; }
        public DbSet<UserToken> UserTokens { get; set; }
        public DbSet<AuditLog> AuditLogs { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<PaymentSession> PaymentSessions { get; set; }

        // --- Super Admin ---
        public DbSet<TrialRequest> TrialRequests { get; set; }
        public DbSet<SystemConfig> SystemConfigs { get; set; }
        public DbSet<PricingPlan> PricingPlans { get; set; }
        public DbSet<PricingBenefit> PricingBenefits { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // AuditLog: Actor and FlaggerUser are optional navigation-only references.
            // NoAction prevents EF from adding enforced FK constraints that break on legacy data (UserID = 0).
            modelBuilder.Entity<AuditLog>()
                .HasOne(l => l.Actor)
                .WithMany()
                .HasForeignKey(l => l.UserID)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);

            modelBuilder.Entity<AuditLog>()
                .HasOne(l => l.FlaggerUser)
                .WithMany()
                .HasForeignKey(l => l.FlaggedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);

            // Expense: Submitter and Reconciler are optional navigation references.
            modelBuilder.Entity<Expense>()
                .HasOne(e => e.Submitter)
                .WithMany()
                .HasForeignKey(e => e.SubmittedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);

            modelBuilder.Entity<Expense>()
                .HasOne(e => e.Reconciler)
                .WithMany()
                .HasForeignKey(e => e.ReconciledBy)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);

            // ComplianceRule: Creator is optional.
            modelBuilder.Entity<ComplianceRule>()
                .HasOne(r => r.Creator)
                .WithMany()
                .HasForeignKey(r => r.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);

            // FinancialStatement: Creator is optional.
            modelBuilder.Entity<FinancialStatement>()
                .HasOne(s => s.Creator)
                .WithMany()
                .HasForeignKey(s => s.CreatedBy)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);

            // StatementAccessLog: Accessor is optional.
            modelBuilder.Entity<StatementAccessLog>()
                .HasOne(l => l.Accessor)
                .WithMany()
                .HasForeignKey(l => l.UserID)
                .OnDelete(DeleteBehavior.NoAction)
                .IsRequired(false);
        }
    }
}