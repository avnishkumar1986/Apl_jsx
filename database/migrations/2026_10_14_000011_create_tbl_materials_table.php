<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
return new class extends Migration {
 public function up(): void { if(Schema::hasTable('tbl_materials')) return; Schema::create('tbl_materials',function(Blueprint $t){$t->id();$t->string('matnr',40)->index();$t->string('mtart',20)->nullable();$t->string('matkl',40)->nullable()->index();$t->string('meins',10)->nullable();$t->string('maktx');$t->string('plant',10)->nullable()->index();$t->decimal('current_stock',20,3)->default(0);$t->decimal('stock_value',20,3)->default(0);$t->boolean('status')->default(true)->index();$t->unsignedBigInteger('imported_by')->nullable()->index();$t->timestamps();$t->unique(['matnr','plant'],'materials_matnr_plant_unique');}); }
 public function down(): void { Schema::dropIfExists('tbl_materials'); }
};
