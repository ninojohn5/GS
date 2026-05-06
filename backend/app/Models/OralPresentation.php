<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OralPresentation extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',
        'scheduled_by',
        'presentation_date',
        'presentation_time',
        'venue',
    ];

    protected $casts = [
        'presentation_date' => 'date',
    ];

    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }

    public function scheduler()
    {
        return $this->belongsTo(Personnel::class, 'scheduled_by');
    }

    /** The evaluators/panelists assigned to this presentation */
    public function evaluators()
    {
        return $this->belongsToMany(Personnel::class, 'oral_presentation_evaluators', 'oral_presentation_id', 'evaluator_id')
                    ->withTimestamps();
    }
}
