using System.ComponentModel.DataAnnotations;
using System.Security.Claims;
using Lernplaner.Api.Data;
using Lernplaner.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Lernplaner.Api.Controllers;

[ApiController]
[Route("api/courses")]
[Authorize]
public class CoursesController : ControllerBase
{
    private readonly ApplicationDbContext _db;

    public CoursesController(ApplicationDbContext db)
    {
        _db = db;
    }

    // GET api/courses
    [HttpGet]
    public async Task<ActionResult<List<CourseResponse>>> GetCourses(CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var courses = await _db.Courses
        .AsNoTracking()
        .Where(c => c.UserId == userId)
        .OrderBy(c => c.Title)
        .Select(c => new CourseResponse(
            c.Id,
            c.Title,
            c.Description,
            c.CreatedAtUtc))
        .ToListAsync(cancellationToken);

        return Ok(courses);
    }

    // GET api/courses/{id}
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<CourseResponse>> GetCourse(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var course = await _db.Courses
        .AsNoTracking()
        .Where(c => c.Id == id && c.UserId == userId)
        .Select(c => new CourseResponse(
            c.Id,
            c.Title,
            c.Description,
            c.CreatedAtUtc))
        .SingleOrDefaultAsync(cancellationToken);

        if (course is null)
            return NotFound();

        return Ok(course);
    }

    // POST /api/courses
    [HttpPost]
    public async Task<ActionResult<CourseResponse>> CreateCourse(
        [FromBody] CreateCourseRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        if (userId is null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            ModelState.AddModelError(
                nameof(request.Title),
                "Der Kurstitel darf nicht leer sein.");

            return ValidationProblem(ModelState);
        }

        var course = new Course
        {
            Title = request.Title.Trim(),
            Description = request.Description?.Trim(),
            UserId = userId
        };

        _db.Courses.Add(course);
        await _db.SaveChangesAsync(cancellationToken);

        var response = new CourseResponse(
            course.Id,
            course.Title,
            course.Description,
            course.CreatedAtUtc);

        return CreatedAtAction(
            nameof(GetCourse),
            new { id = course.Id },
            response);
    }

    // PUT /api/courses/{id}
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<CourseResponse>> UpdateCourse(
        Guid id,
        UpdateCourseRequest request,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var course = await _db.Courses
            .SingleOrDefaultAsync(
                c => c.Id == id && c.UserId == userId,
                cancellationToken);

        if (course is null)
            return NotFound();

        if (string.IsNullOrWhiteSpace(request.Title))
        {
            ModelState.AddModelError(
                nameof(request.Title),
                "Der Kurstitel darf nicht leer sein.");

            return ValidationProblem(ModelState);
        }

        course.Title = request.Title.Trim();
        course.Description = request.Description?.Trim();


        await _db.SaveChangesAsync(cancellationToken);

        return Ok(new CourseResponse(
            course.Id,
            course.Title,
            course.Description,
            course.CreatedAtUtc));
    }

    // DELETE /api/courses/{id}
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteCourse(
        Guid id,
        CancellationToken cancellationToken)
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

        var course = await _db.Courses
        .SingleOrDefaultAsync(
            c => c.Id == id && c.UserId == userId,
            cancellationToken);

        if (course is null)
            return NotFound();

        _db.Courses.Remove(course);
        await _db.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    public record CreateCourseRequest(
        [Required]
        [StringLength(150, MinimumLength = 1)]
        string Title,

        [StringLength(1000)]
        string? Description);

    public record UpdateCourseRequest(
        [Required]
        [StringLength(150, MinimumLength = 1)]
        string Title,

        [StringLength(1000)]
        string? Description);

    public record CourseResponse(
        Guid Id,
        string Title,
        string? Description,
        DateTime CreatedAtUtc);
}