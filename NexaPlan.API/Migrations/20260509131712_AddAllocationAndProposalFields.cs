using System;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexaPlan.API.Migrations
{
    /// <inheritdoc />
    public partial class AddAllocationAndProposalFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsTaxInclusive",
                table: "BudgetProposals",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "PriorityRank",
                table: "BudgetProposals",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "RequestedAmount",
                table: "BudgetProposals",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.CreateTable(
                name: "DepartmentAllocations",
                columns: table => new
                {
                    AllocationID = table.Column<int>(type: "int", nullable: false)
                        .Annotation("MySql:ValueGenerationStrategy", MySqlValueGenerationStrategy.IdentityColumn),
                    TenantID = table.Column<int>(type: "int", nullable: false),
                    DepartmentID = table.Column<int>(type: "int", nullable: false),
                    FiscalYear = table.Column<int>(type: "int", nullable: false),
                    TotalAllocatedCap = table.Column<decimal>(type: "decimal(65,30)", nullable: false),
                    SetByAdminID = table.Column<int>(type: "int", nullable: false),
                    SetAt = table.Column<DateTime>(type: "datetime(6)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DepartmentAllocations", x => x.AllocationID);
                    table.ForeignKey(
                        name: "FK_DepartmentAllocations_Departments_DepartmentID",
                        column: x => x.DepartmentID,
                        principalTable: "Departments",
                        principalColumn: "DepartmentID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DepartmentAllocations_Tenants_TenantID",
                        column: x => x.TenantID,
                        principalTable: "Tenants",
                        principalColumn: "TenantID",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DepartmentAllocations_Users_SetByAdminID",
                        column: x => x.SetByAdminID,
                        principalTable: "Users",
                        principalColumn: "UserID",
                        onDelete: ReferentialAction.Cascade);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.CreateIndex(
                name: "IX_DepartmentAllocations_DepartmentID",
                table: "DepartmentAllocations",
                column: "DepartmentID");

            migrationBuilder.CreateIndex(
                name: "IX_DepartmentAllocations_SetByAdminID",
                table: "DepartmentAllocations",
                column: "SetByAdminID");

            migrationBuilder.CreateIndex(
                name: "IX_DepartmentAllocations_TenantID",
                table: "DepartmentAllocations",
                column: "TenantID");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DepartmentAllocations");

            migrationBuilder.DropColumn(
                name: "IsTaxInclusive",
                table: "BudgetProposals");

            migrationBuilder.DropColumn(
                name: "PriorityRank",
                table: "BudgetProposals");

            migrationBuilder.DropColumn(
                name: "RequestedAmount",
                table: "BudgetProposals");
        }
    }
}
