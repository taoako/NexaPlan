using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexaPlan.API.Migrations
{
    /// <inheritdoc />
    public partial class BudgetSystemUpdate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BudgetScenarios_Departments_DepartmentID",
                table: "BudgetScenarios");

            migrationBuilder.DropIndex(
                name: "IX_BudgetScenarios_DepartmentID",
                table: "BudgetScenarios");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "BudgetProposals");

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "LineItems",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<decimal>(
                name: "AdjustmentMultiplier",
                table: "BudgetScenarios",
                type: "decimal(65,30)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "CreatedBy",
                table: "BudgetScenarios",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "BudgetScenarios",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<bool>(
                name: "IsActive",
                table: "BudgetScenarios",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "TenantID",
                table: "BudgetScenarios",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "BudgetProposals",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Justification",
                table: "BudgetProposals",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "Priority",
                table: "BudgetProposals",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ProposalStatus",
                table: "BudgetProposals",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "ReviewNotes",
                table: "BudgetProposals",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "SubmittedAt",
                table: "BudgetProposals",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "BudgetProposals",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAt",
                table: "BudgetProposals",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.CreateIndex(
                name: "IX_BudgetScenarios_CreatedBy",
                table: "BudgetScenarios",
                column: "CreatedBy");

            migrationBuilder.CreateIndex(
                name: "IX_BudgetScenarios_TenantID",
                table: "BudgetScenarios",
                column: "TenantID");

            migrationBuilder.AddForeignKey(
                name: "FK_BudgetScenarios_Tenants_TenantID",
                table: "BudgetScenarios",
                column: "TenantID",
                principalTable: "Tenants",
                principalColumn: "TenantID",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_BudgetScenarios_Users_CreatedBy",
                table: "BudgetScenarios",
                column: "CreatedBy",
                principalTable: "Users",
                principalColumn: "UserID",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BudgetScenarios_Tenants_TenantID",
                table: "BudgetScenarios");

            migrationBuilder.DropForeignKey(
                name: "FK_BudgetScenarios_Users_CreatedBy",
                table: "BudgetScenarios");

            migrationBuilder.DropIndex(
                name: "IX_BudgetScenarios_CreatedBy",
                table: "BudgetScenarios");

            migrationBuilder.DropIndex(
                name: "IX_BudgetScenarios_TenantID",
                table: "BudgetScenarios");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "LineItems");

            migrationBuilder.DropColumn(
                name: "AdjustmentMultiplier",
                table: "BudgetScenarios");

            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "BudgetScenarios");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "BudgetScenarios");

            migrationBuilder.DropColumn(
                name: "IsActive",
                table: "BudgetScenarios");

            migrationBuilder.DropColumn(
                name: "TenantID",
                table: "BudgetScenarios");

            migrationBuilder.DropColumn(
                name: "Category",
                table: "BudgetProposals");

            migrationBuilder.DropColumn(
                name: "Justification",
                table: "BudgetProposals");

            migrationBuilder.DropColumn(
                name: "Priority",
                table: "BudgetProposals");

            migrationBuilder.DropColumn(
                name: "ProposalStatus",
                table: "BudgetProposals");

            migrationBuilder.DropColumn(
                name: "ReviewNotes",
                table: "BudgetProposals");

            migrationBuilder.DropColumn(
                name: "SubmittedAt",
                table: "BudgetProposals");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "BudgetProposals");

            migrationBuilder.DropColumn(
                name: "UpdatedAt",
                table: "BudgetProposals");

            migrationBuilder.AddColumn<bool>(
                name: "Status",
                table: "BudgetProposals",
                type: "tinyint(1)",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateIndex(
                name: "IX_BudgetScenarios_DepartmentID",
                table: "BudgetScenarios",
                column: "DepartmentID");

            migrationBuilder.AddForeignKey(
                name: "FK_BudgetScenarios_Departments_DepartmentID",
                table: "BudgetScenarios",
                column: "DepartmentID",
                principalTable: "Departments",
                principalColumn: "DepartmentID",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
