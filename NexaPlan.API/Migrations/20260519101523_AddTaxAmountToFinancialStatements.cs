using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexaPlan.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTaxAmountToFinancialStatements : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "TaxAmount",
                table: "FinancialStatements",
                type: "decimal(65,30)",
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
