<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;
use App\Models\ReferenceLiterature;
use Illuminate\Http\Request;

class ReferenceController extends Controller
{
    // GET /api/projects/{projectId}/references
    public function index($projectId)
    {
        $project = ResearchProject::findOrFail($projectId);
        $refs = $project->referenceLiteratures()->orderBy('citation_no')->get();
        return response()->json($refs);
    }

    // POST /api/projects/{projectId}/references
    public function store(Request $request, $projectId)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $data = $request->validate([
            'authors'     => 'required|string',
            'year'        => 'required|integer|min:1900|max:2100',
            'title'       => 'required|string',
            'source'      => 'nullable|string',
            'doi'         => 'nullable|string|max:200',
            'url'         => 'nullable|string|max:500',
            'type'        => 'required|in:Journal,Book,Conference,Web',
            'category'    => 'nullable|string',
            'citation_no' => 'nullable|integer',
        ]);

        // Auto-assign citation number if not provided
        if (empty($data['citation_no'])) {
            $data['citation_no'] = $project->referenceLiteratures()->max('citation_no') + 1;
        }

        $ref = ReferenceLiterature::create([
            ...$data,
            'research_project_id' => $projectId,
        ]);

        return response()->json($ref, 201);
    }

    // PUT /api/projects/{projectId}/references/{id}
    public function update(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $ref = ReferenceLiterature::where('research_project_id', $projectId)->findOrFail($id);

        $data = $request->validate([
            'authors'  => 'sometimes|string',
            'year'     => 'sometimes|integer',
            'title'    => 'sometimes|string',
            'source'   => 'nullable|string',
            'doi'      => 'nullable|string',
            'url'      => 'nullable|string',
            'type'     => 'sometimes|in:Journal,Book,Conference,Web',
            'category' => 'nullable|string',
        ]);

        $ref->update($data);

        return response()->json($ref->fresh());
    }

    // DELETE /api/projects/{projectId}/references/{id}
    public function destroy(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $ref = ReferenceLiterature::where('research_project_id', $projectId)->findOrFail($id);
        $ref->delete();

        return response()->json(['message' => 'Reference deleted.']);
    }
}
