using Microsoft.EntityFrameworkCore;
using NexaPlan.API.Data;
using NexaPlan.API.Models;

var builder = WebApplication.CreateBuilder(args);

// --- 1. DATABASE CONNECTION CONFIGURATION ---
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMySql(connectionString, ServerVersion.AutoDetect(connectionString)));

// --- 2. SERVICES (Add all services BEFORE building) ---
builder.Services.AddControllers();
builder.Services.AddHttpClient();


builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReactApp",
        policy =>
        {
            policy.WithOrigins("http://localhost:5173")
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
    if (db.Roles.Any())
    {
        return;
    }

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

app.Run();