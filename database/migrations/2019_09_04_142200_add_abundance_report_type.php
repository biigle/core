<?php

use Illuminate\Database\Migrations\Migration;

class AddAbundanceReportType extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('report_types')->insert([
            ['name' => 'Annotations\Abundance'],
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
            ->where('name', 'Annotations\Abundance')
            ->delete();
    }
}
