<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class ApiIntegrationLog extends Model {
    public $timestamps=false; protected $table='tbl_api_integration_logs';
    protected $fillable=['api_integration_id','run_id','status','http_status','attempt','duration_ms','records_received','message','response_excerpt','created_by','created_at'];
    protected function casts(): array { return ['created_at'=>'datetime']; }
    public function integration(): BelongsTo { return $this->belongsTo(ApiIntegration::class,'api_integration_id'); }
}
