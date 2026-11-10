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
[Route("api/courses/{courseId:guid}/study-sessions")]
public class StudySessionsController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public StudySessionsController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET /api/courses/{courseId}/study-sessions
    [HttpGet]
    public async Task<ActionResult<List<StudySessionResponse>>> GetStudySessions(
        Guid courseId,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var sessions = await _db.StudySessions
            .AsNoTracking()
            .Where(s => s.CourseId == courseId)
            .OrderByDescending(s => s.CreatedAtUtc)
            .ToListAsync(cancellationToken);

        var response = sessions
            .Select(ToResponse)
            .ToList();

        return Ok(response);
    }

    // POST /api/courses/{courseId}/study-sessions/manual
    [HttpPost("manual")]
    public async Task<ActionResult<StudySessionResponse>> CreateManualSession(
        Guid courseId,
        [FromBody] ManualStudySessionRequest request,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var session = new StudySession
        {
            CourseId = courseId,
            Type = StudySessionType.Manual,
            Status = StudySessionStatus.Completed,
            CreatedAtUtc = DateTime.UtcNow,
            StartedAtUtc = null,
            CurrentRunStartedAtUtc = null,
            AccumulatedSeconds = request.Minutes * 60,
            EndedAtUtc = null
        };

        _db.StudySessions.Add(session);
        await _db.SaveChangesAsync(cancellationToken);

        return Created(
            $"/api/courses/{courseId}/study-sessions/{session.Id}",
            ToResponse(session));
    }

    // POST /api/courses/{courseId}/study-sessions/timer/start
    [HttpPost("timer/start")]
    public async Task<ActionResult<StudySessionResponse>> StartTimer(
        Guid courseId,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var activeTimerExists = await _db.StudySessions
            .AnyAsync(
                s => s.CourseId == courseId
                     && s.Type == StudySessionType.Timer
                     && s.Status != StudySessionStatus.Completed,
                cancellationToken);

        if (activeTimerExists)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Für diesen Kurs ist bereits ein Timer aktiv.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var now = DateTime.UtcNow;

        var session = new StudySession
        {
            CourseId = courseId,
            Type = StudySessionType.Timer,
            Status = StudySessionStatus.Running,
            CreatedAtUtc = now,
            StartedAtUtc = now,
            CurrentRunStartedAtUtc = now,
            AccumulatedSeconds = 0,
            EndedAtUtc = null
        };

        _db.StudySessions.Add(session);
        await _db.SaveChangesAsync(cancellationToken);

        return Created(
            $"/api/courses/{courseId}/study-sessions/{session.Id}",
            ToResponse(session));
    }

    // PATCH /api/courses/{courseId}/study-sessions/{id}/pause
    [HttpPatch("{id:guid}/pause")]
    public async Task<ActionResult<StudySessionResponse>> PauseTimer(
        Guid courseId,
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var session = await GetTimer(
            courseId,
            id,
            cancellationToken);

        if (session is null)
            return NotFound();

        if (session.Status != StudySessionStatus.Running ||
            session.CurrentRunStartedAtUtc is null)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Der Timer läuft aktuell nicht.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var now = DateTime.UtcNow;

        session.AccumulatedSeconds +=
            (int)(now - session.CurrentRunStartedAtUtc.Value).TotalSeconds;

        session.CurrentRunStartedAtUtc = null;
        session.Status = StudySessionStatus.Paused;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(session));
    }

    // PATCH /api/courses/{courseId}/study-sessions/{id}/resume
    [HttpPatch("{id:guid}/resume")]
    public async Task<ActionResult<StudySessionResponse>> ResumeTimer(
        Guid courseId,
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var session = await GetTimer(
            courseId,
            id,
            cancellationToken);

        if (session is null)
            return NotFound();

        if (session.Status != StudySessionStatus.Paused)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Nur ein pausierter Timer kann fortgesetzt werden.",
                Status = StatusCodes.Status409Conflict
            });
        }

        session.CurrentRunStartedAtUtc = DateTime.UtcNow;
        session.Status = StudySessionStatus.Running;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(session));
    }

    // PATCH /api/courses/{courseId}/study-sessions/{id}/stop
    [HttpPatch("{id:guid}/stop")]
    public async Task<ActionResult<StudySessionResponse>> StopTimer(
        Guid courseId,
        Guid id,
        CancellationToken cancellationToken)
    {
        if (!await OwnsCourse(courseId, cancellationToken))
            return NotFound();

        var session = await GetTimer(
            courseId,
            id,
            cancellationToken);

        if (session is null)
            return NotFound();

        if (session.Status == StudySessionStatus.Completed)
        {
            return Conflict(new ProblemDetails
            {
                Title = "Der Timer wurde bereits beendet.",
                Status = StatusCodes.Status409Conflict
            });
        }

        var now = DateTime.UtcNow;

        // Falls der Timer gerade läuft, die letzte Teilzeit addieren.
        if (session.Status == StudySessionStatus.Running &&
            session.CurrentRunStartedAtUtc is not null)
        {
            session.AccumulatedSeconds +=
                (int)(now - session.CurrentRunStartedAtUtc.Value).TotalSeconds;
        }

        session.CurrentRunStartedAtUtc = null;
        session.EndedAtUtc = now;
        session.Status = StudySessionStatus.Completed;

        await _db.SaveChangesAsync(cancellationToken);

        return Ok(ToResponse(session));
    }

    private async Task<StudySession?> GetTimer(
        Guid courseId,
        Guid id,
        CancellationToken cancellationToken)
    {
        return await _db.StudySessions
            .SingleOrDefaultAsync(
                s => s.Id == id
                     && s.CourseId == courseId
                     && s.Type == StudySessionType.Timer,
                cancellationToken);
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

    private static StudySessionResponse ToResponse(StudySession session)
    {
        var elapsedSeconds = session.AccumulatedSeconds;

        // Bei einem aktuell laufenden Timer ist ein Teil der Lernzeit
        // noch nicht in AccumulatedSeconds gespeichert.
        if (session.Status == StudySessionStatus.Running &&
            session.CurrentRunStartedAtUtc is not null)
        {
            elapsedSeconds +=
                (int)(DateTime.UtcNow - session.CurrentRunStartedAtUtc.Value)
                .TotalSeconds;
        }

        return new StudySessionResponse(
            session.Id,
            session.CourseId,
            session.Type,
            session.Status,
            session.CreatedAtUtc,
            session.StartedAtUtc,
            session.EndedAtUtc,
            elapsedSeconds);
    }

    public record ManualStudySessionRequest(
        [Range(1, 1440)]
        int Minutes
    );

    public record StudySessionResponse(
        Guid Id,
        Guid CourseId,
        StudySessionType Type,
        StudySessionStatus Status,
        DateTime CreatedAtUtc,
        DateTime? StartedAtUtc,
        DateTime? EndedAtUtc,
        int ElapsedSeconds
    );
}