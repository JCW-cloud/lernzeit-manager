
using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Lernplaner.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lernplaner.Api.Controllers;

[ApiController]
[Route("api/users")]
[Authorize] // Schützt den Endpoint vor unauthentifizierten Zugriffen
public class UsersController : ControllerBase
{
    private readonly ApplicationDbContext _db;
    private readonly UserManager<Models.ApplicationUser> _userManager;

    public UsersController(
        ApplicationDbContext db,
        UserManager<Models.ApplicationUser> userManager)
    {
        _db = db;
        _userManager = userManager;
    }

    [HttpGet("me")]
    public async Task<ActionResult<ProfileResponse>> GetMe(
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
            return Unauthorized();

        var user = await _db.Users
            .AsNoTracking()
            .SingleOrDefaultAsync(
                u => u.Id == userId,
                cancellationToken);

        if (user is null)
            return NotFound();

        return Ok(new ProfileResponse(
            user.Id,
            user.Email,
            user.DisplayName,
            user.CreatedAtUtc));
    }

    [HttpPut("me")]
    public async Task<ActionResult<ProfileResponse>> UpdateMe(
        UpdateProfileRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return NotFound();

        user.DisplayName = request.DisplayName.Trim();

        var result = await _userManager.UpdateAsync(user);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(error.Code, error.Description);

            return ValidationProblem(ModelState);
        }

        return Ok(new ProfileResponse(
            user.Id,
            user.Email,
            user.DisplayName,
            user.CreatedAtUtc));
    }


    [HttpPost("me/change-password")]
    public async Task<IActionResult> ChangePassword(
        ChangePasswordRequest request)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
            return Unauthorized();

        var user = await _userManager.FindByIdAsync(userId);

        if (user is null)
            return NotFound();

        var result = await _userManager.ChangePasswordAsync(
            user,
            request.CurrentPassword,
            request.NewPassword);

        if (!result.Succeeded)
        {
            foreach (var error in result.Errors)
                ModelState.AddModelError(error.Code, error.Description);

            return ValidationProblem(ModelState);
        }

        return NoContent();
    }


    public record UpdateProfileRequest(
        [Required]
        [StringLength(80, MinimumLength = 2)]
        string DisplayName);

    public record ProfileResponse(
        string Id,
        string? Email,
        string? DisplayName,
        DateTime CreatedAtUtc);


    public record ChangePasswordRequest(
        [Required]
         string CurrentPassword,

        [Required]
        [StringLength(100, MinimumLength = 12)]
        string NewPassword);

}
