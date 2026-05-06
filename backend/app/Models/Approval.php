<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Approval extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',
        'personnel_id',
        'sequence_no',
        'role_at_approval',
        'action',
        'reference_no',
        'remarks',
        'signature_image',
        'signature_type',
        'acted_at',
    ];

    protected $casts = [
        'acted_at' => 'datetime',
    ];

    /*
    |--------------------------------------------------------------------------
    | Sequence → Role mapping
    |--------------------------------------------------------------------------
    */
    public const SEQUENCE_ROLES = [
        1 => 'rde_division_chief',
        2 => 'campus_director',
        3 => 'vprie',
        4 => 'president',
    ];

    public const SEQUENCE_LABELS = [
        1 => 'Division Chief for RDIE',
        2 => 'Campus Director',
        3 => 'Vice President for RIES',
        4 => 'University President',
    ];

    /*
    |--------------------------------------------------------------------------
    | Relationships
    |--------------------------------------------------------------------------
    */
    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }

    public function personnel()
    {
        return $this->belongsTo(Personnel::class);
    }
}