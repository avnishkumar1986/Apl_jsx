<?php

namespace Modules\GroupOverview\Http\Controllers;

use App\Http\Controllers\Controller;
use Inertia\Inertia;
use Inertia\Response;

class GroupOverviewController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('modules/groupoverview/dashboard');
    }
}
