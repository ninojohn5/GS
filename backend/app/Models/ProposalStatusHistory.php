<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProposalStatusHistory extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',
        'changed_by',
        'status',
        'remarks',
    ];

    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }

    public function changedBy()
    {
        return $this->belongsTo(Personnel::class, 'changed_by');
    }
}
