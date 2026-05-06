<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class College extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'code'];

    public function departmentCenters()
    {
        return $this->hasMany(DepartmentCenter::class);
    }

    public function personnel()
    {
        return $this->hasMany(Personnel::class);
    }
}
