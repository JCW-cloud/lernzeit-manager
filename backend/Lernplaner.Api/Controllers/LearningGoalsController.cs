using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Lernplaner.Api.Data;
using Lernplaner.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lernplaner.Api.Controllers;

[ApiController]
[Route("api/courses/{courseId:guid}/goals")]
[Authorize]
public class LearningGoalsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public LearningGoalsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<LearningGoalResponse>>> GetGoals(
        Guid courseId,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var goals = await _db.LearningGoals
            .AsNoTracking()
            .Where(g => g.CourseId == courseId)
            .OrderBy(g => g.TargetDate)
            .Select(g => new LearningGoalResponse(
                g.Id, g.CourseId, g.Title, g.Description,
                g.StartDate, g.TargetDate, g.TargetHours))
            .ToListAsync(cancellationToken);

        return Ok(goals);
    }

    [HttpGet("{goalId:guid}")]
    public async Task<ActionResult<LearningGoalResponse>> GetGoal(
        Guid courseId,
        Guid goalId,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var goal = await _db.LearningGoals
            .AsNoTracking()
            .Where(g => g.Id == goalId && g.CourseId == courseId)
            .Select(g => new LearningGoalResponse(
                g.Id, g.CourseId, g.Title, g.Description,
                g.StartDate, g.TargetDate, g.TargetHours))
            .SingleOrDefaultAsync(cancellationToken);

        if (goal is null)
            return NotFound();

        return Ok(goal);
    }

    [HttpPost]
    public async Task<ActionResult<LearningGoalResponse>> CreateGoal(
        Guid courseId,
        [FromBody] LearningGoalRequest request,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        if (!ValidateRequest(request))
            return ValidationProblem(ModelState);

        var goal = new LearningGoal
        {
            CourseId = courseId,
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            StartDate = request.StartDate,
            TargetDate = request.TargetDate,
            TargetHours = request.TargetHours
        };

        _db.LearningGoals.Add(goal);
        await _db.SaveChangesAsync(cancellationToken);

        var response = ToResponse(goal);

        return CreatedAtAction(
            nameof(GetGoal),
            new { courseId, goalId = goal.Id },
            response);
    }

    [HttpPut("{goalId:guid}")]
    public async Task<ActionResult<LearningGoalResponse>> UpdateGoal(
        Guid courseId,
        Guid goalId,
        [FromBody] LearningGoalRequest request,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var goal = await _db.LearningGoals
            .SingleOrDefaultAsync(
                g => g.Id == goalId && g.CourseId == courseId,
                cancellationToken);

        if (goal is null)
            return NotFound();

        if (!ValidateRequest(request))
            return ValidationProblem(ModelState);

        goal.Title = request.Title.Trim();
        goal.Description = request.Description?.Trim();
        goal.StartDate = request.StartDate;
        goal.TargetDate = request.TargetDate;
        goal.TargetHours = request.TargetHours;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(goal));
    }

    [HttpDelete("{goalId:guid}")]
    public async Task<IActionResult> DeleteGoal(
        Guid courseId,
        Guid goalId,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var goal = await _db.LearningGoals
            .SingleOrDefaultAsync(
                g => g.Id == goalId && g.CourseId == courseId,
                cancellationToken);

        if (goal is null)
            return NotFound();

        _db.LearningGoals.Remove(goal);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    private async Task<bool> OwnsCourse(
        Guid courseId,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
            return false;

        return await _db.Courses
            .AsNoTracking()
            .AnyAsync(
                c => c.Id == courseId && c.UserId == userId,
                cancellationToken);
    }

    private bool ValidateRequest(LearningGoalRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title))
        {
            ModelState.AddModelError(
                nameof(request.Title),
                "Der Titel darf nicht leer sein.");
        }

        if (request.StartDate == default)
        {
            ModelState.AddModelError(
                nameof(request.StartDate),
                "Ein gültiges Startdatum ist erforderlich.");
        }

        if (request.TargetDate == default)
        {
            ModelState.AddModelError(
                nameof(request.TargetDate),
                "Ein gültiges Zieldatum ist erforderlich.");
        }

        if (request.TargetDate < request.StartDate)
        {
            ModelState.AddModelError(
                nameof(request.TargetDate),
                "Das Zieldatum darf nicht vor dem Startdatum liegen.");
        }

        if (request.TargetHours is <= 0)
        {
            ModelState.AddModelError(
                nameof(request.TargetHours),
                "Die Zielstunden müssen größer als null sein.");
        }

        return ModelState.IsValid;
    }

    private static LearningGoalResponse ToResponse(LearningGoal goal)
    {
        return new LearningGoalResponse(
            goal.Id,
            goal.CourseId,
            goal.Title,
            goal.Description,
            goal.StartDate,
            goal.TargetDate,
            goal.TargetHours);
    }

    public record LearningGoalRequest(
        [Required]
        [StringLength(150, MinimumLength = 1)]
        string Title,

        [StringLength(1000)]
        string? Description,

        DateOnly StartDate,

        DateOnly TargetDate,

        [Range(typeof(decimal), "0.01", "99999.99", ParseLimitsInInvariantCulture = true)]
        decimal? TargetHours
    );

    public record LearningGoalResponse(
        Guid Id,
        Guid CourseId,
        string Title,
        string? Description,
        DateOnly StartDate,
        DateOnly TargetDate,
        decimal? TargetHours
    );
}