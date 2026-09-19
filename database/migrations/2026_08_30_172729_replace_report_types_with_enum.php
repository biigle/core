<?php

use Biigle\ReportType;
use Biigle\Support\EnumMigrationHelper;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private $foreignKeys = [
        ['reports', 'type_id']
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $oldIds = DB::table('report_types')->pluck('id', 'name');

        $map = [
            $oldIds['ImageAnnotations\Area']              => ReportType::IMAGE_ANNOTATIONS_AREA->value,
            $oldIds['ImageAnnotations\Basic']             => ReportType::IMAGE_ANNOTATIONS_BASIC->value,
            $oldIds['ImageAnnotations\Csv']               => ReportType::IMAGE_ANNOTATIONS_CSV->value,
            $oldIds['ImageAnnotations\Extended']          => ReportType::IMAGE_ANNOTATIONS_EXTENDED->value,
            $oldIds['ImageAnnotations\Full']              => ReportType::IMAGE_ANNOTATIONS_FULL->value,
            $oldIds['ImageLabels\Basic']                  => ReportType::IMAGE_LABELS_BASIC->value,
            $oldIds['ImageLabels\Csv']                    => ReportType::IMAGE_LABELS_CSV->value,
            $oldIds['VideoAnnotations\Csv']               => ReportType::VIDEO_ANNOTATIONS_CSV->value,
            $oldIds['ImageAnnotations\Abundance']         => ReportType::IMAGE_ANNOTATIONS_ABUNDANCE->value,
            $oldIds['VideoLabels\Csv']                    => ReportType::VIDEO_LABELS_CSV->value,
            $oldIds['ImageLabels\ImageLocation']          => ReportType::IMAGE_LABELS_IMAGE_LOCATION->value,
            $oldIds['ImageAnnotations\ImageLocation']    => ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION->value,
            $oldIds['ImageAnnotations\AnnotationLocation'] => ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION->value,
            $oldIds['ImageIfdo']                          => ReportType::IMAGE_IFDO->value,
            $oldIds['VideoIfdo']                          => ReportType::VIDEO_IFDO->value,
            $oldIds['ImageAnnotations\Coco']              => ReportType::IMAGE_ANNOTATIONS_COCO->value,
        ];

        EnumMigrationHelper::replaceStaticTableWithEnum($map, 'report_types', $this->foreignKeys);
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
            ['id' => ReportType::IMAGE_ANNOTATIONS_AREA->value,              'name' => 'ImageAnnotations\Area'],
            ['id' => ReportType::IMAGE_ANNOTATIONS_BASIC->value,             'name' => 'ImageAnnotations\Basic'],
            ['id' => ReportType::IMAGE_ANNOTATIONS_CSV->value,               'name' => 'ImageAnnotations\Csv'],
            ['id' => ReportType::IMAGE_ANNOTATIONS_EXTENDED->value,          'name' => 'ImageAnnotations\Extended'],
            ['id' => ReportType::IMAGE_ANNOTATIONS_FULL->value,              'name' => 'ImageAnnotations\Full'],
            ['id' => ReportType::IMAGE_LABELS_BASIC->value,                  'name' => 'ImageLabels\Basic'],
            ['id' => ReportType::IMAGE_LABELS_CSV->value,                    'name' => 'ImageLabels\Csv'],
            ['id' => ReportType::VIDEO_ANNOTATIONS_CSV->value,               'name' => 'VideoAnnotations\Csv'],
            ['id' => ReportType::IMAGE_ANNOTATIONS_ABUNDANCE->value,         'name' => 'ImageAnnotations\Abundance'],
            ['id' => ReportType::VIDEO_LABELS_CSV->value,                    'name' => 'VideoLabels\Csv'],
            ['id' => ReportType::IMAGE_LABELS_IMAGE_LOCATION->value,           'name' => 'ImageLabels\ImageLocation'],
            ['id' => ReportType::IMAGE_ANNOTATIONS_IMAGE_LOCATION->value,     'name' => 'ImageAnnotations\ImageLocation'],
            ['id' => ReportType::IMAGE_ANNOTATIONS_ANNOTATION_LOCATION->value, 'name' => 'ImageAnnotations\AnnotationLocation'],
            ['id' => ReportType::IMAGE_IFDO->value,                         'name' => 'ImageIfdo'],
            ['id' => ReportType::VIDEO_IFDO->value,                         'name' => 'VideoIfdo'],
            ['id' => ReportType::IMAGE_ANNOTATIONS_COCO->value,               'name' => 'ImageAnnotations\Coco'],
        ]);

        EnumMigrationHelper::createForeignKeys($this->foreignKeys, 'report_types');
    }
};
