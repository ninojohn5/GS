<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BudgetPlan extends Model
{
    use HasFactory;

    protected $fillable = [
        'research_project_id',
        'year_no',
        'category',
        'description',
        'quantity',
        'unit',
        'unit_price',
        'total_amount',
        'funding_source',
    ];

    protected $casts = [
        'quantity'     => 'decimal:2',
        'unit_price'   => 'decimal:2',
        'total_amount' => 'decimal:2',
    ];

    // Auto-compute total_amount before saving
    protected static function booted(): void
    {
        static::saving(function (BudgetPlan $item) {
            $item->total_amount = $item->quantity * $item->unit_price;
        });
    }

    public function researchProject()
    {
        return $this->belongsTo(ResearchProject::class);
    }
}
