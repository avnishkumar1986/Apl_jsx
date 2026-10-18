<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration {
    public function up(): void {
        foreach (['material'=>12,'stock'=>8,'vendor'=>5] as $code=>$records) {
            $api=DB::table('tbl_api_integrations')->where('code',$code)->first();
            if(!$api) continue;
            $ranAt=now()->subMinutes($records);
            DB::table('tbl_api_integration_logs')->insert(['api_integration_id'=>$api->id,'run_id'=>(string)Str::uuid(),'status'=>'success','http_status'=>200,'attempt'=>1,'duration_ms'=>420+$records,'records_received'=>$records,'message'=>'Initial reference run imported successfully.','created_at'=>$ranAt]);
            DB::table('tbl_api_integrations')->where('id',$api->id)->update(['last_run_status'=>'success','last_run_at'=>$ranAt]);
        }
    }
    public function down(): void { DB::table('tbl_api_integration_logs')->where('message','Initial reference run imported successfully.')->delete(); }
};
