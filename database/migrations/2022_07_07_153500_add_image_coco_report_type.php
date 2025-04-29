<?php

use Illuminate\Database\Migrations\Migration;

class AddImageCocoReportType extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('report_types')->insert(
            ['name' => 'ImageAnnotations\Coco'],
        );
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::table('report_types')
            ->where('name', 'ImageAnnotations\Coco')
            ->delete();
    }
}
