<?php

use Illuminate\Database\Migrations\Migration;

class AddLocationReportTypes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('report_types')->insert([
            ['name' => 'ImageLabels\ImageLocation'],
            ['name' => 'ImageAnnotations\ImageLocation'],
            ['name' => 'ImageAnnotations\AnnotationLocation'],
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
            ->whereIn('name', [
                'ImageLabels\ImageLocation',
                'ImageAnnotations\ImageLocation',
                'ImageAnnotations\AnnotationLocation',
            ])
            ->delete();
    }
}
