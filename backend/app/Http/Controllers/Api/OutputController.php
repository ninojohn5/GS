<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;
use App\Models\Output;
use Illuminate\Http\Request;

class OutputController extends Controller
{
    // GET /api/projects/{projectId}/outputs
    public function index($projectId)
    {
        $project = ResearchProject::findOrFail($projectId);
        return response()->json($project->outputs);
    }

    // POST /api/projects/{projectId}/outputs
    public function store(Request $request, $projectId)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $data = $request->validate([
            'output_type' => 'required|string|max:100',
            'description' => 'required|string',
            'status'      => 'nullable|in:Pending,In Progress,Completed',
            'target_date' => 'nullable|date',
        ]);

        $output = Output::create([
            ...$data,
            'research_project_id' => $projectId,
            'status'              => $data['status'] ?? 'Pending',
        ]);

        return response()->json($output, 201);
    }

    // PUT /api/projects/{projectId}/outputs/{id}
    public function update(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $output = Output::where('research_project_id', $projectId)->findOrFail($id);

        $data = $request->validate([
            'output_type' => 'sometimes|string|max:100',
            'description' => 'sometimes|string',
            'status'      => 'sometimes|in:Pending,In Progress,Completed',
            'target_date' => 'nullable|date',
        ]);

        $output->update($data);

        return response()->json($output->fresh());
    }

    // DELETE /api/projects/{projectId}/outputs/{id}
    public function destroy(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $output = Output::where('research_project_id', $projectId)->findOrFail($id);
        $output->delete();

        return response()->json(['message' => 'Output deleted.']);
    }
}
