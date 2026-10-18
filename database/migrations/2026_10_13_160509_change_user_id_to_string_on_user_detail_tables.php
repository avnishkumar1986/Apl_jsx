<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        foreach ($this->tables() as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->string('user_id', 10)->change();
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlite') {
            return;
        }

        foreach ($this->tables() as $tableName) {
            Schema::table($tableName, function (Blueprint $table): void {
                $table->unsignedBigInteger('user_id')->change();
            });
        }
    }

    /**
     * @return list<string>
     */
    private function tables(): array
    {
        return [
            'tbl_usraddress',
            'tbl_usrbanking',
            'tbl_usrcontact',
            'tbl_usrdocument',
            'tbl_usreducation',
            'tbl_usrlogin',
            'tbl_usrsclaccount',
        ];
    }
};
