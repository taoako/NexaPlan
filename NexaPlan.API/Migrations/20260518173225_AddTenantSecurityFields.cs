using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace NexaPlan.API.Migrations
{
    /// <inheritdoc />
    public partial class AddTenantSecurityFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "MaxFailedLoginAttempts",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "MinPasswordLength",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "NotificationPreferences",
                table: "Tenants",
                type: "longtext",
                nullable: true)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<string>(
                name: "OrgLabel",
                table: "Tenants",
                type: "longtext",
                nullable: false)
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.AddColumn<int>(
                name: "SessionTimeoutMinutes",
                table: "Tenants",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MaxFailedLoginAttempts",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "MinPasswordLength",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "NotificationPreferences",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "OrgLabel",
                table: "Tenants");

            migrationBuilder.DropColumn(
                name: "SessionTimeoutMinutes",
                table: "Tenants");
        }
    }
}
