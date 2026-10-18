<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware(['auth', 'module.active:corporate-chat'])
    ->get('chat', fn () => Inertia::render('modules/corporatechat/index'))
    ->name('chat');
