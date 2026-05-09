<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ProjectController;
use App\Http\Controllers\Api\ProponentController;
use App\Http\Controllers\Api\EvaluationController;
use App\Http\Controllers\Api\WorkPlanController;
use App\Http\Controllers\Api\BudgetPlanController;
use App\Http\Controllers\Api\FrameworkController;
use App\Http\Controllers\Api\ReferenceController;
use App\Http\Controllers\Api\OutputController;
use App\Http\Controllers\Api\StatusTrackingController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProposalController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\ApprovalController;

/*
|--------------------------------------------------------------------------
| Public Routes (no auth required)
|--------------------------------------------------------------------------
*/
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

/*
|--------------------------------------------------------------------------
| Protected Routes (requires Sanctum token)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

Route::get('/personnel/search', function (Request $request) {
    $q = $request->query('q');

    return \App\Models\Personnel::where('role', 'researcher')
        ->where(function ($query) use ($q) {
            $query->where('name', 'like', "%{$q}%")
                ->orWhere('email', 'like', "%{$q}%");
        })
        ->where('is_active', true)
        ->get([
            'id',
            'name',
            'email',
            'role',
            'department',
            'program',
            'position',
            'college_id',
            'department_center_id',
        ]);
});

    /*
    |--------------------------------------------------------------------------
    | Approved Projects for PDF Generation
    |--------------------------------------------------------------------------
    */
    Route::get('/projects/approved', function (Request $request) {
        return \App\Models\ResearchProject::where('status', 'Approved')
            ->with(['creator', 'departmentCenter', 'proponents.personnel'])
            ->latest()
            ->get()
            ->map(function ($p) {
                return [
                    'id'            => $p->id,
                    'reference_no'  => $p->reference_no,
                    'title'         => $p->title,
                    'status'        => $p->status,
                    'budget'        => $p->budget,
                    'type'          => $p->type,
                    'start_date'    => $p->start_date,
                    'end_date'      => $p->end_date,
                    'submitted_by'  => $p->creator?->name,
                    'average_score' => $p->average_score,
                ];
            });
    });

    /*
    |--------------------------------------------------------------------------
    | Admin Routes
    |--------------------------------------------------------------------------
    */
    Route::prefix('admin')->group(function () {
        Route::get('/faculty',              [AdminController::class, 'faculty']);
        Route::get('/proposals',            [AdminController::class, 'proposals']);
        Route::get('/evaluators',           [AdminController::class, 'evaluators']);
        Route::post('/schedule',            [AdminController::class, 'schedule']);

        Route::get('/users',                [AdminController::class, 'users']);
        Route::put('/users/{id}/toggle',    [AdminController::class, 'toggleUser']);
        Route::put('/users/{id}/update',    [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}',        [AdminController::class, 'deleteUser']);

        /*
        |--------------------------------------------------------------------------
        | Admin Delete Project / Proposal
        |--------------------------------------------------------------------------
        | Your admin Project Management page is loading records from /admin/proposals.
        | These two routes allow the frontend to delete using either:
        | DELETE /api/admin/projects/{id}
        | DELETE /api/admin/proposals/{id}
        */
        Route::delete('/projects/{id}',      [AdminController::class, 'deleteProposal']);
        Route::delete('/proposals/{id}',     [AdminController::class, 'deleteProposal']);
    });

    /*
    |--------------------------------------------------------------------------
    | Proposal Form Flow
    |--------------------------------------------------------------------------
    */
    Route::post('/proposals/draft', [ProposalController::class, 'saveDraft']);
    Route::post('/proposals',       [ProposalController::class, 'submit']);
    Route::get('/proposals/my',     [ProposalController::class, 'myProposals']);
    Route::get('/proposals/{id}',   [ProposalController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | Approval Chain
    |--------------------------------------------------------------------------
    */
    Route::get('/approval/pending',      [ApprovalController::class, 'pending']);
    Route::post('/approval/act',         [ApprovalController::class, 'act']);
    Route::get('/approval/my-actions',   [ApprovalController::class, 'myActions']);
    Route::get('/approval/history/{id}', [ApprovalController::class, 'history']);

    /*
    |--------------------------------------------------------------------------
    | Project Proposal Routes
    |--------------------------------------------------------------------------
    */
    Route::post('/projects/{id}/proposals', [ProposalController::class, 'store']);
    Route::get('/projects/{id}/proposals',  [ProposalController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | Auth
    |--------------------------------------------------------------------------
    */
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    Route::put('/profile',          [AuthController::class, 'updateProfile']);
    Route::put('/profile/password', [AuthController::class, 'changePassword']);

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    /*
    |--------------------------------------------------------------------------
    | Projects
    |--------------------------------------------------------------------------
    */
    Route::get('/projects',                [ProjectController::class, 'index']);
    Route::post('/projects',               [ProjectController::class, 'store']);
    Route::get('/projects/{id}',           [ProjectController::class, 'show']);
    Route::put('/projects/{id}',           [ProjectController::class, 'update']);
    Route::post('/projects/{id}/submit',   [ProjectController::class, 'submit']);
    Route::patch('/projects/{id}/archive', [ProjectController::class, 'archive']);
    Route::patch('/projects/{id}/restore', [ProjectController::class, 'restore']);

    /*
    |--------------------------------------------------------------------------
    | Team / Proponents
    |--------------------------------------------------------------------------
    */
    Route::get('/projects/{projectId}/team',                  [ProponentController::class, 'index']);
    Route::post('/projects/{projectId}/team',                 [ProponentController::class, 'store']);
    Route::put('/projects/{projectId}/team/{proponentId}',    [ProponentController::class, 'update']);
    Route::delete('/projects/{projectId}/team/{proponentId}', [ProponentController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Work Plan
    |--------------------------------------------------------------------------
    */
    Route::get('/projects/{projectId}/work-plan',         [WorkPlanController::class, 'index']);
    Route::post('/projects/{projectId}/work-plan',        [WorkPlanController::class, 'store']);
    Route::put('/projects/{projectId}/work-plan/{id}',    [WorkPlanController::class, 'update']);
    Route::delete('/projects/{projectId}/work-plan/{id}', [WorkPlanController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Budget Plan
    |--------------------------------------------------------------------------
    */
    Route::get('/projects/{projectId}/budget-plan',         [BudgetPlanController::class, 'index']);
    Route::post('/projects/{projectId}/budget-plan',        [BudgetPlanController::class, 'store']);
    Route::put('/projects/{projectId}/budget-plan/{id}',    [BudgetPlanController::class, 'update']);
    Route::delete('/projects/{projectId}/budget-plan/{id}', [BudgetPlanController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Framework
    |--------------------------------------------------------------------------
    */
    Route::get('/projects/{projectId}/framework',         [FrameworkController::class, 'index']);
    Route::post('/projects/{projectId}/framework',        [FrameworkController::class, 'store']);
    Route::put('/projects/{projectId}/framework/{id}',    [FrameworkController::class, 'update']);
    Route::delete('/projects/{projectId}/framework/{id}', [FrameworkController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | References
    |--------------------------------------------------------------------------
    */
    Route::get('/projects/{projectId}/references',         [ReferenceController::class, 'index']);
    Route::post('/projects/{projectId}/references',        [ReferenceController::class, 'store']);
    Route::put('/projects/{projectId}/references/{id}',    [ReferenceController::class, 'update']);
    Route::delete('/projects/{projectId}/references/{id}', [ReferenceController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Outputs
    |--------------------------------------------------------------------------
    */
    Route::get('/projects/{projectId}/outputs',         [OutputController::class, 'index']);
    Route::post('/projects/{projectId}/outputs',        [OutputController::class, 'store']);
    Route::put('/projects/{projectId}/outputs/{id}',    [OutputController::class, 'update']);
    Route::delete('/projects/{projectId}/outputs/{id}', [OutputController::class, 'destroy']);

    /*
    |--------------------------------------------------------------------------
    | Status Tracking
    |--------------------------------------------------------------------------
    */
    Route::get('/projects/{projectId}/status-history', [StatusTrackingController::class, 'index']);

    /*
    |--------------------------------------------------------------------------
    | Evaluations
    |--------------------------------------------------------------------------
    */
    Route::get('/evaluations/pending',   [EvaluationController::class, 'pending']);
    Route::get('/evaluations/completed', [EvaluationController::class, 'completed']);
    Route::post('/evaluations',          [EvaluationController::class, 'store']);
    Route::get('/evaluations/{id}',      [EvaluationController::class, 'show']);
});