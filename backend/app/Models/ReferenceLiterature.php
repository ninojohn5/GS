<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReferenceLiterature extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',
        'citation_no',
        'authors',
        'year',
        'title',
        'source',
        'doi',
        'url',
        'type',
        'category',
    ];

    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }
}
