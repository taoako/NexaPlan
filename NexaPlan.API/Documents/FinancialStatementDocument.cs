using System;
using System.Linq;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;

namespace NexaPlan.API.Documents
{
    public class FinancialStatementDocument : IDocument
    {
        private readonly StatementData _data;

        // Brand colors
        private static readonly string NavyBlue = "#1E3A5F";
        private static readonly string AccentBlue = "#2563EB";
        private static readonly string LightGray = "#F8FAFC";
        private static readonly string MidGray = "#94A3B8";
        private static readonly string DarkGray = "#334155";
        private static readonly string SuccessGreen = "#059669";
        private static readonly string WarningAmber = "#D97706";
        private static readonly string DangerRed = "#DC2626";
        private static readonly string White = "#FFFFFF";

        public FinancialStatementDocument(StatementData data)
        {
            _data = data;
        }

        public DocumentMetadata GetMetadata() => new DocumentMetadata
        {
            Title = _data.Title,
            Author = _data.GeneratorName,
            Subject = $"Financial Statement — {_data.PeriodLabel}",
            Creator = "NexaPlan Financial Management System",
            Producer = "NexaPlan",
            CreationDate = DateTimeOffset.UtcNow
        };

        public void Compose(IDocumentContainer container)
        {
            container
                .Page(page => ComposeCoverPage(page))
                .Page(page => ComposeExecutiveSummary(page))
                .Page(page => ComposeDepartmentTable(page))
                .Page(page => ComposeExpenseAnalysis(page))
                .Page(page => ComposePendingRisk(page))
                .Page(page => ComposeAuditActivity(page))
                .Page(page => ComposeCertification(page));
        }

        // ─── SHARED HELPERS ─────────────────────────────────────────────────────

        private void AddPageHeader(PageDescriptor page, string subtitle)
        {
            page.Header()
                .Height(56)
                .Background(NavyBlue)
                .Row(row =>
                {
                    row.RelativeItem()
                        .AlignMiddle()
                        .PaddingLeft(32)
                        .Text(_data.CompanyName)
                        .FontSize(12).FontColor(White).Bold();

                    row.RelativeItem()
                        .AlignMiddle()
                        .AlignRight()
                        .PaddingRight(32)
                        .Text(subtitle)
                        .FontSize(10).FontColor("#93C5FD");
                });
        }

        private void AddPageFooter(PageDescriptor page)
        {
            page.Footer()
                .Height(36)
                .BorderTop(0.5f).BorderColor("#E2E8F0")
                .Row(row =>
                {
                    row.RelativeItem()
                        .AlignMiddle()
                        .PaddingLeft(32)
                        .Text($"Generated: {_data.GeneratedAt:yyyy-MM-dd HH:mm} UTC")
                        .FontSize(8).FontColor(MidGray);

                    row.ConstantItem(200)
                        .AlignMiddle()
                        .AlignCenter()
                        .Text(text =>
                        {
                            text.Span("Page ").FontSize(8).FontColor(MidGray);
                            text.CurrentPageNumber().FontSize(8).FontColor(MidGray);
                            text.Span(" of ").FontSize(8).FontColor(MidGray);
                            text.TotalPages().FontSize(8).FontColor(MidGray);
                        });

                    row.RelativeItem()
                        .AlignMiddle()
                        .AlignRight()
                        .PaddingRight(32)
                        .Text($"CONFIDENTIAL")
                        .FontSize(8).FontColor(MidGray).Bold();
                });
        }

        // ─── PAGE 1: COVER ───────────────────────────────────────────────────────

