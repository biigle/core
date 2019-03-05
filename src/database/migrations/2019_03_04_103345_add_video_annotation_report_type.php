<?php

use Illuminate\Database\Migrations\Migration;

class AddVideoAnnotationReportType extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('report_types')->insert([
            ['name' => 'VideoAnnotations\Csv'],
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
            ->where('name', 'VideoAnnotations\Csv')
            ->delete();
    }
}
