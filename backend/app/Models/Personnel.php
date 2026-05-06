<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Personnel extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /*
    |--------------------------------------------------------------------------
    | TABLE & AUTH SETUP
    |--------------------------------------------------------------------------
    | We use "personnel" instead of Laravel's default "users" table.
    | Sanctum reads the tokenable_type from this model class name.
    */
    protected $table = 'personnel';

    protected $fillable = [
        'college_id',
        'department_center_id',
        'name',
        'email',
        'password',
        'role',
        'department',
        'position',
        'program',
        'is_active',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected $casts = [
        'is_active'         => 'boolean',
        'email_verified_at' => 'datetime',
        'password'          => 'hashed',
        'join_date'         => 'date',
    ];

    // ── Role helpers ──────────────────────────────────────────────────────────

    public function isResearcher(): bool
    {
        return $this->role === 'researcher';
    }

    public function isEvaluator(): bool
    {
        return $this->role === 'evaluator';
    }

    public function isRdeDivisionChief(): bool
    {
        return $this->role === 'rde_division_chief';
    }

    public function isCampusDirector(): bool
    {
        return $this->role === 'campus_director';
    }

    public function isVprie(): bool
    {
        return $this->role === 'vprie';
    }

    public function isPresident(): bool
    {
        return $this->role === 'president';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function college()
    {
        return $this->belongsTo(College::class);
    }

    public function departmentCenter()
    {
        return $this->belongsTo(DepartmentCenter::class);
    }

    /**
     * Projects this person created as a researcher.
     */
    public function createdProjects()
    {
        return $this->hasMany(ResearchProject::class, 'created_by');
    }

    /**
     * Project proponent records for this person.
     */
    public function proponentRecords()
    {
        return $this->hasMany(Proponent::class, 'personnel_id');
    }

    /**
     * Projects this person is a proponent of.
     */
    public function projectsAsProponent()
    {
        return $this->belongsToMany(
            ResearchProject::class,
            'proponents',
            'personnel_id',
            'research_project_id'
        )
            ->withPivot('role', 'cv_path')
            ->withTimestamps();
    }

    /**
     * Evaluations this person has submitted as an evaluator.
     */
    public function evaluations()
    {
        return $this->hasMany(Evaluation::class, 'evaluator_id');
    }

    /**
     * Approvals this person has acted on.
     */
    public function approvals()
    {
        return $this->hasMany(Approval::class, 'personnel_id');
    }

    /**
     * Status history entries created by this person.
     */
    public function statusHistories()
    {
        return $this->hasMany(ProposalStatusHistory::class, 'changed_by');
    }

    /**
     * Oral presentations scheduled by this person.
     */
    public function scheduledPresentations()
    {
        return $this->hasMany(OralPresentation::class, 'scheduled_by');
    }

    /**
     * Oral presentations this person is assigned to as an evaluator or panelist.
     */
    public function assignedPresentations()
    {
        return $this->belongsToMany(
            OralPresentation::class,
            'oral_presentation_evaluators',
            'evaluator_id',
            'oral_presentation_id'
        )
            ->withTimestamps();
    }
}