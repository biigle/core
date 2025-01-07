<?php

use Biigle\ReportType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RenameReportTypes extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        ReportType::where('name', 'Annotations\Area')
            ->update(['name' => 'ImageAnnotations\Area']);

        ReportType::where('name', 'Annotations\Basic')
            ->update(['name' => 'ImageAnnotations\Basic']);

        ReportType::where('name', 'Annotations\Csv')
            ->update(['name' => 'ImageAnnotations\Csv']);

        ReportType::where('name', 'Annotations\Extended')
            ->update(['name' => 'ImageAnnotations\Extended']);

        ReportType::where('name', 'Annotations\Full')
            ->update(['name' => 'ImageAnnotations\Full']);

        ReportType::where('name', 'Annotations\Abundance')
            ->update(['name' => 'ImageAnnotations\Abundance']);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        ReportType::where('name', 'ImageAnnotations\Area')
            ->update(['name' => 'Annotations\Area']);

        ReportType::where('name', 'ImageAnnotations\Basic')
            ->update(['name' => 'Annotations\Basic']);

        ReportType::where('name', 'ImageAnnotations\Csv')
            ->update(['name' => 'Annotations\Csv']);

        ReportType::where('name', 'ImageAnnotations\Extended')
            ->update(['name' => 'Annotations\Extended']);

        ReportType::where('name', 'ImageAnnotations\Full')
            ->update(['name' => 'Annotations\Full']);

        ReportType::where('name', 'ImageAnnotations\Abundance')
            ->update(['name' => 'Annotations\Abundance']);
    }
}
