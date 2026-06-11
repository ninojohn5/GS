<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ResearchProject extends Model
{
    use HasFactory;

    protected $fillable = [
        'department_center_id',
        'created_by',

        'reference_no',

        'type',
        'scholarly_work_type',

        'title',

        'lead_agency',
        'address',
        'tel_fax',
        'email',
        'site_area',

        'start_date',
        'end_date',
        'expected_completion_date',
        'duration_months',

        'budget',
        'total_budget',

        'category',

        'nature_and_significance',
        'issues_to_address',
        'objectives',
        'concept',
        'beneficiaries',
        'stakeholders',
        'methodology',
        'significance_impact',

        /*
        |--------------------------------------------------------------------------
        | Proposal uploaded files
        |--------------------------------------------------------------------------
        */
        'proposal_form',
        'proposal_form_path',

        'cv_files',
        'cv_paths',

        'work_plan_file',
        'work_plan_path',

        'framework_file',
        'framework_path',

        'references_file',
        'references_path',

        /*
        |--------------------------------------------------------------------------
        | Proponent signatures
        |--------------------------------------------------------------------------
        */
        'signature',
        'signature_path',
        'signatures',
        'signature_paths',

        'status',

        /*
        |--------------------------------------------------------------------------
        | Archive fields
        |--------------------------------------------------------------------------
        */
        'is_archived',
        'archived_by',
        'archived_at',
        'archive_reason',
    ];

    protected $casts = [
        'start_date'               => 'date',
        'end_date'                 => 'date',
        'expected_completion_date' => 'date',

        'budget'                   => 'string',
        'total_budget'             => 'string',

        /*
        |--------------------------------------------------------------------------
        | JSON fields
        |--------------------------------------------------------------------------
        */
        'cv_files'                 => 'array',
        'cv_paths'                 => 'array',
        'signatures'               => 'array',
        'signature_paths'          => 'array',

        /*
        |--------------------------------------------------------------------------
        | Archive fields
        |--------------------------------------------------------------------------
        */
        'is_archived'              => 'boolean',
        'archived_at'              => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Auto-generate reference number and status history
    |--------------------------------------------------------------------------
    */
    protected static function booted(): void
    {
        static::creating(function (ResearchProject $project) {
            if (empty($project->reference_no)) {
                $year = now()->year;
                $nextNumber = static::whereYear('created_at', $year)->count() + 1;
        
                do {
                    $referenceNo = sprintf('CSUCCRDE-%d-%05d', $year, $nextNumber);
                    $exists = static::where('reference_no', $referenceNo)->exists();
        
                    if ($exists) {
                        $nextNumber++;
                    }
                } while ($exists);
        
                $project->reference_no = $referenceNo;
            }
        });
    }

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */

    public function departmentCenter()
    {
        return $this->belongsTo(DepartmentCenter::class);
    }

    public function creator()
    {
        return $this->belongsTo(Personnel::class, 'created_by');
    }

    public function archivedBy()
    {
        return $this->belongsTo(Personnel::class, 'archived_by');
    }

    public function proposal()
    {
        return $this->hasOne(Proposal::class);
    }

    public function proponents()
    {
        return $this->hasMany(Proponent::class);
    }

    public function teamMembers()
    {
        return $this->belongsToMany(
            Personnel::class,
            'proponents',
            'research_project_id',
            'personnel_id'
        )
            ->withPivot('role', 'cv_path')
            ->withTimestamps();
    }

    public function oralPresentation()
    {
        return $this->hasOne(OralPresentation::class);
    }

    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }

    public function approvals()
    {
        return $this->hasMany(Approval::class)->orderBy('sequence_no');
    }

    public function statusHistories()
    {
        return $this->hasMany(ProposalStatusHistory::class)->latest();
    }

    public function frameworks()
    {
        return $this->hasMany(ProjectFramework::class)->orderBy('year_no');
    }

    public function workPlans()
    {
        return $this->hasMany(WorkPlan::class);
    }

    public function budgetPlans()
    {
        return $this->hasMany(BudgetPlan::class)->orderBy('year_no');
    }

    public function outputs()
    {
        return $this->hasMany(Output::class);
    }

    public function referenceLiteratures()
    {
        return $this->hasMany(ReferenceLiterature::class)->orderBy('citation_no');
    }

    /*
    |--------------------------------------------------------------------------
    | Helpers
    |--------------------------------------------------------------------------
    */

    public function getTotalBudgetAttribute(): float
    {
        return $this->budgetPlans->sum('total_amount');
    }

    public function getAverageScoreAttribute(): ?float
    {
        $scores = $this->evaluations->pluck('total_score');

        return $scores->count() ? round($scores->avg(), 2) : null;
    }
}