using NexaPlan.API.Models;

namespace NexaPlan.API.Data;

public static class DemoDataSeeder
{
    public static void Seed(AppDbContext db)
    {
        if (db.Tenants.Any())
        {
            return;
        }

        var now = DateTime.UtcNow;

        var roles = db.Roles.ToDictionary(r => r.RoleName, r => r.RoleID);

        var tenant = new Tenant
        {
            CompanyName = "NexaPlan Demo Corp",
            SubscriptionTier = "Professional",
            IsActive = true,
            RegistrationStatus = "Active",
            CreatedAt = now.AddDays(-45),
            TotalCompanyBudget = 1800000m,
            OrgType = "Corporate",
            ContactPerson = "Ari Santos",
            ContactEmail = "admin@nexaplan.local",
            Phone = "+63 917 555 0182"
        };

        db.Tenants.Add(tenant);
        db.SaveChanges();

        var departments = new List<Department>
        {
            new() { TenantID = tenant.TenantID, DepartmentName = "Finance", AnnualBudgetCap = 420000m },
            new() { TenantID = tenant.TenantID, DepartmentName = "Operations", AnnualBudgetCap = 520000m },
            new() { TenantID = tenant.TenantID, DepartmentName = "IT", AnnualBudgetCap = 360000m },
            new() { TenantID = tenant.TenantID, DepartmentName = "Marketing", AnnualBudgetCap = 280000m },
            new() { TenantID = tenant.TenantID, DepartmentName = "HR", AnnualBudgetCap = 220000m }
        };

        db.Departments.AddRange(departments);
        db.SaveChanges();

        var password = BCrypt.Net.BCrypt.HashPassword("Password123!");

        var mainAdmin = new User
        {
            TenantID = tenant.TenantID,
            RoleID = roles["Main Admin"],
            Name = "Ari Santos",
            FirstName = "Ari",
            LastName = "Santos",
            Email = "admin@nexaplan.local",
            PasswordHash = password,
            IsActive = true,
            HasAcceptedTerms = true,
            TermsAcceptedAt = now.AddDays(-44)
        };

        var financeManager = new User
        {
            TenantID = tenant.TenantID,
            RoleID = roles["Finance Manager"],
            Name = "Jamie Cruz",
            FirstName = "Jamie",
            LastName = "Cruz",
            Email = "finance@nexaplan.local",
            PasswordHash = password,
            IsActive = true,
            HasAcceptedTerms = true,
            TermsAcceptedAt = now.AddDays(-30)
        };

        var auditor = new User
        {
            TenantID = tenant.TenantID,
            RoleID = roles["Auditor"],
            Name = "Noel Mercado",
            FirstName = "Noel",
            LastName = "Mercado",
            Email = "audit@nexaplan.local",
            PasswordHash = password,
            IsActive = true,
            HasAcceptedTerms = true,
            TermsAcceptedAt = now.AddDays(-30)
        };

        var deptHeads = new List<User>
        {
            new()
            {
                TenantID = tenant.TenantID,
                RoleID = roles["Department Head"],
                DepartmentID = departments.First(d => d.DepartmentName == "Finance").DepartmentID,
                Name = "Rina Lopez",
                FirstName = "Rina",
                LastName = "Lopez",
                Email = "rina.lopez@nexaplan.local",
                PasswordHash = password,
                IsActive = true,
                HasAcceptedTerms = true,
                TermsAcceptedAt = now.AddDays(-20)
            },
            new()
            {
                TenantID = tenant.TenantID,
                RoleID = roles["Department Head"],
                DepartmentID = departments.First(d => d.DepartmentName == "Operations").DepartmentID,
                Name = "Marco Rivera",
                FirstName = "Marco",
                LastName = "Rivera",
                Email = "marco.rivera@nexaplan.local",
                PasswordHash = password,
                IsActive = true,
                HasAcceptedTerms = true,
                TermsAcceptedAt = now.AddDays(-21)
            },
            new()
            {
                TenantID = tenant.TenantID,
                RoleID = roles["Department Head"],
                DepartmentID = departments.First(d => d.DepartmentName == "IT").DepartmentID,
                Name = "Ira Valdez",
                FirstName = "Ira",
                LastName = "Valdez",
                Email = "ira.valdez@nexaplan.local",
                PasswordHash = password,
                IsActive = true,
                HasAcceptedTerms = true,
                TermsAcceptedAt = now.AddDays(-18)
            },
            new()
            {
                TenantID = tenant.TenantID,
                RoleID = roles["Department Head"],
                DepartmentID = departments.First(d => d.DepartmentName == "Marketing").DepartmentID,
                Name = "Gio Santos",
                FirstName = "Gio",
                LastName = "Santos",
                Email = "gio.santos@nexaplan.local",
                PasswordHash = password,
                IsActive = true,
                HasAcceptedTerms = true,
                TermsAcceptedAt = now.AddDays(-19)
            },
            new()
            {
                TenantID = tenant.TenantID,
                RoleID = roles["Department Head"],
                DepartmentID = departments.First(d => d.DepartmentName == "HR").DepartmentID,
                Name = "Mia Flores",
                FirstName = "Mia",
                LastName = "Flores",
                Email = "mia.flores@nexaplan.local",
                PasswordHash = password,
                IsActive = true,
                HasAcceptedTerms = true,
                TermsAcceptedAt = now.AddDays(-17)
            }
        };

        db.Users.AddRange(mainAdmin, financeManager, auditor);
        db.Users.AddRange(deptHeads);
        db.SaveChanges();

        foreach (var dept in departments)
        {
            var head = deptHeads.FirstOrDefault(d => d.DepartmentID == dept.DepartmentID);
            if (head != null)
            {
                dept.HeadUserID = head.UserID;
            }
        }

        db.TenantSettings.Add(new TenantSetting
        {
            TenantID = tenant.TenantID,
            FiscalYearStartMonth = 1,
            DefaultCurrency = "PHP",
            RequireMFA = false
        });

        var fiscalYear = DateTime.UtcNow.Year;
        db.DepartmentAllocations.AddRange(departments.Select(dept => new DepartmentAllocation
        {
            TenantID = tenant.TenantID,
            DepartmentID = dept.DepartmentID,
            FiscalYear = fiscalYear,
            TotalAllocatedCap = dept.AnnualBudgetCap,
            SetByAdminID = mainAdmin.UserID,
            SetAt = now.AddDays(-40)
        }));

        db.WorkflowRules.AddRange(
            new WorkflowRule
            {
                TenantID = tenant.TenantID,
                MinAmount = 50000m,
                RequiredRoleID = roles["Finance Manager"]
            },
            new WorkflowRule
            {
                TenantID = tenant.TenantID,
                MinAmount = 250000m,
                RequiredRoleID = roles["Main Admin"]
            }
        );

        var financeDept = departments.First(d => d.DepartmentName == "Finance");
        var itDept = departments.First(d => d.DepartmentName == "IT");
        var opsDept = departments.First(d => d.DepartmentName == "Operations");
        var marketingDept = departments.First(d => d.DepartmentName == "Marketing");

        var proposal1 = new BudgetProposal
        {
            TenantID = tenant.TenantID,
            DepartmentID = itDept.DepartmentID,
            CreatedBy = deptHeads.First(d => d.DepartmentID == itDept.DepartmentID).UserID,
            FiscalYear = fiscalYear,
            Title = "Cloud backup expansion",
            Category = "Software",
            ProposalStatus = "Approved",
            Priority = "High",
            PriorityRank = 1,
            Justification = "Expand backup coverage for critical systems and compliance audits.",
            PlannedMonth = "MAR",
            PlannedYear = fiscalYear,
            TotalAmount = 210000m,
            RequestedAmount = 210000m,
            SubmittedAt = now.AddDays(-35),
            UpdatedAt = now.AddDays(-20)
        };

        var proposal2 = new BudgetProposal
        {
            TenantID = tenant.TenantID,
            DepartmentID = opsDept.DepartmentID,
            CreatedBy = deptHeads.First(d => d.DepartmentID == opsDept.DepartmentID).UserID,
            FiscalYear = fiscalYear,
            Title = "Warehouse efficiency upgrade",
            Category = "Operations",
            ProposalStatus = "Pending",
            Priority = "High",
            PriorityRank = 2,
            Justification = "Automate pallet tracking and reduce shrinkage.",
            PlannedMonth = "APR",
            PlannedYear = fiscalYear,
            TotalAmount = 320000m,
            RequestedAmount = 320000m,
            SubmittedAt = now.AddDays(-12),
            UpdatedAt = now.AddDays(-12)
        };

        var proposal3 = new BudgetProposal
        {
            TenantID = tenant.TenantID,
            DepartmentID = marketingDept.DepartmentID,
            CreatedBy = deptHeads.First(d => d.DepartmentID == marketingDept.DepartmentID).UserID,
            FiscalYear = fiscalYear,
            Title = "Brand awareness Q2 push",
            Category = "Marketing",
            ProposalStatus = "ChangesRequested",
            Priority = "Low",
            PriorityRank = 3,
            Justification = "Boost brand awareness in regional markets.",
            PlannedMonth = "MAY",
            PlannedYear = fiscalYear,
            TotalAmount = 160000m,
            RequestedAmount = 160000m,
            ReviewNotes = "Need clearer ROI targets for channels.",
            SubmittedAt = now.AddDays(-18),
            UpdatedAt = now.AddDays(-10)
        };

        var proposal4 = new BudgetProposal
        {
            TenantID = tenant.TenantID,
            DepartmentID = financeDept.DepartmentID,
            CreatedBy = deptHeads.First(d => d.DepartmentID == financeDept.DepartmentID).UserID,
            FiscalYear = fiscalYear,
            Title = "Quarterly compliance training",
            Category = "Training",
            ProposalStatus = "Approved",
            Priority = "High",
            PriorityRank = 2,
            Justification = "Mandatory compliance refresh for finance team.",
            PlannedMonth = "FEB",
            PlannedYear = fiscalYear,
            TotalAmount = 95000m,
            RequestedAmount = 95000m,
            SubmittedAt = now.AddDays(-50),
            UpdatedAt = now.AddDays(-30)
        };

        db.BudgetProposals.AddRange(proposal1, proposal2, proposal3, proposal4);
        db.SaveChanges();

        db.LineItems.AddRange(
            new LineItem { ProposalID = proposal1.ProposalID, Description = "Object storage retention", Category = "Cloud", Quantity = 12, UnitCost = 8500m, Justification = "Monthly storage costs" },
            new LineItem { ProposalID = proposal1.ProposalID, Description = "Disaster recovery testing", Category = "Services", Quantity = 1, UnitCost = 108000m, Justification = "Annual DR simulation" },
            new LineItem { ProposalID = proposal2.ProposalID, Description = "RFID pallet scanners", Category = "Hardware", Quantity = 8, UnitCost = 18000m, Justification = "Real-time tracking" },
            new LineItem { ProposalID = proposal2.ProposalID, Description = "Warehouse control software", Category = "Software", Quantity = 1, UnitCost = 176000m, Justification = "Automation licenses" },
            new LineItem { ProposalID = proposal3.ProposalID, Description = "Digital campaign spend", Category = "Advertising", Quantity = 1, UnitCost = 120000m, Justification = "Paid social + search" },
            new LineItem { ProposalID = proposal3.ProposalID, Description = "Creative production", Category = "Services", Quantity = 1, UnitCost = 40000m, Justification = "Video + design" },
            new LineItem { ProposalID = proposal4.ProposalID, Description = "Compliance facilitation", Category = "Training", Quantity = 1, UnitCost = 65000m, Justification = "External trainer" },
            new LineItem { ProposalID = proposal4.ProposalID, Description = "Learning materials", Category = "Training", Quantity = 1, UnitCost = 30000m, Justification = "Handbooks and assessments" }
        );

        db.Approvals.AddRange(
            new Approval
            {
                ProposalID = proposal1.ProposalID,
                ApproverID = financeManager.UserID,
                ActionDate = now.AddDays(-20),
                Comments = "Approved. Aligns with risk controls."
            },
            new Approval
            {
                ProposalID = proposal4.ProposalID,
                ApproverID = financeManager.UserID,
                ActionDate = now.AddDays(-30),
                Comments = "Approved. Required for audit readiness."
            }
        );

        db.Expenses.AddRange(
            new Expense
            {
                TenantID = tenant.TenantID,
                DepartmentID = itDept.DepartmentID,
                ProposalID = proposal1.ProposalID,
                Amount = 58000m,
                TaxPaid = 6200m,
                ReceiptUrl = "https://example.com/receipts/it-dr-jan.pdf",
                Status = "Reconciled",
                SubmittedBy = deptHeads.First(d => d.DepartmentID == itDept.DepartmentID).UserID,
                SubmittedAt = now.AddDays(-25),
                ExpenseDate = now.AddDays(-26),
                ReconciledBy = financeManager.UserID,
                ReconciledAt = now.AddDays(-24)
            },
            new Expense
            {
                TenantID = tenant.TenantID,
                DepartmentID = financeDept.DepartmentID,
                ProposalID = proposal4.ProposalID,
                Amount = 42000m,
                TaxPaid = 4500m,
                ReceiptUrl = "https://example.com/receipts/compliance-feb.pdf",
                Status = "Reconciled",
                SubmittedBy = deptHeads.First(d => d.DepartmentID == financeDept.DepartmentID).UserID,
                SubmittedAt = now.AddDays(-32),
                ExpenseDate = now.AddDays(-33),
                ReconciledBy = financeManager.UserID,
                ReconciledAt = now.AddDays(-31)
            }
        );

        db.Transactions.AddRange(
            new Transaction
            {
                TenantID = tenant.TenantID,
                DepartmentID = itDept.DepartmentID,
                ExpenseDate = now.AddDays(-26),
                Category = "Cloud",
                AmountSpent = 58000m
            },
            new Transaction
            {
                TenantID = tenant.TenantID,
                DepartmentID = financeDept.DepartmentID,
                ExpenseDate = now.AddDays(-33),
                Category = "Training",
                AmountSpent = 42000m
            }
        );

        db.Invoices.Add(new Invoice
        {
            TenantID = tenant.TenantID,
            Amount = 12900m,
            BillingDate = now.AddDays(-30),
            DueDate = now.AddDays(-2),
            Status = true,
            PaymentMethod = "GCash",
            PayMongoPaymentIntentId = "pi_demo_2026_001",
            StatusLabel = "Paid",
            TaxAmount = 1382m,
            VatInclusive = true
        });

        db.PaymentSessions.Add(new PaymentSession
        {
            TenantID = tenant.TenantID,
            UserID = mainAdmin.UserID,
            PlanTier = "Professional",
            Amount = 1290000,
            Currency = "PHP",
            Status = "Paid",
            PayMongoCheckoutID = "cs_demo_2026_001",
            PayMongoCheckoutUrl = "https://paymongo.example/checkout/demo",
            CreatedAt = now.AddDays(-31),
            PaidAt = now.AddDays(-30)
        });

        db.Notifications.AddRange(
            new Notification
            {
                UserID = mainAdmin.UserID,
                Message = "Welcome back! Your Q2 budget cycle is open.",
                LinkUrl = "/app/overview",
                IsRead = false,
                CreatedAt = now.AddDays(-3)
            },
            new Notification
            {
                UserID = financeManager.UserID,
                Message = "Two proposals require your review.",
                LinkUrl = "/finance/approvals",
                IsRead = false,
                CreatedAt = now.AddDays(-1)
            }
        );

        db.AuditLogs.AddRange(
            new AuditLog
            {
                TenantID = tenant.TenantID,
                UserID = mainAdmin.UserID,
                ActionType = "TENANT_ONBOARDED",
                TargetResources = $"TenantID:{tenant.TenantID}",
                IPAddress = "127.0.0.1",
                TimeStamp = now.AddDays(-44)
            },
            new AuditLog
            {
                TenantID = tenant.TenantID,
                UserID = financeManager.UserID,
                ActionType = "PROPOSAL_APPROVED",
                TargetResources = $"ProposalID:{proposal1.ProposalID}",
                IPAddress = "127.0.0.1",
                TimeStamp = now.AddDays(-20)
            }
        );

        var statement = new FinancialStatement
        {
            TenantID = tenant.TenantID,
            Name = "Q1 2026 Budget Statement.pdf",
            FileType = "Budget Statement",
            FilePath = "/statements/q1-2026.pdf",
            FileSize = "1.4 MB",
            Sha256Hash = "demo-sha-256",
            CreatedBy = auditor.UserID,
            CreatedAt = now.AddDays(-12)
        };

        db.FinancialStatements.Add(statement);
        db.SaveChanges();

        db.StatementAccessLogs.Add(new StatementAccessLog
        {
            StatementID = statement.StatementID,
            TenantID = tenant.TenantID,
            UserID = auditor.UserID,
            AccessType = "View",
            IPAddress = "127.0.0.1",
            AccessedAt = now.AddDays(-10)
        });

        db.BudgetScenarios.Add(new BudgetScenario
        {
            TenantID = tenant.TenantID,
            ScenarioName = "Conservative FY2026",
            Description = "Reduce discretionary spend by 10% across departments.",
            AdjustmentMultiplier = 0.9m,
            IsActive = true,
            CreatedBy = financeManager.UserID,
            CreatedAt = now.AddDays(-9)
        });

        foreach (var dept in departments)
        {
            for (var i = 1; i <= 3; i++)
            {
                var target = new DateTime(fiscalYear, i, 1);
                var baseSpend = dept.AnnualBudgetCap / 12m;
                db.Forecasts.Add(new Forecast
                {
                    TenantID = tenant.TenantID,
                    DepartmentID = dept.DepartmentID,
                    TargetMonth = target,
                    PredictedSpend = baseSpend * (0.9m + (i * 0.05m)),
                    LowerBound = baseSpend * 0.85m,
                    UpperBound = baseSpend * 1.15m,
                    GeneratedAt = now.AddDays(-2)
                });
            }
        }

        if (!db.PricingPlans.Any())
        {
            var starter = new PricingPlan
            {
                Name = "Starter",
                Description = "Budgeting essentials for small teams.",
                MonthlyPrice = 4950m,
                AnnualPrice = 4207.5m,
                MaxSeats = 3,
                IsPopular = false
            };
            starter.Benefits = new List<PricingBenefit>
            {
                new() { BenefitText = "Up to 3 users" },
                new() { BenefitText = "5 departments" },
                new() { BenefitText = "12 months historical data" },
                new() { BenefitText = "Standard Support" }
            };

            var pro = new PricingPlan
            {
                Name = "Professional",
                Description = "Scaling support for growing companies.",
                MonthlyPrice = 12900m,
                AnnualPrice = 10965m,
                MaxSeats = 15,
                IsPopular = true
            };
            pro.Benefits = new List<PricingBenefit>
            {
                new() { BenefitText = "Up to 15 users" },
                new() { BenefitText = "Unlimited departments" },
                new() { BenefitText = "AI forecasting (24 months history)" },
                new() { BenefitText = "Scenario Planning & Pitching" },
                new() { BenefitText = "Priority Support" }
            };

            var enterprise = new PricingPlan
            {
                Name = "Enterprise",
                Description = "Deep analytics for large enterprises.",
                MonthlyPrice = 29900m,
                AnnualPrice = 25415m,
                MaxSeats = 0,
                IsPopular = false
            };
            enterprise.Benefits = new List<PricingBenefit>
            {
                new() { BenefitText = "Unlimited users" },
                new() { BenefitText = "Advanced AI (Confidence Bands)" },
                new() { BenefitText = "Real-time Anomaly Detection" },
                new() { BenefitText = "Unlimited historical data" },
                new() { BenefitText = "Dedicated Support Manager" }
            };

            db.PricingPlans.AddRange(starter, pro, enterprise);
        }

        db.SaveChanges();
    }
}
