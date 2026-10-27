<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration {
    public function up(): void {
        $now = now();
        DB::table('tbl_api_integrations')->insert([
            ['name'=>'Material API','code'=>'material','description'=>'Material','endpoint'=>env('MATERIAL_API_ENDPOINT'),'method'=>'GET','auth_type'=>'basic','credential_key'=>'PROCUREMENT_STOCK_API_TOKEN','target_table'=>'tbl_materials','retries'=>3,'retry_delay_seconds'=>10,'timeout_seconds'=>30,'status'=>1,'created_at'=>$now,'updated_at'=>$now],
            ['name'=>'Stock API','code'=>'stock','description'=>'Stock','endpoint'=>env('STOCK_API_ENDPOINT'),'method'=>'GET','auth_type'=>'basic','credential_key'=>'PROCUREMENT_STOCK_API_TOKEN','target_table'=>'tbl_material_stocks','retries'=>1,'retry_delay_seconds'=>5,'timeout_seconds'=>30,'status'=>1,'created_at'=>$now,'updated_at'=>$now],
            ['name'=>'Vendor API','code'=>'vendor','description'=>'Vendor','endpoint'=>env('VENDOR_API_ENDPOINT'),'method'=>'GET','auth_type'=>'basic','credential_key'=>'PROCUREMENT_STOCK_API_TOKEN','target_table'=>'tbl_vendors','retries'=>3,'retry_delay_seconds'=>10,'timeout_seconds'=>30,'status'=>1,'created_at'=>$now,'updated_at'=>$now],
            ['name'=>'Quality API','code'=>'quality','description'=>'Quality','endpoint'=>null,'method'=>'GET','auth_type'=>'basic','credential_key'=>'QUALITY_API_TOKEN','target_table'=>null,'retries'=>3,'retry_delay_seconds'=>10,'timeout_seconds'=>30,'status'=>0,'created_at'=>$now,'updated_at'=>$now],
            ['name'=>'Production API','code'=>'production','description'=>'Production · current environment','endpoint'=>null,'method'=>'GET','auth_type'=>'basic','credential_key'=>'PRODUCTION_API_TOKEN','target_table'=>null,'retries'=>3,'retry_delay_seconds'=>10,'timeout_seconds'=>30,'status'=>0,'created_at'=>$now,'updated_at'=>$now],
        ]);
    }
    public function down(): void { DB::table('tbl_api_integrations')->whereIn('code',['material','stock','vendor','quality','production'])->delete(); }
};
