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
            // ── Admin ─────────────────────────────────────────────────────────
            [
                'name'       => 'Admin User',
                'email'      => 'admin@test.com',
                'role'       => 'admin',
                'department' => 'Administration',
                'position'   => 'System Administrator',
                'program'    => null,
            ],

            // ── Researchers ───────────────────────────────────────────────────────
            [
                'name'       => 'Researcher User 1',
                'email'      => 'researcher1@test.com',
                'role'       => 'researcher',
                'department' => 'College of Computing',
                'position'   => 'Faculty Researcher',
                'program'    => 'BSIT',
            ],
            [
                'name'       => 'Researcher User 2',
                'email'      => 'researcher2@test.com',
                'role'       => 'researcher',
                'department' => 'College of Engineering',
                'position'   => 'Faculty Researcher',
                'program'    => 'BSCS',
            ],
            [
                'name'       => 'Researcher User 3',
                'email'      => 'researcher3@test.com',
                'role'       => 'researcher',
                'department' => 'College of Education',
                'position'   => 'Faculty Researcher',
                'program'    => 'BSEd',
            ],

            // ── Evaluators (4 accounts) ────────────────────────────────────────
            [
                'name'       => 'Evaluator User 1',
                'email'      => 'evaluator1@test.com',
                'role'       => 'evaluator',
                'department' => 'Research Evaluation',
                'position'   => 'Evaluator',
                'program'    => null,
            ],
            [
                'name'       => 'Evaluator User 2',
                'email'      => 'evaluator2@test.com',
                'role'       => 'evaluator',
                'department' => 'Research Evaluation',
                'position'   => 'Evaluator',
                'program'    => null,
            ],
            [
                'name'       => 'Evaluator User 3',
                'email'      => 'evaluator3@test.com',
                'role'       => 'evaluator',
                'department' => 'Research Evaluation',
                'position'   => 'Evaluator',
                'program'    => null,
            ],
            [
                'name'       => 'Evaluator User 4',
                'email'      => 'evaluator4@test.com',
                'role'       => 'evaluator',
                'department' => 'Research Evaluation',
                'position'   => 'Evaluator',
                'program'    => null,
            ],

            // ── Approval chain (3-step: rdiso_director → vprie → president) ───
            [
                'name'       => 'RDISO Director',
                'email'      => 'rdiso@test.com',
                'role'       => 'rdiso_director',
                'department' => 'RDISO Office',
                'position'   => 'RDISO Director / ESO Director',
                'program'    => null,
            ],
            [
                'name'       => 'VPRIE User',
                'email'      => 'vprie@test.com',
                'role'       => 'vprie',
                'department' => 'VPRIE Office',
                'position'   => 'Vice President for Research, Innovation, and Extension',
                'program'    => null,
            ],
            [
                'name'       => 'President User',
                'email'      => 'president@test.com',
                'role'       => 'president',
                'department' => 'Office of the President',
                'position'   => 'University President',
                'program'    => null,
            ],
        ];

        foreach ($accounts as $account) {
            Personnel::updateOrCreate(
                ['email' => $account['email']],
                [
                    'college_id'           => null,
                    'department_center_id' => null,
                    'name'                 => $account['name'],
                    'password'             => 'password123',
                    'role'                 => $account['role'],
                    'department'           => $account['department'],
                    'position'             => $account['position'],
                    'program'              => $account['program'],
                    'is_active'            => 1,
                ]
            );
        }
    }
}