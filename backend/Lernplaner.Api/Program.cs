using Lernplaner.Api.Data;
using Lernplaner.Api.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Authentication.BearerToken;
using Microsoft.Extensions.Options;

var builder = WebApplication.CreateBuilder(args);

// Datenbankverbindung herstellen
var connectionString =
    builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException(
        "Connection string 'DefaultConnection' wurde nicht konfiguriert.");

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseMySql(
        connectionString,
        ServerVersion.AutoDetect(connectionString)));

// ASP.NET Core Identity
builder.Services
    .AddIdentityApiEndpoints<ApplicationUser>(options =>
    {
        options.User.RequireUniqueEmail = true;

        options.Password.RequiredLength = 12;
        options.Password.RequireDigit = true;
        options.Password.RequireUppercase = true;
        options.Password.RequireLowercase = true;
        options.Password.RequireNonAlphanumeric = false;
    })
    .AddEntityFrameworkStores<ApplicationDbContext>();

builder.Services.AddAuthorization();

builder.Services.Configure<BearerTokenOptions>(
    IdentityConstants.BearerScheme,
    options =>
    {
        options.BearerTokenExpiration = TimeSpan.FromHours(8);
    }
);

// Controller und OpenAPI
builder.Services
    .AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new JsonStringEnumConverter());
    });
builder.Services.AddOpenApi();

var app = builder.Build();

// HTTP-Pipeline
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

// Prüft Berechtigungen für Zugriff auf Endpoints
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Identity-Endpunkte, z. B. Registrierung und Anmeldung
app.MapGroup("/api/auth")
    .MapIdentityApi<ApplicationUser>();

app.Run();