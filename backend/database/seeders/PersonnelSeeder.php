<?php

namespace Database\Seeders;

use App\Models\Personnel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PersonnelSeeder extends Seeder
{
    public function run(): void
    {
        $accounts = [
            [
                'name' => 'Admin User',
                'email' => 'admin@test.com',
                'role' => 'admin',
                'department' => 'Administration',
                'position' => 'System Administrator',
                'program' => null,
            ],
            [
                'name' => 'Researcher User',
                'email' => 'researcher@test.com',
                'role' => 'researcher',
                'department' => 'College Department',
                'position' => 'Researcher',
                'program' => 'BSIT',
            ],
            [
                'name' => 'Evaluator User',
                'email' => 'evaluator@test.com',
                'role' => 'evaluator',
                'department' => 'Research Evaluation',
                'position' => 'Evaluator',
                'program' => null,
            ],
            [
                'name' => 'RDE Division Chief',
                'email' => 'rde@test.com',
                'role' => 'rde_division_chief',
                'department' => 'RDE Office',
                'position' => 'RDE Division Chief',
                'program' => null,
            ],
            [
                'name' => 'Campus Director',
                'email' => 'campus@test.com',
                'role' => 'campus_director',
                'department' => 'Campus Office',
                'position' => 'Campus Director',
                'program' => null,
            ],
            [
                'name' => 'VPRIE User',
                'email' => 'vprie@test.com',
                'role' => 'vprie',
                'department' => 'VPRIE Office',
                'position' => 'Vice President for Research, Innovation, and Extension',
                'program' => null,
            ],
            [
                'name' => 'President User',
                'email' => 'president@test.com',
                'role' => 'president',
                'department' => 'Office of the President',
                'position' => 'University President',
                'program' => null,
            ],
        ];

        foreach ($accounts as $account) {
            Personnel::updateOrCreate(
                ['email' => $account['email']],
                [
                    'college_id' => null,
                    'department_center_id' => null,
                    'name' => $account['name'],
                    'password' => Hash::make('password123'),
                    'role' => $account['role'],
                    'department' => $account['department'],
                    'position' => $account['position'],
                    'program' => $account['program'],
                    'is_active' => 1,
                ]
            );
        }
    }
}