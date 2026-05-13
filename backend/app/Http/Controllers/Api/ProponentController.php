<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;
use App\Models\Proponent;
use Illuminate\Http\Request;

class ProponentController extends Controller
{
    private function formatProponent($p)
    {
        $personnel = $p->personnel;

        return [
            'id'           => $p->id,
            'personnel_id' => $personnel?->id,
            'name'         => $personnel?->name,
            'email'        => $personnel?->email,

            // This fixes the empty department issue
            'department'   => $personnel?->department
                ?: $personnel?->departmentCenter?->name
                ?: $personnel?->college?->name
                ?: '—',

            'program'      => $personnel?->program,
            'position'     => $personnel?->position,
            'role'         => $p->role,
            'cv_path'      => $p->cv_path,
        ];
    }

    // GET /api/projects/{projectId}/team
    public function index($projectId)
    {
        $project = ResearchProject::findOrFail($projectId);

        $team = $project->proponents()
            ->with([
                'personnel',
                'personnel.departmentCenter',
                'personnel.college',
            ])
            ->get()
            ->map(fn ($p) => $this->formatProponent($p))
            ->values();

        return response()->json($team);
    }

    // POST /api/projects/{projectId}/team
    public function store(Request $request, $projectId)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $data = $request->validate([
            'personnel_id' => 'required|exists:personnel,id',
            'role'         => 'required|in:Leader,Co-Leader,Member',
        ]);

        $existing = Proponent::where('research_project_id', $projectId)
            ->where('personnel_id', $data['personnel_id'])
            ->first();

        if ($existing) {
            return response()->json([
                'message' => 'This person is already a team member.',
            ], 422);
        }

        if ($data['role'] === 'Leader') {
            $leaderExists = Proponent::where('research_project_id', $projectId)
                ->where('role', 'Leader')
                ->exists();

            if ($leaderExists) {
                return response()->json([
                    'message' => 'A project leader already exists. Only one leader is allowed per project.',
                ], 422);
            }
        }

        $proponent = Proponent::create([
            'research_project_id' => $projectId,
            'personnel_id'        => $data['personnel_id'],
            'role'                => $data['role'],
        ]);

        $proponent->load([
            'personnel',
            'personnel.departmentCenter',
            'personnel.college',
        ]);

        return response()->json($this->formatProponent($proponent), 201);
    }

    // PUT /api/projects/{projectId}/team/{proponentId}
    public function update(Request $request, $projectId, $proponentId)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $proponent = Proponent::where('research_project_id', $projectId)
            ->findOrFail($proponentId);

        $data = $request->validate([
            'role' => 'required|in:Leader,Co-Leader,Member',
        ]);

        $proponent->update([
            'role' => $data['role'],
        ]);

        $proponent->load([
            'personnel',
            'personnel.departmentCenter',
            'personnel.college',
        ]);

        return response()->json($this->formatProponent($proponent));
    }

    // DELETE /api/projects/{projectId}/team/{proponentId}
    public function destroy(Request $request, $projectId, $proponentId)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $proponent = Proponent::where('research_project_id', $projectId)
            ->findOrFail($proponentId);

        if ($proponent->role === 'Leader') {
            return response()->json([
                'message' => 'Cannot remove the project leader.',
            ], 422);
        }

        $proponent->delete();

        return response()->json([
            'message' => 'Team member removed.',
        ]);
    }
}