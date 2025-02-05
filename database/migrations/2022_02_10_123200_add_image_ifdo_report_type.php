<?php

use Illuminate\Database\Migrations\Migration;

class AddImageIfdoReportType extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('report_types')->insert([
            ['name' => 'ImageIfdo'],
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::table('report_types')
            ->where('name', 'ImageIfdo')
            ->delete();
    }
}
