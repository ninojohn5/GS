<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;
use App\Models\ProjectFramework;
use Illuminate\Http\Request;

class FrameworkController extends Controller
{
    // GET /api/projects/{projectId}/framework
    public function index($projectId)
    {
        $project = ResearchProject::findOrFail($projectId);
        $frameworks = $project->frameworks()->orderBy('year_no')->get();
        return response()->json($frameworks);
    }

    // POST /api/projects/{projectId}/framework
    public function store(Request $request, $projectId)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $data = $request->validate([
            'year_no'                 => 'required|integer|min:1',
            'objective'               => 'required|string',
            'activities'              => 'required|string',
            'performance_indicators'  => 'required|string',
            'target_q1'               => 'nullable|string',
            'target_q2'               => 'nullable|string',
            'target_q3'               => 'nullable|string',
            'target_q4'               => 'nullable|string',
            'means_of_verification'   => 'nullable|string',
            'key_assumptions'         => 'nullable|string',
            'funding_source'          => 'nullable|in:GAA,STF,Others',
        ]);

        $framework = ProjectFramework::create([
            ...$data,
            'research_project_id' => $projectId,
        ]);

        return response()->json($framework, 201);
    }

    // PUT /api/projects/{projectId}/framework/{id}
    public function update(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $framework = ProjectFramework::where('research_project_id', $projectId)->findOrFail($id);

        $data = $request->validate([
            'objective'              => 'sometimes|string',
            'activities'             => 'sometimes|string',
            'performance_indicators' => 'sometimes|string',
            'target_q1'              => 'nullable|string',
            'target_q2'              => 'nullable|string',
            'target_q3'              => 'nullable|string',
            'target_q4'              => 'nullable|string',
            'means_of_verification'  => 'nullable|string',
            'key_assumptions'        => 'nullable|string',
            'funding_source'         => 'nullable|in:GAA,STF,Others',
        ]);

        $framework->update($data);

        return response()->json($framework->fresh());
    }

    // DELETE /api/projects/{projectId}/framework/{id}
    public function destroy(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $framework = ProjectFramework::where('research_project_id', $projectId)->findOrFail($id);
        $framework->delete();

        return response()->json(['message' => 'Framework row deleted.']);
    }
}
