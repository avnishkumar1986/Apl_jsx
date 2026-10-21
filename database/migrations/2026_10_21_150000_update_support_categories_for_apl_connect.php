<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $now = now();
        $categories = [
            ['LOGIN_ACCESS', 'Login & Access', 'Login, password, permissions, session or access-related issues.', 8],
            ['PROFILE_DATA', 'Profile & Employee Data', 'Incorrect or missing profile, contact, employment or employee information.', 24],
            ['DASHBOARD_NAVIGATION', 'Dashboard & Navigation', 'Dashboard widgets, menus, links or page navigation issues.', 12],
            ['APP_FEATURE', 'Application Feature / Page Issue', 'A page, button, form or application feature is not working as expected.', 12],
            ['PROCUREMENT', 'Procurement Module', 'Issues in procurement planning, materials, balance sheets or related pages.', 12],
            ['SALES', 'Sales Module', 'Issues in sales-related screens, data or workflows.', 12],
            ['REPORTS_DATA', 'Reports & Data', 'Missing, incorrect, duplicated or outdated application data and reports.', 12],
            ['PERFORMANCE_ERROR', 'Performance / Technical Error', 'Slow pages, crashes, blank screens, server errors or unexpected technical messages.', 4],
            ['OTHER_APP', 'Other Application Issue', 'Any other issue related to the APL Connect application.', 24],
        ];

        $legacyCodes = ['IT_SUPPORT', 'APPLICATION', 'HR_SUPPORT', 'OTHER'];
        DB::table('tbl_support_categories')->whereIn('code', $legacyCodes)->update(['status' => false, 'updated_at' => $now]);

        foreach ($categories as [$code, $name, $description, $slaHours]) {
            DB::table('tbl_support_categories')->updateOrInsert(
                ['code' => $code],
                [
                    'name' => $name,
                    'description' => $description,
                    'sla_hours' => $slaHours,
                    'status' => true,
                    'updated_at' => $now,
                    'created_at' => $now,
                ],
            );
        }
    }

    public function down(): void
    {
        DB::table('tbl_support_categories')->whereIn('code', [
            'LOGIN_ACCESS',
            'PROFILE_DATA',
            'DASHBOARD_NAVIGATION',
            'APP_FEATURE',
            'SALES',
            'REPORTS_DATA',
            'PERFORMANCE_ERROR',
            'OTHER_APP',
        ])->delete();

        DB::table('tbl_support_categories')->whereIn('code', ['IT_SUPPORT', 'APPLICATION', 'HR_SUPPORT', 'OTHER'])->update(['status' => true, 'updated_at' => now()]);
    }
};
