<?php

$pageSizeOptions = array_values(array_filter(array_map(
    static fn (string $value): int => (int) trim($value),
    explode(',', (string) env('DATATABLE_PAGE_SIZE_OPTIONS', '10,25,50,100')),
)));

return [
    'per_page' => (int) env('DATATABLE_PER_PAGE', 50),
    'page_size_options' => $pageSizeOptions,
];
