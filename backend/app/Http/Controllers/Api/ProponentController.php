<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;
use App\Models\Proponent;
use Illuminate\Http\Request;

class ProponentController extends Controller
{
    // GET /api/projects/{projectId}/team
    public function index($projectId)
    {
        $project = ResearchProject::findOrFail($projectId);

        $team = $project->proponents()->with('personnel')->get()
            ->map(function ($p) {
                return [
                    'id'         => $p->id,
                    'name'       => $p->personnel->name,
                    'email'      => $p->personnel->email,
                    'department' => $p->personnel->departmentCenter?->name ?? '',
                    'role'       => $p->role,
                    'cv_path'    => $p->cv_path,
                ];
            });

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

        // Check if already a proponent
        $existing = Proponent::where('research_project_id', $projectId)
            ->where('personnel_id', $data['personnel_id'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'This person is already a team member.'], 422);
        }

        $proponent = Proponent::create([
            'research_project_id' => $projectId,
            'personnel_id'        => $data['personnel_id'],
            'role'                => $data['role'],
        ]);

        return response()->json($proponent->load('personnel'), 201);
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

        $proponent->update($data);

        return response()->json($proponent->load('personnel'));
    }

    // DELETE /api/projects/{projectId}/team/{proponentId}
    public function destroy(Request $request, $projectId, $proponentId)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $proponent = Proponent::where('research_project_id', $projectId)
            ->findOrFail($proponentId);

        // Prevent deleting the project leader
        if ($proponent->role === 'Leader') {
            return response()->json(['message' => 'Cannot remove the project leader.'], 422);
        }

        $proponent->delete();

        return response()->json(['message' => 'Team member removed.']);
    }
}
