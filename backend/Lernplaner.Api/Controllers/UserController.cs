using System.Security.Claims;
using Lernplaner.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lernplaner.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize] // Schützt den Endpoint vor unauthentifizierten Zugriffen
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public UsersController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ProfileResponse>> GetMe(
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier); //sucht UserID in Authentifizierungsinformationen

        if (userId is null)
        {
            return Unauthorized();
        }

        var user = await _db.Users
            .AsNoTracking() // lesender Zugriff
            .SingleOrDefaultAsync(
                u => u.Id == userId,
                cancellationToken);

        if (user is null)
        {
            return NotFound();
        }

        return Ok(new ProfileResponse(
            user.Id,
            user.Email,
            user.DisplayName,
            user.CreatedAtUtc));
    }

    public record ProfileResponse( //gib lediglich unkritische/relevante Daten zurück (PW-Hash wird nicht ausgegeben)
        string Id,
        string? Email,
        string? DisplayName,
        DateTime CreatedAtUtc);
}