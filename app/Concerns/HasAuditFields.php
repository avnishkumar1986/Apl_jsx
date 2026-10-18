<?php

namespace App\Concerns;

use Illuminate\Database\Eloquent\Model;

class HasAuditFields
{
    public static function creating(Model $model): void
    {
        $model->setAttribute('status', $model->getAttribute('status') ?? true);
        $model->setAttribute('created_by', $model->getAttribute('created_by') ?? auth()->id());
        $model->setAttribute('updated_by', $model->getAttribute('updated_by') ?? auth()->id());
    }

    public static function updating(Model $model): void
    {
        $model->setAttribute('updated_by', auth()->id());
    }
}