        private void ComposeCoverPage(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.Margin(0);

            page.Content().Column(col =>
            {
                // Top navy band — 40% of page
                col.Item()
                    .Height(320)
                    .Background(NavyBlue)
                    .Column(inner =>
                    {
                        inner.Item().Height(48); // top padding

                        // NexaPlan logo area
                        inner.Item()
                            .PaddingHorizontal(48)
                            .Row(row =>
                            {
                                row.AutoItem()
                                    .Width(10)
                                    .Height(40)
                                    .Background(AccentBlue);
                                row.ConstantItem(12);
                                row.RelativeItem()
                                    .AlignBottom()
                                    .Text("NexaPlan")
                                    .FontSize(20).FontColor(White).Bold();
                            });

                        inner.Item().Height(32);

                        // Document title
                        inner.Item()
                            .PaddingHorizontal(48)
                            .Text(_data.Title)
                            .FontSize(28).FontColor(White).Bold()
                            .LineHeight(1.2f);

                        inner.Item().Height(16);

                        // Statement type badge
                        inner.Item()
                            .PaddingHorizontal(48)
                            .Row(row =>
                            {
                                row.AutoItem()
                                    .Background(AccentBlue)
                                    .Padding(6).PaddingHorizontal(14)
                                    .Text(_data.StatementType)
                                    .FontSize(10).FontColor(White).Bold();
                            });

                        inner.Item().Height(24);

                        // Period
                        inner.Item()
                            .PaddingHorizontal(48)
                            .Text(_data.PeriodLabel)
                            .FontSize(14).FontColor("#93C5FD");
                    });

                // White content area
                col.Item()
                    .PaddingHorizontal(48)
                    .PaddingTop(40)
                    .Column(inner =>
                    {
                        // Two columns: company info + document info
                        inner.Item().Row(row =>
                        {
                            // Left — company info
                            row.RelativeItem().Column(c =>
                            {
                                c.Item().Text("Prepared for").FontSize(10).FontColor(MidGray);
                                c.Item().Height(6);
                                c.Item().Text(_data.CompanyName).FontSize(16).Bold().FontColor(DarkGray);
                                c.Item().Height(4);
                                c.Item().Text(_data.CompanyEmail).FontSize(10).FontColor(MidGray);
                                if (!string.IsNullOrEmpty(_data.CompanyPhone))
                                    c.Item().Text(_data.CompanyPhone).FontSize(10).FontColor(MidGray);
                                c.Item().Height(4);
                                c.Item().Text($"Subscription: {_data.SubscriptionTier}").FontSize(10).FontColor(MidGray);
                            });

                            // Right — document metadata box
                            row.ConstantItem(220).Border(0.5f).BorderColor("#E2E8F0")
                                .Padding(16).Column(c =>
                                {
                                    c.Item().Text("Document Information").FontSize(9).Bold().FontColor(DarkGray);
                                    c.Item().Height(10);
                                    foreach (var (label, value) in new[]
                                    {
                                        ("Generated by", _data.GeneratorName),
                                        ("Generated on", _data.GeneratedAt.ToString("MMMM dd, yyyy")),
                                        ("Fiscal year", _data.FiscalYear.ToString()),
                                        ("Period", _data.PeriodLabel),
                                        ("Document type", _data.StatementType),
                                        ("Classification", "Confidential"),
                                    })
                                    {
                                        c.Item().Row(r =>
                                        {
                                            r.RelativeItem().Text(label).FontSize(8).FontColor(MidGray);
                                            r.RelativeItem().AlignRight().Text(value).FontSize(8).Bold().FontColor(DarkGray);
                                        });
                                        c.Item().Height(6);
                                    }
                                });
                        });

                        inner.Item().Height(40);

                        // Key figures row — 4 summary boxes
                        inner.Item().Row(row =>
                        {
                            foreach (var (label, value, color) in new[]
                            {
                                ("Total Allocated", FormatPeso(_data.TotalAllocated), NavyBlue),
                                ("Total Committed", FormatPeso(_data.TotalCommitted), AccentBlue),
                                ("Actual Spent", FormatPeso(_data.TotalActual), SuccessGreen),
                                ("Utilization", $"{_data.UtilizationPct}%",
                                    _data.UtilizationPct >= 90 ? DangerRed :
                                    _data.UtilizationPct >= 75 ? WarningAmber : SuccessGreen),
                            })
                            {
                                row.RelativeItem()
                                    .Border(0.5f).BorderColor("#E2E8F0")
                                    .Padding(16)
                                    .Column(c =>
                                    {
                                        c.Item().Text(label).FontSize(8).FontColor(MidGray);
                                        c.Item().Height(4);
                                        c.Item().Text(value).FontSize(18).Bold().FontColor(color);
                                    });
                                row.ConstantItem(8);
                            }
                        });

                        inner.Item().Height(40);

                        // SHA-256 integrity block
                        inner.Item()
                            .Background(LightGray)
                            .Border(0.5f).BorderColor("#E2E8F0")
                            .Padding(14)
                            .Column(c =>
                            {
                                c.Item().Row(r =>
                                {
                                    r.AutoItem().Text("CRYPTOGRAPHIC INTEGRITY").FontSize(8).Bold().FontColor(SuccessGreen);
                                });
                                c.Item().Height(4);
                                c.Item().Text($"SHA-256: {_data.Sha256Hash}").FontSize(7.5f).FontColor(DarkGray);
                                c.Item().Height(2);
                                c.Item().Text("This document's integrity can be independently verified using the hash above. Any alteration of this document will produce a different hash value.").FontSize(7.5f).FontColor(MidGray);
                            });
                    });
            });
        }

