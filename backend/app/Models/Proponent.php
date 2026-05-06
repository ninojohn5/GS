<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Proponent extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',
        'personnel_id',
        'role',
        'cv_path',
    ];

    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }

    public function personnel()
    {
        return $this->belongsTo(Personnel::class);
    }
}
