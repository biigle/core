<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

class RenameReportTypes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('report_types')->where('name', 'Annotations\Area')
            ->update(['name' => 'ImageAnnotations\Area']);

        DB::table('report_types')->where('name', 'Annotations\Basic')
            ->update(['name' => 'ImageAnnotations\Basic']);

        DB::table('report_types')->where('name', 'Annotations\Csv')
            ->update(['name' => 'ImageAnnotations\Csv']);

        DB::table('report_types')->where('name', 'Annotations\Extended')
            ->update(['name' => 'ImageAnnotations\Extended']);

        DB::table('report_types')->where('name', 'Annotations\Full')
            ->update(['name' => 'ImageAnnotations\Full']);

        DB::table('report_types')->where('name', 'Annotations\Abundance')
            ->update(['name' => 'ImageAnnotations\Abundance']);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::table('report_types')->where('name', 'ImageAnnotations\Area')
            ->update(['name' => 'Annotations\Area']);

        DB::table('report_types')->where('name', 'ImageAnnotations\Basic')
            ->update(['name' => 'Annotations\Basic']);

        DB::table('report_types')->where('name', 'ImageAnnotations\Csv')
            ->update(['name' => 'Annotations\Csv']);

        DB::table('report_types')->where('name', 'ImageAnnotations\Extended')
            ->update(['name' => 'Annotations\Extended']);

        DB::table('report_types')->where('name', 'ImageAnnotations\Full')
            ->update(['name' => 'Annotations\Full']);

        DB::table('report_types')->where('name', 'ImageAnnotations\Abundance')
            ->update(['name' => 'Annotations\Abundance']);
    }
}