        // ─── PAGE 2: EXECUTIVE SUMMARY ───────────────────────────────────────────

        private void ComposeExecutiveSummary(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.MarginHorizontal(48);
            page.MarginVertical(0);
            AddPageHeader(page, "Executive Summary");
            AddPageFooter(page);

            page.Content().PaddingVertical(32).Column(col =>
            {
                col.Item().Text("Executive Summary").FontSize(20).Bold().FontColor(NavyBlue);
                col.Item().Height(4);
                col.Item().Text($"Financial performance overview for {_data.PeriodLabel}").FontSize(11).FontColor(MidGray);
                col.Item().Height(24);

                // Summary paragraph
                col.Item().DefaultTextStyle(x => x.FontSize(10.5f).LineHeight(1.6f)).Text(text =>
                {
                    text.Span($"{_data.CompanyName} ").Bold().FontColor(DarkGray);
                    text.Span($"recorded a total budget utilization of ").FontColor(DarkGray);
                    text.Span($"{_data.UtilizationPct}% ").Bold().FontColor(
                        _data.UtilizationPct >= 90 ? DangerRed :
                        _data.UtilizationPct >= 75 ? WarningAmber : SuccessGreen);
                    text.Span($"during {_data.PeriodLabel}. Of the ").FontColor(DarkGray);
                    text.Span($"{FormatPeso(_data.TotalAllocated)} ").Bold().FontColor(DarkGray);
                    text.Span($"total allocated budget across {_data.DeptRows.Count} department(s), ").FontColor(DarkGray);
                    text.Span($"{FormatPeso(_data.TotalCommitted)} ").Bold().FontColor(DarkGray);
                    text.Span("was formally committed through approved budget proposals, and ").FontColor(DarkGray);
                    text.Span($"{FormatPeso(_data.TotalActual)} ").Bold().FontColor(DarkGray);
                    text.Span("was reconciled as actual expenditure. ").FontColor(DarkGray);
                    text.Span($"A total of {FormatPeso(_data.TotalTax)} ").Bold().FontColor(DarkGray);
                    text.Span("in VAT was capitalized during this period. ").FontColor(DarkGray);
                    text.Span($"The remaining budget variance stands at {FormatPeso(_data.TotalVariance)}.").FontColor(DarkGray);
                });

                col.Item().Height(28);

                // KPI grid — 3x2
                col.Item().Text("Key Performance Indicators").FontSize(13).Bold().FontColor(NavyBlue);
                col.Item().Height(12);

                var kpis = new[]
                {
                    ("Total Allocated Budget", FormatPeso(_data.TotalAllocated), "Org-wide cap for period", NavyBlue),
                    ("Total Committed", FormatPeso(_data.TotalCommitted), "Sum of approved proposals", AccentBlue),
                    ("Total Actual Spent", FormatPeso(_data.TotalActual), "Reconciled expenditures", SuccessGreen),
                    ("Total Variance", FormatPeso(_data.TotalVariance), "Unspent allocated funds",
                        _data.TotalVariance < 0 ? DangerRed : SuccessGreen),
                    ("Total VAT Capitalized", FormatPeso(_data.TotalTax), "VAT from reconciled expenses", DarkGray),
                    ("Pending Budget at Risk", FormatPeso(_data.PendingRisk), "Uncommitted pending proposals", WarningAmber),
                };

                for (int i = 0; i < kpis.Length; i += 2)
                {
                    col.Item().Row(row =>
                    {
                        foreach (var (label, value, sub, color) in kpis.Skip(i).Take(2))
                        {
                            row.RelativeItem()
                                .Border(0.5f).BorderColor("#E2E8F0")
                                .Padding(16)
                                .Column(c =>
                                {
                                    c.Item().Text(label).FontSize(9).FontColor(MidGray);
                                    c.Item().Height(4);
                                    c.Item().Text(value).FontSize(22).Bold().FontColor(color);
                                    c.Item().Height(2);
                                    c.Item().Text(sub).FontSize(8).FontColor(MidGray);
                                });
                            row.ConstantItem(12);
                        }
                    });
                    col.Item().Height(12);
                }

                col.Item().Height(12);

                // Budget utilization bar
                col.Item().Text("Budget utilization").FontSize(11).Bold().FontColor(DarkGray);
                col.Item().Height(8);
                col.Item().Row(row =>
                {
                    // We simulate a progress bar using colored boxes
                    // Clamp to [0.5, 100] so RelativeItem never gets 0 (which crashes QuestPDF)
                    var usedPct = Math.Max(0.5, Math.Min((double)_data.UtilizationPct, 100));
                    var remainingPct = Math.Max(0.5, 100 - usedPct);
                    var barColor = _data.UtilizationPct >= 90 ? DangerRed
                        : _data.UtilizationPct >= 75 ? WarningAmber
                        : SuccessGreen;

                    row.RelativeItem(Convert.ToSingle(usedPct))
                        .Height(14).Background(barColor);
                    if (_data.UtilizationPct < 100)
                        row.RelativeItem(Convert.ToSingle(remainingPct))
                            .Height(14).Background("#E2E8F0");
                });
                col.Item().Height(4);
                col.Item().Row(row =>
                {
                    row.RelativeItem().Text($"Used: {_data.UtilizationPct}%").FontSize(8).FontColor(MidGray);
                    row.RelativeItem().AlignRight().Text($"Remaining: {100 - _data.UtilizationPct}%").FontSize(8).FontColor(MidGray);
                });
            });
        }

