<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DepartmentCenter extends Model
{
    use HasFactory;

    protected $fillable = ['college_id', 'name'];

    public function college()
    {
        return $this->belongsTo(College::class);
    }

    public function personnel()
    {
        return $this->hasMany(Personnel::class);
    }

    public function researchProjects()
    {
        return $this->hasMany(ResearchProject::class);
    }
}
