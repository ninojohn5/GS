<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('department_centers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('college_id')->constrained('colleges')->cascadeOnDelete();
            $table->string('name');
            // e.g. "Information Technology Dept", "CSUCC Campus Research Center"
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('department_centers');
    }
};
