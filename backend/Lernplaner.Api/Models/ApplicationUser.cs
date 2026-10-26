using Microsoft.AspNetCore.Identity;

namespace Lernplaner.Api.Models;

// IdentityUser enthält bereits alle relevanten User-Eigenschaften und übernimmt das Passwort-Hashing
public class ApplicationUser : IdentityUser
{
    // Anzeigename für Frontend, falls benötigt
    public string? DisplayName { get; set; }

    // Erstellungszeitpunkt in UTC-Zeit
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}
