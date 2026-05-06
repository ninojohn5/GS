<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /*
    |--------------------------------------------------------------------------
    | PERSONNEL
    |--------------------------------------------------------------------------
    | This is the users table for the system. Named "personnel" to match
    | the system notes ERD. The User model will point to this table.
    |
    | Roles:
    |   researcher         — Faculty / Proponent
    |   evaluator          — Panel member who scores proposals
    |   rde_division_chief — RDE Division Chief (Step 1 of approval chain)
    |   campus_director    — Campus Director (Step 2 of approval chain)
    |   vprie              — Vice President for RIES (Step 3)
    |   president          — University President (Step 4 / Final)
    |   admin              — RDE Staff / System Administrator
    */
    public function up(): void
    {
        Schema::create('personnel', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('college_id')->nullable();
            $table->unsignedBigInteger('department_center_id')->nullable();

            $table->string('name');
            $table->string('email')->unique();
            $table->string('password');

            $table->enum('role', [
                'researcher',
                'evaluator',
                'rde_division_chief',
                'campus_director',
                'vprie',
                'president',
                'admin',
            ]);

            $table->string('department')->nullable();           
            $table->string('position')->nullable();             
            $table->string('program')->nullable();                 
            $table->boolean('is_active')->default(true);

            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personnel');
    }
};