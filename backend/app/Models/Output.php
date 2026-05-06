<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Output extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',
        'output_type',
        'description',
        'status',
        'target_date',
    ];

    protected $casts = [
        'target_date' => 'date',
    ];

    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }
}
