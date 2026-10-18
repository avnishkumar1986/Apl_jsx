<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Material extends Model {
 protected $table='tbl_materials';
 protected $fillable=['matnr','mtart','matkl','meins','maktx','api_payload','status','imported_by'];
 protected function casts(): array { return ['api_payload'=>'array','status'=>'boolean']; }
}
