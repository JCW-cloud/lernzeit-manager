namespace Lernplaner.Api.Models;

public class StudySession
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid CourseId { get; set; }

    public Course Course { get; set; } = null!;

    public StudySessionType Type { get; set; }

    public StudySessionStatus Status { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public DateTime? StartedAtUtc { get; set; }

    public DateTime? CurrentRunStartedAtUtc { get; set; }

    public int AccumulatedSeconds { get; set; }

    public DateTime? EndedAtUtc { get; set; }
}