        // ─── PAGE 3: DEPARTMENT TABLE ─────────────────────────────────────────────

        private void ComposeDepartmentTable(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.MarginHorizontal(32);
            page.MarginVertical(0);
            AddPageHeader(page, "Department Budget Breakdown");
            AddPageFooter(page);

            page.Content().PaddingVertical(32).Column(col =>
            {
                col.Item().Text("Department Budget Breakdown").FontSize(20).Bold().FontColor(NavyBlue);
                col.Item().Height(4);
                col.Item().Text($"Detailed allocation, commitment, and actual spend by department — {_data.PeriodLabel}").FontSize(10).FontColor(MidGray);
                col.Item().Height(20);

                // Table
                col.Item().Table(table =>
                {
                    // Columns
                    table.ColumnsDefinition(cols =>
                    {
                        cols.RelativeColumn(2.5f);  // Department
                        cols.RelativeColumn(1.8f);  // Allocated
                        cols.RelativeColumn(1.8f);  // Committed
                        cols.RelativeColumn(1.8f);  // Actual Spent
                        cols.RelativeColumn(1.5f);  // VAT
                        cols.RelativeColumn(1.8f);  // Variance
                        cols.RelativeColumn(1f);    // Util %
                        cols.RelativeColumn(1.2f);  // Status
                    });

                    // Header row
                    static IContainer HeaderCell(IContainer c) =>
                        c.Background(NavyBlue).Padding(8).PaddingVertical(10);

                    table.Header(h =>
                    {
                        foreach (var label in new[] { "Department", "Allocated Cap", "Committed", "Actual Spent", "VAT Paid", "Variance", "Util %", "Status" })
                        {
                            h.Cell().Element(HeaderCell)
                                .Text(label).FontSize(8.5f).Bold().FontColor(White);
                        }
                    });

                    // Data rows
                    bool alternate = false;
                    foreach (var dept in _data.DeptRows)
                    {
                        var bg = alternate ? LightGray : White;
                        alternate = !alternate;

                        static IContainer DataCell(IContainer c, string bg) =>
                            c.Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0");

                        var statusColor = dept.Status == "At Risk" ? DangerRed
                            : dept.Status == "Monitor" ? WarningAmber
                            : SuccessGreen;

                        table.Cell().Element(c => DataCell(c, bg)).Text(dept.Name ?? "").FontSize(9).Bold().FontColor(DarkGray);
                        table.Cell().Element(c => DataCell(c, bg)).AlignRight().Text(FormatPeso(dept.AllocatedCap)).FontSize(8.5f).FontColor(DarkGray);
                        table.Cell().Element(c => DataCell(c, bg)).AlignRight().Text(FormatPeso(dept.Committed)).FontSize(8.5f).FontColor(AccentBlue);
                        table.Cell().Element(c => DataCell(c, bg)).AlignRight().Text(FormatPeso(dept.ActualSpent)).FontSize(8.5f).FontColor(DarkGray);
                        table.Cell().Element(c => DataCell(c, bg)).AlignRight().Text(FormatPeso(dept.TaxPaid)).FontSize(8.5f).FontColor(MidGray);
                        table.Cell().Element(c => DataCell(c, bg)).AlignRight().Text(FormatPeso(dept.Variance)).FontSize(8.5f)
                            .FontColor(dept.Variance < 0 ? DangerRed : SuccessGreen);
                        table.Cell().Element(c => DataCell(c, bg)).AlignCenter().Text($"{dept.UtilizationPct}%").FontSize(8.5f)
                            .FontColor(dept.UtilizationPct >= 90 ? DangerRed : dept.UtilizationPct >= 75 ? WarningAmber : SuccessGreen).Bold();
                        table.Cell().Element(c => DataCell(c, bg)).AlignCenter()
                            .Text(dept.Status ?? "").FontSize(8).Bold().FontColor(statusColor);
                    }

                    // Totals row
                    static IContainer TotalCell(IContainer c) =>
                        c.Background(NavyBlue).Padding(8).PaddingVertical(10);

                    table.Cell().Element(TotalCell).Text("TOTAL").FontSize(9).Bold().FontColor(White);
                    table.Cell().Element(TotalCell).AlignRight().Text(FormatPeso(_data.TotalAllocated)).FontSize(8.5f).Bold().FontColor(White);
                    table.Cell().Element(TotalCell).AlignRight().Text(FormatPeso(_data.TotalCommitted)).FontSize(8.5f).Bold().FontColor(White);
                    table.Cell().Element(TotalCell).AlignRight().Text(FormatPeso(_data.TotalActual)).FontSize(8.5f).Bold().FontColor(White);
                    table.Cell().Element(TotalCell).AlignRight().Text(FormatPeso(_data.TotalTax)).FontSize(8.5f).Bold().FontColor(White);
                    table.Cell().Element(TotalCell).AlignRight().Text(FormatPeso(_data.TotalVariance)).FontSize(8.5f).Bold().FontColor(White);
                    table.Cell().Element(TotalCell).AlignCenter().Text($"{_data.UtilizationPct}%").FontSize(8.5f).Bold().FontColor(White);
                    table.Cell().Element(TotalCell).Text("").FontSize(8.5f).FontColor(White);
                });

                col.Item().Height(24);

                // Status legend
                col.Item().Row(row =>
                {
                    foreach (var (label, color) in new[]
                    {
                        ("On Track — utilization below 75%", SuccessGreen),
                        ("Monitor — utilization 75–90%", WarningAmber),
                        ("At Risk — utilization above 90%", DangerRed),
                    })
                    {
                        row.AutoItem().Row(r =>
                        {
                            r.ConstantItem(10).Height(10).Background(color);
                            r.ConstantItem(6);
                            r.AutoItem().AlignMiddle().Text(label).FontSize(8).FontColor(MidGray);
                        });
                        row.ConstantItem(24);
                    }
                });
            });
        }

