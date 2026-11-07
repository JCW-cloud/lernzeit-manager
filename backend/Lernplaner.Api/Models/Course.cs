using System.ComponentModel.DataAnnotations;

namespace Lernplaner.Api.Models;

public class Course
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(150)]
    public string Title { get; set; } = string.Empty;

    [MaxLength(1000)]
    public string? Description { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    // Jeder Kurs hat einen Besitzer
    [Required]
    public string UserId { get; set; } = string.Empty;
    // -> UserId muss string sein, da ApplicationUser ID string ist

    public ApplicationUser User { get; set; } = null!;

    // Ein Kurs kann mehrere Lernziele haben.
    public ICollection<LearningGoal> LearningGoals { get; set; } = new List<LearningGoal>();
}


// TargetDate
//Prüfungsart
// Aufwand