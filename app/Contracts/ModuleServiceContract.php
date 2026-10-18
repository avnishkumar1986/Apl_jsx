<?php
namespace App\Contracts;
interface ModuleServiceContract
{
    /** @return array<string,mixed> */ public function metadata(): array;
    /** @return array{status:string,message:string} */ public function health(): array;
}