        // ─── PAGE 4: EXPENSE & TAX ANALYSIS ──────────────────────────────────────

        private void ComposeExpenseAnalysis(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.MarginHorizontal(48);
            page.MarginVertical(0);
            AddPageHeader(page, "Expense & Tax Analysis");
            AddPageFooter(page);

            page.Content().PaddingVertical(32).Column(col =>
            {
                col.Item().Text("Expense & Tax Analysis").FontSize(20).Bold().FontColor(NavyBlue);
                col.Item().Height(4);
                col.Item().Text("Reconciled expenditures and VAT breakdown by department").FontSize(10).FontColor(MidGray);
                col.Item().Height(24);

                // VAT summary box
                col.Item().Background(LightGray).Border(0.5f).BorderColor("#E2E8F0").Padding(20).Column(c =>
                {
                    c.Item().Text("VAT Summary").FontSize(12).Bold().FontColor(NavyBlue);
                    c.Item().Height(12);
                    c.Item().Row(r =>
                    {
                        foreach (var (label, value) in new[]
                        {
                            ("Gross Expenditure (with VAT)", FormatPeso(_data.TotalActual)),
                            ("Estimated Net (excl. VAT)", FormatPeso(_data.TotalActual - _data.TotalTax)),
                            ("Total VAT Capitalized", FormatPeso(_data.TotalTax)),
                            ("Effective VAT Rate", _data.TotalActual > 0 ? $"{Math.Round((_data.TotalTax / _data.TotalActual) * 100, 1)}%" : "0%"),
                        })
                        {
                            r.RelativeItem().Column(inner =>
                            {
                                inner.Item().Text(label).FontSize(8).FontColor(MidGray);
                                inner.Item().Height(4);
                                inner.Item().Text(value).FontSize(15).Bold().FontColor(DarkGray);
                            });
                        }
                    });
                });

                col.Item().Height(24);

                // Per-department expense table
                col.Item().Text("Expense breakdown by department").FontSize(13).Bold().FontColor(DarkGray);
                col.Item().Height(12);

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.RelativeColumn(3f);   // Department
                        cols.RelativeColumn(2f);   // Gross (with VAT)
                        cols.RelativeColumn(2f);   // VAT Amount
                        cols.RelativeColumn(2f);   // Net (excl. VAT)
                        cols.RelativeColumn(1.5f); // % of total spend
                    });

                    table.Header(h =>
                    {
                        foreach (var label in new[] { "Department", "Gross Spend", "VAT Paid", "Net Spend", "% of Total" })
                        {
                            h.Cell().Background(DarkGray).Padding(8)
                                .Text(label).FontSize(8.5f).Bold().FontColor(White);
                        }
                    });

                    bool alt = false;
                    foreach (var dept in _data.DeptRows)
                    {
                        var bg = alt ? LightGray : White;
                        alt = !alt;
                        var pct = _data.TotalActual > 0
                            ? Math.Round((dept.ActualSpent / _data.TotalActual) * 100, 1)
                            : 0;
                        var net = dept.ActualSpent - dept.TaxPaid;

                        table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0")
                            .Text(dept.Name ?? "").FontSize(9).Bold().FontColor(DarkGray);
                        table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0").AlignRight()
                            .Text(FormatPeso(dept.ActualSpent)).FontSize(8.5f).FontColor(DarkGray);
                        table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0").AlignRight()
                            .Text(FormatPeso(dept.TaxPaid)).FontSize(8.5f).FontColor(WarningAmber);
                        table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0").AlignRight()
                            .Text(FormatPeso(net)).FontSize(8.5f).FontColor(DarkGray);
                        table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0").AlignCenter()
                            .Text($"{pct}%").FontSize(8.5f).FontColor(MidGray);
                    }
                });
            });
        }

        // ─── PAGE 5: PENDING BUDGET RISK ─────────────────────────────────────────

        private void ComposePendingRisk(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.MarginHorizontal(48);
            page.MarginVertical(0);
            AddPageHeader(page, "Pending Budget Risk");
            AddPageFooter(page);

            page.Content().PaddingVertical(32).Column(col =>
            {
                col.Item().Text("Pending Budget Risk").FontSize(20).Bold().FontColor(NavyBlue);
                col.Item().Height(4);
                col.Item().Text("Proposals awaiting approval that may impact available funds").FontSize(10).FontColor(MidGray);
                col.Item().Height(24);

                if (!_data.PendingProposals.Any())
                {
                    col.Item().Background(LightGray).Border(0.5f).BorderColor("#E2E8F0")
                        .Padding(24).AlignCenter()
                        .Text("No pending proposals during this period.")
                        .FontSize(11).FontColor(MidGray);
                }
                else
                {
                    // Risk summary box
                    col.Item().Background("#FEF3C7").Border(0.5f).BorderColor("#FCD34D")
                        .Padding(16).Column(c =>
                        {
                            c.Item().Text("Uncommitted Pending Risk").FontSize(10).Bold().FontColor("#92400E");
                            c.Item().Height(4);
                            c.Item().Text(FormatPeso(_data.PendingRisk)).FontSize(24).Bold().FontColor("#92400E");
                            c.Item().Height(4);
                            c.Item().Text($"{_data.PendingProposals.Count} proposal(s) pending approval. If all are approved, available budget reduces by the above amount.")
                                .FontSize(9).FontColor("#A16207");
                        });

                    col.Item().Height(20);

                    col.Item().Table(table =>
                    {
                        table.ColumnsDefinition(cols =>
                        {
                            cols.RelativeColumn(3f);
                            cols.RelativeColumn(2f);
                            cols.RelativeColumn(2f);
                            cols.RelativeColumn(1.5f);
                        });

                        table.Header(h =>
                        {
                            foreach (var label in new[] { "Proposal Title", "Department", "Requested Amount", "Status" })
                            {
                                h.Cell().Background(WarningAmber).Padding(8)
                                    .Text(label).FontSize(8.5f).Bold().FontColor(White);
                            }
                        });

                        bool alt = false;
                        foreach (var p in _data.PendingProposals)
                        {
                            var bg = alt ? LightGray : White;
                            alt = !alt;
                            var dept = _data.DeptRows.FirstOrDefault(d => d.DepartmentId == p.DepartmentID);
                            table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0")
                                .Text(p.Title ?? "").FontSize(8.5f).FontColor(DarkGray);
                            table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0")
                                .Text(dept?.Name ?? "—").FontSize(8.5f).FontColor(MidGray);
                            table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0").AlignRight()
                                .Text(FormatPeso(p.RequestedAmount)).FontSize(8.5f).Bold().FontColor(DarkGray);
                            table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0").AlignCenter()
                                .Text(p.ProposalStatus ?? "").FontSize(8).FontColor(WarningAmber).Bold();
                        }
                    });
                }
            });
        }

        // ─── PAGE 6: AUDIT ACTIVITY ───────────────────────────────────────────────

        private void ComposeAuditActivity(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.MarginHorizontal(48);
            page.MarginVertical(0);
            AddPageHeader(page, "Recent Audit Activity");
            AddPageFooter(page);

            page.Content().PaddingVertical(32).Column(col =>
            {
                col.Item().Text("Recent Audit Activity").FontSize(20).Bold().FontColor(NavyBlue);
                col.Item().Height(4);
                col.Item().Text($"Last 10 recorded system events during {_data.PeriodLabel}").FontSize(10).FontColor(MidGray);
                col.Item().Height(24);

                col.Item().Table(table =>
                {
                    table.ColumnsDefinition(cols =>
                    {
                        cols.RelativeColumn(2.5f);
                        cols.RelativeColumn(2f);
                        cols.RelativeColumn(2f);
                        cols.RelativeColumn(3.5f);
                    });

                    table.Header(h =>
                    {
                        foreach (var label in new[] { "Timestamp", "Actor", "Action", "Target Resource" })
                        {
                            h.Cell().Background(NavyBlue).Padding(8)
                                .Text(label).FontSize(8.5f).Bold().FontColor(White);
                        }
                    });

                    bool alt = false;
                    foreach (var log in _data.RecentLogs)
                    {
                        var bg = alt ? LightGray : White;
                        alt = !alt;
                        table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0")
                            .Text(log.TimeStamp.ToString("yyyy-MM-dd HH:mm")).FontSize(8).FontColor(MidGray);
                        table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0")
                            .Text(log.Actor != null ? $"{log.Actor.FirstName} {log.Actor.LastName}" : "System").FontSize(8.5f).Bold().FontColor(DarkGray);
                        table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0")
                            .Text(log.ActionType ?? "").FontSize(8).FontColor(AccentBlue);
                        table.Cell().Background(bg).Padding(8).BorderBottom(0.5f).BorderColor("#E2E8F0")
                            .Text(log.TargetResources ?? "").FontSize(8).FontColor(DarkGray);
                    }
                });
            });
        }

        // ─── LAST PAGE: CERTIFICATION ─────────────────────────────────────────────

        private void ComposeCertification(PageDescriptor page)
        {
            page.Size(PageSizes.A4);
            page.MarginHorizontal(48);
            page.MarginVertical(0);
            AddPageHeader(page, "Certification & Integrity");
            AddPageFooter(page);

            page.Content().PaddingVertical(32).Column(col =>
            {
                col.Item().Text("Statement of Certification").FontSize(20).Bold().FontColor(NavyBlue);
                col.Item().Height(4);
                col.Item().Text("Digital certification of financial record integrity").FontSize(10).FontColor(MidGray);
                col.Item().Height(28);

                // Certification body text
                col.Item().Border(0.5f).BorderColor("#E2E8F0").Padding(24).Column(c =>
                {
                    c.Item().Text("Certification Statement").FontSize(12).Bold().FontColor(NavyBlue);
                    c.Item().Height(12);
                    c.Item().DefaultTextStyle(x => x.FontSize(10.5f).LineHeight(1.7f)).Text(text =>
                    {
                        text.Span($"I, {_data.GeneratorName}, authorized Finance Manager of ").FontColor(DarkGray);
                        text.Span($"{_data.CompanyName}").Bold().FontColor(DarkGray);
                        text.Span($", hereby certify that the financial data presented in this document — ").FontColor(DarkGray);
                        text.Span($"\"{_data.Title}\" ").Bold().FontColor(DarkGray);
                        text.Span($"covering the period {_data.PeriodLabel} — has been compiled directly from the NexaPlan financial management system and reflects the true and accurate state of organizational budget allocations, committed expenditures, and reconciled expenses as of ").FontColor(DarkGray);
                        text.Span($"{_data.GeneratedAt:MMMM dd, yyyy}").Bold().FontColor(DarkGray);
                        text.Span(".").FontColor(DarkGray);
                    });

                    c.Item().Height(20);
                    c.Item().Text("This document was generated automatically by the NexaPlan system and has not been manually altered. Its cryptographic integrity can be independently verified using the SHA-256 hash provided.").FontSize(9).FontColor(MidGray).LineHeight(1.5f);
                });

                col.Item().Height(32);

                // Signature block
                col.Item().Text("Authorization").FontSize(13).Bold().FontColor(DarkGray);
                col.Item().Height(16);
                col.Item().Row(row =>
                {
                    // Signer
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Height(40).BorderBottom(0.5f).BorderColor(DarkGray);
                        c.Item().Height(8);
                        c.Item().Text(_data.GeneratorName).FontSize(10).Bold().FontColor(DarkGray);
                        c.Item().Text("Finance Manager").FontSize(8).FontColor(MidGray);
                        c.Item().Text(_data.CompanyName).FontSize(8).FontColor(MidGray);
                        c.Item().Text(_data.GeneratedAt.ToString("MMMM dd, yyyy")).FontSize(8).FontColor(MidGray);
                    });

                    row.ConstantItem(60);

                    // Date box
                    row.RelativeItem().Column(c =>
                    {
                        c.Item().Height(40).BorderBottom(0.5f).BorderColor(DarkGray);
                        c.Item().Height(8);
                        c.Item().Text("Date of Generation").FontSize(10).Bold().FontColor(DarkGray);
                        c.Item().Text(_data.GeneratedAt.ToString("yyyy-MM-dd HH:mm:ss UTC")).FontSize(9).FontColor(MidGray);
                    });
                });

                col.Item().Height(40);

                // SHA-256 block — full hash
                col.Item().Background(LightGray).Border(0.5f).BorderColor("#E2E8F0").Padding(20).Column(c =>
                {
                    c.Item().Row(r =>
                    {
                        r.AutoItem().Text("DOCUMENT INTEGRITY HASH").FontSize(9).Bold().FontColor(SuccessGreen);
                        r.RelativeItem().AlignRight().Text("SHA-256 / Verified").FontSize(8).FontColor(MidGray);
                    });
                    c.Item().Height(8);
                    c.Item().Text(_data.Sha256Hash).FontFamily(Fonts.Courier).FontSize(9).FontColor(DarkGray);
                    c.Item().Height(8);
                    c.Item().Text("To verify: compute the SHA-256 hash of this document file and compare it to the value above. A match confirms this document has not been altered since it was generated by the NexaPlan system.").FontSize(8).FontColor(MidGray).LineHeight(1.5f);
                });

                col.Item().Height(32);

                // System info footer
                col.Item().BorderTop(0.5f).BorderColor("#E2E8F0").PaddingTop(16).Row(row =>
                {
                    row.RelativeItem().Text($"NexaPlan Financial Management System").FontSize(8).FontColor(MidGray);
                    row.RelativeItem().AlignRight().Text($"Document generated: {_data.GeneratedAt:yyyy-MM-dd HH:mm:ss} UTC").FontSize(8).FontColor(MidGray);
                });
            });
        }

        // ─── UTILITY ──────────────────────────────────────────────────────────────

        private static string FormatPeso(decimal amount)
            => $"₱{Math.Round(amount, 2):N2}";
    }
}
