<?php

use Biigle\ReportType;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $oldIds = DB::table('report_types')->pluck('id', 'name');

        $map = [
            $oldIds['ImageAnnotations\Area']              => ReportType::imageAnnotationsAreaId(),
            $oldIds['ImageAnnotations\Basic']             => ReportType::imageAnnotationsBasicId(),
            $oldIds['ImageAnnotations\Csv']               => ReportType::imageAnnotationsCsvId(),
            $oldIds['ImageAnnotations\Extended']          => ReportType::imageAnnotationsExtendedId(),
            $oldIds['ImageAnnotations\Full']              => ReportType::imageAnnotationsFullId(),
            $oldIds['ImageLabels\Basic']                  => ReportType::imageLabelsBasicId(),
            $oldIds['ImageLabels\Csv']                    => ReportType::imageLabelsCsvId(),
            $oldIds['VideoAnnotations\Csv']               => ReportType::videoAnnotationsCsvId(),
            $oldIds['ImageAnnotations\Abundance']         => ReportType::imageAnnotationsAbundanceId(),
            $oldIds['VideoLabels\Csv']                    => ReportType::videoLabelsCsvId(),
            $oldIds['ImageLabels\ImageLocation']          => ReportType::imageLabelsImageLocationId(),
            $oldIds['ImageAnnotations\ImageLocation']    => ReportType::imageAnnotationsImageLocationId(),
            $oldIds['ImageAnnotations\AnnotationLocation'] => ReportType::imageAnnotationsAnnotationLocationId(),
            $oldIds['ImageIfdo']                          => ReportType::imageIfdoId(),
            $oldIds['VideoIfdo']                          => ReportType::videoIfdoId(),
            $oldIds['ImageAnnotations\Coco']              => ReportType::imageAnnotationsCocoId(),
        ];

        foreach ($map as $oldId => $newId) {
            DB::table('reports')
                ->where('type_id', $oldId)
                ->update(['type_id' => $newId]);
        }

        Schema::table('reports', fn (Blueprint $t) => $t->dropForeign(['type_id']));
        Schema::dropIfExists('report_types');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('report_types', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 128)->index();
            $table->unique('name');
        });
        DB::table('report_types')->insert([
            ['id' => ReportType::imageAnnotationsAreaId(),              'name' => 'ImageAnnotations\Area'],
            ['id' => ReportType::imageAnnotationsBasicId(),             'name' => 'ImageAnnotations\Basic'],
            ['id' => ReportType::imageAnnotationsCsvId(),               'name' => 'ImageAnnotations\Csv'],
            ['id' => ReportType::imageAnnotationsExtendedId(),          'name' => 'ImageAnnotations\Extended'],
            ['id' => ReportType::imageAnnotationsFullId(),              'name' => 'ImageAnnotations\Full'],
            ['id' => ReportType::imageLabelsBasicId(),                  'name' => 'ImageLabels\Basic'],
            ['id' => ReportType::imageLabelsCsvId(),                    'name' => 'ImageLabels\Csv'],
            ['id' => ReportType::videoAnnotationsCsvId(),               'name' => 'VideoAnnotations\Csv'],
            ['id' => ReportType::imageAnnotationsAbundanceId(),         'name' => 'ImageAnnotations\Abundance'],
            ['id' => ReportType::videoLabelsCsvId(),                    'name' => 'VideoLabels\Csv'],
            ['id' => ReportType::imageLabelsImageLocationId(),           'name' => 'ImageLabels\ImageLocation'],
            ['id' => ReportType::imageAnnotationsImageLocationId(),     'name' => 'ImageAnnotations\ImageLocation'],
            ['id' => ReportType::imageAnnotationsAnnotationLocationId(),'name' => 'ImageAnnotations\AnnotationLocation'],
            ['id' => ReportType::imageIfdoId(),                         'name' => 'ImageIfdo'],
            ['id' => ReportType::videoIfdoId(),                         'name' => 'VideoIfdo'],
            ['id' => ReportType::imageAnnotationsCocoId(),               'name' => 'ImageAnnotations\Coco'],
        ]);

        Schema::table('reports', function (Blueprint $table) {
            $table->foreign('type_id')
                ->references('id')
                ->on('report_types')
                ->onDelete('restrict');
        });
    }
};
