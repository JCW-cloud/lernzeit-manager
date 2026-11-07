using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Lernplaner.Api.Data;
using Lernplaner.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lernplaner.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/courses/{courseId:guid}/planned-sessions")]
public class PlannedStudySessionsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public PlannedStudySessionsController(ApplicationDbContext db)
    {
        _db = db;
    }

    [HttpGet]
    public async Task<ActionResult<List<PlannedStudySessionResponse>>> GetPlannedSessions(
        Guid courseId,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var sessions = await _db.PlannedStudySessions
            .AsNoTracking()
            .Where(s => s.CourseId == courseId)
            .OrderBy(s => s.Date)
            .ThenBy(s => s.StartTime)
            .Select(s => new PlannedStudySessionResponse(
                s.Id,
                s.CourseId,
                s.Date,
                s.StartTime,
                s.PlannedDurationMinutes,
                s.Note))
            .ToListAsync(cancellationToken);

        return Ok(sessions);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<PlannedStudySessionResponse>> GetPlannedSession(
        Guid courseId,
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var session = await _db.PlannedStudySessions
            .AsNoTracking()
            .Where(s => s.Id == id && s.CourseId == courseId)
            .Select(s => new PlannedStudySessionResponse(
                s.Id,
                s.CourseId,
                s.Date,
                s.StartTime,
                s.PlannedDurationMinutes,
                s.Note))
            .SingleOrDefaultAsync(cancellationToken);

        if (session is null)
            return NotFound();

        return Ok(session);
    }

    [HttpPost]
    public async Task<ActionResult<PlannedStudySessionResponse>> CreatePlannedSession(
        Guid courseId,
        [FromBody] PlannedStudySessionRequest request,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        if (!ValidateRequest(request))
            return ValidationProblem(ModelState);

        var session = new PlannedStudySession
        {
            CourseId = courseId,
            Date = request.Date,
            StartTime = request.StartTime,
            PlannedDurationMinutes = request.PlannedDurationMinutes,
            Note = request.Note?.Trim()
        };

        _db.PlannedStudySessions.Add(session);
        await _db.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(
            nameof(GetPlannedSession),
            new { courseId, id = session.Id },
            ToResponse(session));
    }

    [HttpPut("{id:guid}")]
    public async Task<ActionResult<PlannedStudySessionResponse>> UpdatePlannedSession(
        Guid courseId,
        Guid id,
        [FromBody] PlannedStudySessionRequest request,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var session = await _db.PlannedStudySessions
            .SingleOrDefaultAsync(
                s => s.Id == id && s.CourseId == courseId,
                cancellationToken);

        if (session is null)
            return NotFound();

        if (!ValidateRequest(request))
            return ValidationProblem(ModelState);

        session.Date = request.Date;
        session.StartTime = request.StartTime;
        session.PlannedDurationMinutes = request.PlannedDurationMinutes;
        session.Note = request.Note?.Trim();

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(session));
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeletePlannedSession(
        Guid courseId,
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var session = await _db.PlannedStudySessions
            .SingleOrDefaultAsync(
                s => s.Id == id && s.CourseId == courseId,
                cancellationToken);

        if (session is null)
            return NotFound();

        _db.PlannedStudySessions.Remove(session);
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

    private bool ValidateRequest(PlannedStudySessionRequest request)
    {
        if (request.Date == default)
        {
            ModelState.AddModelError(
                nameof(request.Date),
                "Ein gültiges Datum ist erforderlich.");
        }

        if (request.PlannedDurationMinutes <= 0)
        {
            ModelState.AddModelError(
                nameof(request.PlannedDurationMinutes),
                "Die geplante Dauer muss größer als null sein.");
        }

        if (request.PlannedDurationMinutes > 1440)
        {
            ModelState.AddModelError(
                nameof(request.PlannedDurationMinutes),
                "Die geplante Dauer darf 1440 Minuten nicht überschreiten.");
        }

        return ModelState.IsValid;
    }

    private static PlannedStudySessionResponse ToResponse(
        PlannedStudySession session)
    {
        return new PlannedStudySessionResponse(
            session.Id,
            session.CourseId,
            session.Date,
            session.StartTime,
            session.PlannedDurationMinutes,
            session.Note);
    }

    public record PlannedStudySessionRequest(
        DateOnly Date,

        TimeOnly StartTime,

        [Range(1, 1440)]
        int PlannedDurationMinutes,

        [StringLength(500)]
        string? Note
    );

    public record PlannedStudySessionResponse(
        Guid Id,
        Guid CourseId,
        DateOnly Date,
        TimeOnly StartTime,
        int PlannedDurationMinutes,
        string? Note
    );
}