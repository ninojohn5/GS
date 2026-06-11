<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Truncate all data tables so `php artisan db:seed` (without --fresh)
        // also starts clean. Safe for both SQLite and MySQL.
        $this->truncateAllDataTables();

        $this->call([
            PersonnelSeeder::class,
        ]);
    }

    private function truncateAllDataTables(): void
    {
        $tables = [
            'evaluations',
            'approvals',
            'oral_presentation_evaluators',
            'oral_presentations',
            'proposal_status_histories',
            'proponents',
            'proposals',
            'budget_plans',
            'work_plans',
            'project_frameworks',
            'reference_literatures',
            'outputs',
            'research_projects',
        ];

        $driver = DB::getDriverName();

        if ($driver === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
            foreach ($tables as $table) {
                DB::table($table)->delete();
            }
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
            foreach ($tables as $table) {
                DB::table($table)->truncate();
            }
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }
    }
}