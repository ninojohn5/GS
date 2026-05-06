<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',
        'evaluator_id',
        'presentation_score',
        'relevance_discipline_score',
        'relevance_rde_score',
        'potential_benefits_score',
        'total_score',
        'overall_remarks',
        'significance_to_department',
        'units_to_be_credited',
        'significance_to_development',
        'comments',
        'signature_image',
        'signature_type',
        'evaluated_at',
    ];

    protected $casts = [
        'presentation_score'         => 'decimal:2',
        'relevance_discipline_score' => 'decimal:2',
        'relevance_rde_score'        => 'decimal:2',
        'potential_benefits_score'   => 'decimal:2',
        'total_score'                => 'decimal:2',
        'evaluated_at'               => 'datetime',
    ];

    // ── Auto-compute total score before saving ────────────────────────────────

    protected static function booted(): void
    {
        static::saving(function (Evaluation $eval) {
            $eval->total_score =
                $eval->presentation_score +
                $eval->relevance_discipline_score +
                $eval->relevance_rde_score +
                $eval->potential_benefits_score;

            // Auto-set overall_remarks based on score thresholds from PDF
            if ($eval->total_score >= 70) {
                $eval->overall_remarks = 'Passed';
            } elseif ($eval->total_score >= 60) {
                $eval->overall_remarks = 'Pro-visionary';
            } else {
                $eval->overall_remarks = 'Disapproved';
            }

            if (is_null($eval->evaluated_at)) {
                $eval->evaluated_at = now();
            }
        });
    }

    // ── Relationships ─────────────────────────────────────────────────────────

    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }

    public function evaluator()
    {
        return $this->belongsTo(Personnel::class, 'evaluator_id');
    }
}
