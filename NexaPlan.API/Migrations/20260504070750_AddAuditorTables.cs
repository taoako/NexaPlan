using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexaPlan.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAuditorTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Clean up partially created schema from previous failed run
            migrationBuilder.Sql("DROP TABLE IF EXISTS `StatementAccessLogs`;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS `ComplianceRules`;");
            migrationBuilder.Sql("DROP TABLE IF EXISTS `FinancialStatements`;");
            // migrationBuilder.DropForeignKey(
            //     name: "FK_Expenses_Users_SubmittedBy",
            //     table: "Expenses");

            // Use IF NOT EXISTS guards — columns may already exist from a previously failed migration attempt.
            migrationBuilder.Sql("ALTER TABLE `AuditLogs` ADD COLUMN IF NOT EXISTS `FlagReason` longtext CHARACTER SET utf8mb4 NULL;");
            migrationBuilder.Sql("ALTER TABLE `AuditLogs` ADD COLUMN IF NOT EXISTS `FlaggedAt` datetime(6) NULL;");
            migrationBuilder.Sql("ALTER TABLE `AuditLogs` ADD COLUMN IF NOT EXISTS `FlaggedBy` int NULL;");
            migrationBuilder.Sql("ALTER TABLE `AuditLogs` ADD COLUMN IF NOT EXISTS `IsFlagged` tinyint(1) NOT NULL DEFAULT 0;");

            migrationBuilder.CreateTable(
                name: "ComplianceRules",
                columns: table => new
                {
                    RuleID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenantID = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Description = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    RuleType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Threshold = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    IsActive = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    IsSystemDefault = table.Column<bool>(type: "tinyint(1)", nullable: false),
                    CreatedBy = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ComplianceRules", x => x.RuleID);
                    table.ForeignKey(
                        name: "FK_ComplianceRules_Tenants_TenantID",
                        column: x => x.TenantID,
                        principalTable: "Tenants",
                        principalColumn: "TenantID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ComplianceRules_Users_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Users",
                        principalColumn: "UserID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "FinancialStatements",
                columns: table => new
                {
                    StatementID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenantID = table.Column<int>(type: "int", nullable: false),
                    Name = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FileType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FilePath = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    FileSize = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    Sha256Hash = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    CreatedBy = table.Column<int>(type: "int", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FinancialStatements", x => x.StatementID);
                    table.ForeignKey(
                        name: "FK_FinancialStatements_Tenants_TenantID",
                        column: x => x.TenantID,
                        principalTable: "Tenants",
                        principalColumn: "TenantID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_FinancialStatements_Users_CreatedBy",
                        column: x => x.CreatedBy,
                        principalTable: "Users",
                        principalColumn: "UserID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateTable(
                name: "StatementAccessLogs",
                columns: table => new
                {
                    AccessID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    StatementID = table.Column<int>(type: "int", nullable: false),
                    TenantID = table.Column<int>(type: "int", nullable: false),
                    UserID = table.Column<int>(type: "int", nullable: false),
                    AccessType = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    IPAddress = table.Column<string>(type: "longtext", nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    AccessedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StatementAccessLogs", x => x.AccessID);
                    table.ForeignKey(
                        name: "FK_StatementAccessLogs_FinancialStatements_StatementID",
                        column: x => x.StatementID,
                        principalTable: "FinancialStatements",
                        principalColumn: "StatementID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_StatementAccessLogs_Users_UserID",
                        column: x => x.UserID,
                        principalTable: "Users",
                        principalColumn: "UserID");
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            // Use IF NOT EXISTS for indexes that may already exist from the failed first attempt.
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS `IX_AuditLogs_FlaggedBy` ON `AuditLogs` (`FlaggedBy`);");
            migrationBuilder.Sql("CREATE INDEX IF NOT EXISTS `IX_AuditLogs_UserID`   ON `AuditLogs` (`UserID`);");

            migrationBuilder.CreateIndex(
                name: "IX_ComplianceRules_CreatedBy",
                table: "ComplianceRules",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_ComplianceRules_TenantID",
                table: "ComplianceRules",
                column: "TenantID");

            migrationBuilder.CreateIndex(
                name: "IX_FinancialStatements_CreatedBy",
                table: "FinancialStatements",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_FinancialStatements_TenantID",
                table: "FinancialStatements",
                column: "TenantID");

            migrationBuilder.CreateIndex(
                name: "IX_StatementAccessLogs_StatementID",
                table: "StatementAccessLogs",
                column: "StatementID");

            migrationBuilder.CreateIndex(
                name: "IX_StatementAccessLogs_UserID",
                table: "StatementAccessLogs",
                column: "UserID");

            // migrationBuilder.AddForeignKey(
            //     name: "FK_AuditLogs_Users_FlaggedBy",
            //     table: "AuditLogs",
            //     column: "FlaggedBy",
            //     principalTable: "Users",
            //     principalColumn: "UserID");

            // migrationBuilder.AddForeignKey(
            //     name: "FK_AuditLogs_Users_UserID",
            //     table: "AuditLogs",
            //     column: "UserID",
            //     principalTable: "Users",
            //     principalColumn: "UserID");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_Users_SubmittedBy",
                table: "Expenses",
                column: "SubmittedBy",
                principalTable: "Users",
                principalColumn: "UserID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Users_FlaggedBy",
                table: "AuditLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_AuditLogs_Users_UserID",
                table: "AuditLogs");

            migrationBuilder.DropForeignKey(
                name: "FK_Expenses_Users_SubmittedBy",
                table: "Expenses");

            migrationBuilder.DropTable(
                name: "ComplianceRules");

            migrationBuilder.DropTable(
                name: "StatementAccessLogs");

            migrationBuilder.DropTable(
                name: "FinancialStatements");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_FlaggedBy",
                table: "AuditLogs");

            migrationBuilder.DropIndex(
                name: "IX_AuditLogs_UserID",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "FlagReason",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "FlaggedAt",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "FlaggedBy",
                table: "AuditLogs");

            migrationBuilder.DropColumn(
                name: "IsFlagged",
                table: "AuditLogs");

            migrationBuilder.AddForeignKey(
                name: "FK_Expenses_Users_SubmittedBy",
                table: "Expenses",
                column: "SubmittedBy",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
