<?php

namespace App\Console\Commands;

use App\Services\Security\ProjectSecurityAuditService;
use Illuminate\Console\Command;

class RunSecurityAudit extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'security:audit';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Audit Composer and npm libraries and store dated vulnerability findings';

    /**
     * Execute the console command.
     */
    public function handle(ProjectSecurityAuditService $auditService): int
    {
        $this->info('Scanning Composer and npm dependencies...');

        $scan = $auditService->run();

        $this->table(
            ['Score', 'Findings', 'Critical', 'High', 'Medium', 'Low', 'Status'],
            [[
                $scan->score,
                $scan->total_findings,
                $scan->critical_findings,
                $scan->high_findings,
                $scan->medium_findings,
                $scan->low_findings,
                $scan->status,
            ]],
        );

        if ($scan->error_message) {
            $this->warn($scan->error_message);
        }

        return self::SUCCESS;
    }
}
