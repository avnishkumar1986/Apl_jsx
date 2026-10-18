<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void { if(Schema::hasColumn('tbl_api_integrations','credential_value')) Schema::table('tbl_api_integrations',fn(Blueprint $t)=>$t->dropColumn('credential_value')); }
 public function down(): void { if(!Schema::hasColumn('tbl_api_integrations','credential_value')) Schema::table('tbl_api_integrations',fn(Blueprint $t)=>$t->text('credential_value')->nullable()->after('credential_key')); }
};
