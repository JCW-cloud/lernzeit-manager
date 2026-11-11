using System.Security.Claims;
using Lernplaner.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lernplaner.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/reminders")]
public class RemindersController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public RemindersController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet("upcoming")]
    public async Task<ActionResult<UpcomingRemindersResponse>> GetUpcoming(
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
            return Unauthorized();

        var timeZone = TimeZoneInfo.FindSystemTimeZoneById("Europe/Berlin");
        var now = TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, timeZone);

        var sessionLimit = now.AddHours(24);
        var goalLimitDate = DateOnly.FromDateTime(now.AddDays(3));

        var today = DateOnly.FromDateTime(now);

        var plannedSessions = await _db.PlannedStudySessions
            .AsNoTracking()
            .Where(s =>
                s.Course.UserId == userId &&
                s.Date >= today &&
                s.Date <= DateOnly.FromDateTime(sessionLimit))
            .OrderBy(s => s.Date)
            .ThenBy(s => s.StartTime)
            .Select(s => new UpcomingStudySessionResponse(
                s.Id,
                s.CourseId,
                s.Course.Title,
                s.Date,
                s.StartTime,
                s.PlannedDurationMinutes,
                s.Note))
            .ToListAsync(cancellationToken);

        // Termine entfernen, die heute bereits vorbei sind,
        // sowie Termine außerhalb des 24h-Fensters.
        plannedSessions = plannedSessions
            .Where(s =>
            {
                var start = s.Date.ToDateTime(s.StartTime);

                return start >= now && start <= sessionLimit;
            })
            .ToList();

        var goals = await _db.LearningGoals
            .AsNoTracking()
            .Where(g =>
                g.Course.UserId == userId &&
                !g.IsCompleted &&
                g.TargetDate >= today &&
                g.TargetDate <= goalLimitDate)
            .OrderBy(g => g.TargetDate)
            .Select(g => new UpcomingGoalResponse(
                g.Id,
                g.CourseId,
                g.Course.Title,
                g.Title,
                g.TargetDate))
            .ToListAsync(cancellationToken);

        return Ok(new UpcomingRemindersResponse(
            plannedSessions,
            goals));
    }

    public record UpcomingRemindersResponse(
        List<UpcomingStudySessionResponse> PlannedSessions,
        List<UpcomingGoalResponse> Goals
    );

    public record UpcomingStudySessionResponse(
        Guid Id,
        Guid CourseId,
        string CourseTitle,
        DateOnly Date,
        TimeOnly StartTime,
        int PlannedDurationMinutes,
        string? Note
    );

    public record UpcomingGoalResponse(
        Guid Id,
        Guid CourseId,
        string CourseTitle,
        string Title,
        DateOnly TargetDate
    );
}