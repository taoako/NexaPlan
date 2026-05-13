using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

var builder = WebApplication.CreateBuilder(args);

// --- 1. DATABASE CONNECTION CONFIGURATION ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString), mySqlOptions =>
    {
        mySqlOptions.EnableRetryOnFailure();
    }));

// --- 2. SERVICES (Add all services BEFORE building) ---
builder.Services.AddControllers();
builder.Services.AddHttpClient();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.AllowAnyOrigin()
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- BUILD THE APP (Only do this ONCE) ---
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
    SeedReferenceData(db);
}

// --- 3. HTTP REQUEST PIPELINE (Use the app AFTER building) ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// app.UseHttpsRedirection();

// Enable CORS before mapping controllers
app.UseCors("AllowReactApp");

app.MapControllers();

static void SeedReferenceData(AppDbContext db)
{
    if (!db.Roles.Any())
    {
        db.Roles.AddRange(
            new Role { RoleName = "Super Admin" },
            new Role { RoleName = "Main Admin" },
            new Role { RoleName = "Finance Manager" },
            new Role { RoleName = "Department Head" },
            new Role { RoleName = "Auditor" },
            new Role { RoleName = "Viewer" }
        );
        db.SaveChanges();
    }

    // Seed default system configs if they don't exist
    if (!db.SystemConfigs.Any())
    {
        db.SystemConfigs.AddRange(
            new SystemConfig { ConfigKey = "mfa_enabled", ConfigValue = "true" },
            new SystemConfig { ConfigKey = "ssl_enabled", ConfigValue = "true" },
            new SystemConfig { ConfigKey = "ml_enabled", ConfigValue = "true" },
            new SystemConfig { ConfigKey = "maintenance_mode", ConfigValue = "false" },
            new SystemConfig { ConfigKey = "api_rate_limit", ConfigValue = "1000" },
            new SystemConfig { ConfigKey = "jwt_expiration_hours", ConfigValue = "24" },
            new SystemConfig { ConfigKey = "max_failed_logins", ConfigValue = "5" },
            new SystemConfig { ConfigKey = "session_timeout_minutes", ConfigValue = "60" },
            new SystemConfig { ConfigKey = "ml_confidence_threshold", ConfigValue = "85" },
            new SystemConfig { ConfigKey = "ml_training_cycle", ConfigValue = "Weekly" },
            new SystemConfig { ConfigKey = "api_timeout_ms", ConfigValue = "4000" },
            new SystemConfig { ConfigKey = "max_export_rows", ConfigValue = "50000" },
            // Pricing tiers (PHP)
            new SystemConfig { ConfigKey = "price_starter_monthly", ConfigValue = "4950" },
            new SystemConfig { ConfigKey = "price_starter_annual", ConfigValue = "4207.50" },
            new SystemConfig { ConfigKey = "price_professional_monthly", ConfigValue = "12900" },
            new SystemConfig { ConfigKey = "price_professional_annual", ConfigValue = "10965" },
            new SystemConfig { ConfigKey = "price_enterprise_monthly", ConfigValue = "29900" },
            new SystemConfig { ConfigKey = "price_enterprise_annual", ConfigValue = "25415" },
            new SystemConfig { ConfigKey = "pricing_vat_inclusive", ConfigValue = "true" }
        );
        db.SaveChanges();
    }
}

app.Run();