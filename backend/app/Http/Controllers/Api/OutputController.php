<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ResearchProject;
use App\Models\Output;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class OutputController extends Controller
{
    // GET /api/projects/{projectId}/outputs
    public function index($projectId)
    {
        $project = ResearchProject::findOrFail($projectId);

        return response()->json(
            $project->outputs()
                ->latest()
                ->get()
                ->map(function ($output) {
                    return [
                        'id' => $output->id,
                        'research_project_id' => $output->research_project_id,
                        'output_type' => $output->output_type,
                        'description' => $output->description,
                        'status' => $output->status,
                        'target_date' => $output->target_date,
                        'file_path' => $output->file_path,
                        'file_name' => $output->file_name,
                        'file_type' => $output->file_type,
                        'file_url' => $output->file_path ? asset('storage/' . $output->file_path) : null,
                        'created_at' => $output->created_at,
                        'updated_at' => $output->updated_at,
                    ];
                })
        );
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
            'file'        => 'required|file|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,png,jpg,jpeg|max:20480',
        ]);

        $filePath = null;
        $fileName = null;
        $fileType = null;

        if ($request->hasFile('file')) {
            $file = $request->file('file');
            $filePath = $file->store('outputs', 'public');
            $fileName = $file->getClientOriginalName();
            $fileType = $file->getClientOriginalExtension();
        }

        $output = Output::create([
            'research_project_id' => $projectId,
            'output_type' => $data['output_type'],
            'description' => $data['description'],
            'status' => $data['status'] ?? 'Pending',
            'target_date' => $data['target_date'] ?? null,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_type' => $fileType,
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
            'file'        => 'nullable|file|mimes:pdf,doc,docx,ppt,pptx,xls,xlsx,png,jpg,jpeg|max:20480',
        ]);

        $updateData = [
            'output_type' => $data['output_type'] ?? $output->output_type,
            'description' => $data['description'] ?? $output->description,
            'status' => $data['status'] ?? $output->status,
            'target_date' => $data['target_date'] ?? $output->target_date,
        ];

        if ($request->hasFile('file')) {
            if ($output->file_path) {
                Storage::disk('public')->delete($output->file_path);
            }

            $file = $request->file('file');

            $updateData['file_path'] = $file->store('outputs', 'public');
            $updateData['file_name'] = $file->getClientOriginalName();
            $updateData['file_type'] = $file->getClientOriginalExtension();
        }

        $output->update($updateData);

        return response()->json($output->fresh());
    }

    // DELETE /api/projects/{projectId}/outputs/{id}
    public function destroy(Request $request, $projectId, $id)
    {
        $project = ResearchProject::where('created_by', $request->user()->id)
            ->findOrFail($projectId);

        $output = Output::where('research_project_id', $projectId)->findOrFail($id);

        if ($output->file_path) {
            Storage::disk('public')->delete($output->file_path);
        }

        $output->delete();

        return response()->json(['message' => 'Output deleted.']);
    }
}