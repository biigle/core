<?php

use Illuminate\Database\Migrations\Migration;

class AddVideoLabelReportType extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('report_types')->insert([
            ['name' => 'VideoLabels\Csv'],
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
            ->where('name', 'VideoLabels\Csv')
            ->delete();
    }
}
