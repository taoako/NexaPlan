using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexaPlan.API.Migrations
{
    /// <inheritdoc />
    public partial class AddFinancialStatementTaxAmount : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TaxAmount",
                table: "FinancialStatements",
                type: "decimal(18,2)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "TaxAmount",
                table: "FinancialStatements");
        }
    }
}
