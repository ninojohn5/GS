<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',
        'title',
        'description',
        'milestone',
        'fund_cluster',
        'jan', 'feb', 'mar', 'apr', 'may', 'jun',
        'jul', 'aug', 'sep', 'oct', 'nov', 'dec',
        'target_year',
        'status',
        'accomplishment',
        'start_date',
        'end_date',
    ];

    protected $casts = [
        'jan' => 'boolean', 'feb' => 'boolean', 'mar' => 'boolean',
        'apr' => 'boolean', 'may' => 'boolean', 'jun' => 'boolean',
        'jul' => 'boolean', 'aug' => 'boolean', 'sep' => 'boolean',
        'oct' => 'boolean', 'nov' => 'boolean', 'dec' => 'boolean',
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }

    /** Returns an array of month names that are targeted */
    public function getTargetMonthsAttribute(): array
    {
        $months = ['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
        return array_filter($months, fn($m) => $this->$m);
    }
}
