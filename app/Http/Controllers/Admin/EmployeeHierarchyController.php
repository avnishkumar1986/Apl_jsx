<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\UserDepartment;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeHierarchyController extends Controller
{
    public function index(): Response
    {
        $assignments = UserDepartment::query()
            ->where('status', true)
            ->with([
                'user:id,unique_id,first_name,middle_name,last_name,status',
                'company:id,company_code,company_name,record_type',
                'department:id,department_code,department_name',
                'designation:id,designation_name,reporting_to',
                'role:id,name',
            ])
            ->get()
            ->map(fn (UserDepartment $assignment): array => [
                'id' => $assignment->id,
                'employeeId' => $assignment->user?->unique_id,
                'employeeName' => $assignment->user?->name ?? 'Deleted user',
                'employeeActive' => (bool) $assignment->user?->status,
                'companyId' => $assignment->company_id,
                'companyCode' => $assignment->company?->company_code,
                'companyName' => $assignment->company?->company_name ?? 'Unassigned company',
                'companyType' => match ($assignment->company?->record_type) {
                    1 => 'Company',
                    2 => 'Plant',
                    default => 'Organization',
                },
                'sittingLocation' => $assignment->sitting_location ?: 'Location not assigned',
                'departmentCode' => $assignment->department?->department_code,
                'departmentName' => $assignment->department?->department_name ?? 'Department not assigned',
                'designationName' => $assignment->designation?->designation_name ?? 'Designation not assigned',
                'reportsTo' => $assignment->designation?->reporting_to,
                'roleName' => $assignment->role?->name ?? 'Role not assigned',
            ])
            ->sortBy([
                ['companyName', 'asc'],
                ['sittingLocation', 'asc'],
                ['departmentName', 'asc'],
                ['designationName', 'asc'],
                ['employeeName', 'asc'],
            ])
            ->values();

        return Inertia::render('admin/employee-hierarchy/index', [
            'assignments' => $assignments,
            'summary' => [
                'companies' => $assignments->pluck('companyId')->filter()->unique()->count(),
                'locations' => $assignments->pluck('sittingLocation')->unique()->count(),
                'departments' => $assignments->pluck('departmentName')->unique()->count(),
                'employees' => $assignments->pluck('employeeId')->filter()->unique()->count(),
            ],
        ]);
    }
}
