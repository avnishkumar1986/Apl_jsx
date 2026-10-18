<?php

namespace App\Support;

final class DeviceLabel
{
    public static function fromUserAgent(?string $userAgent): string
    {
        $userAgent ??= '';

        $device = preg_match('/Mobile|Android|iPhone|iPad|Tablet/i', $userAgent) ? 'Mobile' : 'Laptop';
        $platform = match (true) {
            str_contains($userAgent, 'Windows') => 'Windows',
            str_contains($userAgent, 'Android') => 'Android',
            str_contains($userAgent, 'iPhone'), str_contains($userAgent, 'iPad') => 'iOS',
            str_contains($userAgent, 'Macintosh') => 'macOS',
            str_contains($userAgent, 'Linux') => 'Linux',
            default => 'Unknown OS',
        };
        $browser = match (true) {
            str_contains($userAgent, 'Edg/') => 'Edge',
            str_contains($userAgent, 'Firefox/') => 'Firefox',
            str_contains($userAgent, 'Chrome/') => 'Chrome',
            str_contains($userAgent, 'Safari/') => 'Safari',
            default => 'Browser',
        };

        return "{$device} · {$platform} · {$browser}";
    }
}
