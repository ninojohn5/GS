<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proposal extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',

        'scholarly_work_type',

        'is_first_time',
        'past_works',

        'has_external_collab',
        'external_collab_details',

        'submitted_elsewhere',
        'other_agency_name',
        'other_agency_amount',
        'difference_explanation',
        'agency_difference_extent',

        'similar_work_elsewhere',
        'similar_work_details',

        'preferred_evaluators',

        /*
        |--------------------------------------------------------------------------
        | Signatures
        |--------------------------------------------------------------------------
        | signatures = JSON/base64 signatures per proponent
        | signature_paths = JSON saved image paths per proponent
        | proponent_signature = old single-signature column, kept for compatibility
        */
        'proponent_signature',
        'signature',
        'signatures',
        'signature_paths',

        /*
        |--------------------------------------------------------------------------
        | Uploaded files
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

        'submitted_at',
    ];

    protected $casts = [
        'is_first_time'          => 'boolean',
        'has_external_collab'    => 'boolean',
        'submitted_elsewhere'    => 'boolean',
        'similar_work_elsewhere' => 'boolean',

        'submitted_at'          => 'datetime',
        'other_agency_amount'   => 'decimal:2',

        /*
        |--------------------------------------------------------------------------
        | JSON fields
        |--------------------------------------------------------------------------
        */
        'past_works'            => 'array',
        'preferred_evaluators'  => 'array',
        'signatures'            => 'array',
        'signature_paths'       => 'array',
        'cv_files'              => 'array',
        'cv_paths'              => 'array',
    ];

    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }
}