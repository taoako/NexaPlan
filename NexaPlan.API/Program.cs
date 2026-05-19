using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using NexaPlan.API.Configuration;
using NexaPlan.API.Data;
using NexaPlan.API.Models;
using QuestPDF.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

// --- 1. DATABASE CONNECTION CONFIGURATION ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

var serverVersionText = builder.Configuration["Database:ServerVersion"];
var serverVersion = !string.IsNullOrWhiteSpace(serverVersionText)
    ? ServerVersion.Parse(serverVersionText)
    : ServerVersion.Parse("8.0.36-mysql");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, serverVersion, mySqlOptions =>
    {
        mySqlOptions.EnableRetryOnFailure();
    }));

// --- 2. SERVICES (Add all services BEFORE building) ---
builder.Services.AddControllers();

builder.Services.Configure<FrontendOptions>(builder.Configuration.GetSection(FrontendOptions.SectionName));
builder.Services.Configure<ExternalServicesOptions>(builder.Configuration.GetSection(ExternalServicesOptions.SectionName));

builder.Services.AddHttpClient();
builder.Services.AddHttpClient("MlService", (sp, client) =>
{
    var opts = sp.GetRequiredService<IOptions<ExternalServicesOptions>>().Value;
    var baseUrl = opts.MlService.BaseUrl;
    if (string.IsNullOrWhiteSpace(baseUrl))
    {
        baseUrl = builder.Configuration["ML_SERVICE_URL"]
            ?? builder.Configuration["ML_BASE_URL"];

        if (string.IsNullOrWhiteSpace(baseUrl) && builder.Environment.IsProduction())
        {
            baseUrl = "https://nexaplan-ml-engine.onrender.com";
        }
    }

    if (!string.IsNullOrWhiteSpace(baseUrl))
    {
        client.BaseAddress = new Uri(baseUrl.TrimEnd('/') + "/");
    }

    client.Timeout = TimeSpan.FromSeconds(30);
});

builder.Services.AddHttpClient("PayMongo", (sp, client) =>
{
    var opts = sp.GetRequiredService<IOptions<ExternalServicesOptions>>().Value;
    if (!string.IsNullOrWhiteSpace(opts.PayMongo.BaseUrl))
    {
        client.BaseAddress = new Uri(opts.PayMongo.BaseUrl.TrimEnd('/') + "/");
    }
});

builder.Services.AddCors(options =>
{
    options.AddPolicy(FrontendOptions.CorsPolicyName, policy =>
    {
        var frontend = builder.Configuration.GetSection(FrontendOptions.SectionName).Get<FrontendOptions>() ?? new();
        var origins = (frontend.AllowedOrigins != null && frontend.AllowedOrigins.Length > 0)
            ? frontend.AllowedOrigins
            : new[] { frontend.BaseUrl };

        policy.WithOrigins(origins)
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// --- BUILD THE APP (Only do this ONCE) ---
QuestPDF.Settings.License = LicenseType.Community;
var app = builder.Build();

var skipMigrations = builder.Configuration.GetValue<bool>("Database:SkipMigrations");
if (!skipMigrations)
{
    try
    {
        using var scope = app.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        db.Database.Migrate();

        // Cleanup garbage pitch scenarios from Dept Head bug
        db.Database.ExecuteSqlRaw("DELETE FROM BudgetScenarios WHERE Description LIKE '%PITCH_DECISIONS%' OR Description LIKE '%ProposalId%';");

        SeedReferenceData(db);

        if (builder.Configuration.GetValue<bool>("Database:SeedDemoData"))
        {
            DemoDataSeeder.Seed(db);
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogError(ex, "Database migration failed. Set Database:SkipMigrations=true to bypass during local startup.");
    }
}

// --- 3. HTTP REQUEST PIPELINE (Use the app AFTER building) ---
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

// Enable CORS before mapping controllers
app.UseCors(FrontendOptions.CorsPolicyName);

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