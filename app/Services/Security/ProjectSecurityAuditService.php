<?php

namespace App\Services\Security;

use App\Models\SecurityScan;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\DB;
use JsonException;
use Symfony\Component\Process\Process;

class ProjectSecurityAuditService
{
    public function run(): SecurityScan
    {
        $scan = SecurityScan::query()->create([
            'status' => 'running',
            'started_at' => now(),
        ]);

        $errors = [];
        $findings = [];

        try {
            $findings = [...$findings, ...$this->scanComposer()];
        } catch (\Throwable $exception) {
            $errors[] = 'Composer audit: '.$exception->getMessage();
        }

        try {
            $findings = [...$findings, ...$this->scanNpm()];
        } catch (\Throwable $exception) {
            $errors[] = 'npm audit: '.$exception->getMessage();
        }

        $counts = collect($findings)->countBy('severity');
        $score = max(0, 100
            - ($counts->get('critical', 0) * 30)
            - ($counts->get('high', 0) * 20)
            - ($counts->get('medium', 0) * 10)
            - ($counts->get('low', 0) * 5));

        DB::transaction(function () use ($scan, $findings, $errors, $counts, $score): void {
            $scan->findings()->createMany($findings);
            $scan->update([
                'status' => $errors === [] ? 'completed' : 'completed_with_errors',
                'score' => $score,
                'total_findings' => count($findings),
                'critical_findings' => $counts->get('critical', 0),
                'high_findings' => $counts->get('high', 0),
                'medium_findings' => $counts->get('medium', 0),
                'low_findings' => $counts->get('low', 0),
                'summary' => [
                    'composer' => collect($findings)->where('ecosystem', 'composer')->count(),
                    'npm' => collect($findings)->where('ecosystem', 'npm')->count(),
                ],
                'error_message' => $errors === [] ? null : implode(PHP_EOL, $errors),
                'completed_at' => now(),
            ]);
        });

        return $scan->fresh('findings');
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function scanComposer(): array
    {
        $result = $this->runProcess(['composer', 'audit', '--format=json', '--no-interaction']);
        $payload = $this->decodeJson($result['output'], 'Composer returned invalid audit output.');
        $installedVersions = $this->composerInstalledVersions();
        $findings = [];

        foreach (($payload['advisories'] ?? []) as $packageName => $advisories) {
            foreach ($advisories as $advisory) {
                $findings[] = [
                    'ecosystem' => 'composer',
                    'package_name' => $packageName,
                    'installed_version' => $installedVersions[$packageName] ?? null,
                    'vulnerable_versions' => $advisory['affectedVersions'] ?? null,
                    'advisory_id' => $advisory['advisoryId'] ?? $advisory['cve'] ?? null,
                    'title' => $advisory['title'] ?? 'Composer security advisory',
                    'severity' => $this->normaliseSeverity($advisory['severity'] ?? 'medium'),
                    'advisory_url' => $advisory['link'] ?? null,
                    'published_at' => $this->parseDate($advisory['reportedAt'] ?? null),
                    'raw_data' => $advisory,
                ];
            }
        }

        return $findings;
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function scanNpm(): array
    {
        $result = $this->runProcess(['npm', 'audit', '--json']);
        $payload = $this->decodeJson($result['output'], 'npm returned invalid audit output.');
        $installedVersions = $this->npmInstalledVersions();
        $findings = [];

        foreach (($payload['vulnerabilities'] ?? []) as $packageName => $vulnerability) {
            $advisories = collect($vulnerability['via'] ?? [])->filter(fn (mixed $item): bool => is_array($item));

            if ($advisories->isEmpty()) {
                $advisories = collect([[
                    'title' => "Vulnerability affects {$packageName}",
                    'severity' => $vulnerability['severity'] ?? 'medium',
                    'range' => $vulnerability['range'] ?? null,
                ]]);
            }

            foreach ($advisories as $advisory) {
                $findings[] = [
                    'ecosystem' => 'npm',
                    'package_name' => $packageName,
                    'installed_version' => $installedVersions[$packageName] ?? null,
                    'vulnerable_versions' => $advisory['range'] ?? $vulnerability['range'] ?? null,
                    'advisory_id' => isset($advisory['source']) ? (string) $advisory['source'] : null,
                    'title' => $advisory['title'] ?? "Vulnerability affects {$packageName}",
                    'severity' => $this->normaliseSeverity($advisory['severity'] ?? $vulnerability['severity'] ?? 'medium'),
                    'advisory_url' => $advisory['url'] ?? null,
                    'published_at' => null,
                    'raw_data' => $advisory,
                ];
            }
        }

        return $findings;
    }

    /**
     * @param  list<string>  $command
     * @return array{output: string, exitCode: int|null}
     */
    private function runProcess(array $command): array
    {
        if (DIRECTORY_SEPARATOR === '\\') {
            $command[0] .= $command[0] === 'composer' ? '.bat' : '.cmd';
        }

        $process = new Process($command, base_path());
        $process->setTimeout(180);
        $process->run();
        $output = trim($process->getOutput());

        if ($output === '') {
            throw new \RuntimeException(trim($process->getErrorOutput()) ?: 'The audit command returned no output.');
        }

        return ['output' => $output, 'exitCode' => $process->getExitCode()];
    }

    /**
     * @return array<string, mixed>
     */
    private function decodeJson(string $json, string $errorMessage): array
    {
        try {
            return json_decode($json, true, flags: JSON_THROW_ON_ERROR);
        } catch (JsonException) {
            throw new \RuntimeException($errorMessage);
        }
    }

    /**
     * @return array<string, string>
     */
    private function composerInstalledVersions(): array
    {
        $lock = $this->decodeJson((string) file_get_contents(base_path('composer.lock')), 'Unable to read composer.lock.');

        return collect([...(array) ($lock['packages'] ?? []), ...(array) ($lock['packages-dev'] ?? [])])
            ->mapWithKeys(fn (array $package): array => [$package['name'] => $package['version']])
            ->all();
    }

    /**
     * @return array<string, string>
     */
    private function npmInstalledVersions(): array
    {
        $lock = $this->decodeJson((string) file_get_contents(base_path('package-lock.json')), 'Unable to read package-lock.json.');

        return collect($lock['packages'] ?? [])
            ->filter(fn (array $package, string $path): bool => str_starts_with($path, 'node_modules/') && isset($package['version']))
            ->mapWithKeys(fn (array $package, string $path): array => [str_replace('node_modules/', '', $path) => $package['version']])
            ->all();
    }

    private function normaliseSeverity(string $severity): string
    {
        return match (strtolower($severity)) {
            'critical' => 'critical',
            'high' => 'high',
            'moderate', 'medium' => 'medium',
            default => 'low',
        };
    }

    private function parseDate(?string $date): ?CarbonImmutable
    {
        return $date ? CarbonImmutable::parse($date) : null;
    }
}
