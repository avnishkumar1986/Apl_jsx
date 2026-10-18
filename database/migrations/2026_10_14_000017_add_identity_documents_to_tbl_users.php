<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void { Schema::table('tbl_users',function(Blueprint $t){$t->string('aadhaar_number',12)->nullable()->unique()->after('anniversary_date');$t->string('aadhaar_image')->nullable()->after('aadhaar_number');$t->string('pan_number',10)->nullable()->unique()->after('aadhaar_image');$t->string('pan_image')->nullable()->after('pan_number');}); }
 public function down(): void { Schema::table('tbl_users',fn(Blueprint $t)=>$t->dropColumn(['aadhaar_number','aadhaar_image','pan_number','pan_image'])); }
};
