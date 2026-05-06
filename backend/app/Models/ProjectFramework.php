<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProjectFramework extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',
        'year_no',
        'objective',
        'activities',
        'performance_indicators',
        'target_q1',
        'target_q2',
        'target_q3',
        'target_q4',
        'means_of_verification',
        'key_assumptions',
        'funding_source',
    ];

    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }
}
