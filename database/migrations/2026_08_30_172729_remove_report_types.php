<?php

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
            ['name' => 'ImageAnnotations\Area'],
            ['name' => 'ImageAnnotations\Basic'],
            ['name' => 'ImageAnnotations\Csv'],
            ['name' => 'ImageAnnotations\Extended'],
            ['name' => 'ImageAnnotations\Full'],
            ['name' => 'ImageLabels\Basic'],
            ['name' => 'ImageLabels\Csv'],
            ['name' => 'VideoAnnotations\Csv'],
            ['name' => 'ImageAnnotations\Abundance'],
            ['name' => 'VideoLabels\Csv'],
            ['name' => 'ImageLabels\ImageLocation'],
            ['name' => 'ImageAnnotations\ImageLocation'],
            ['name' => 'ImageAnnotations\AnnotationLocation'],
            ['name' => 'ImageIfdo'],
            ['name' => 'VideoIfdo'],
            ['name' => 'ImageAnnotations\Coco'],
        ]);

        Schema::table('reports', function (Blueprint $table) {
            $table->foreign('type_id')
                ->references('id')
                ->on('report_types')
                ->onDelete('restrict');
        });
    }
};
