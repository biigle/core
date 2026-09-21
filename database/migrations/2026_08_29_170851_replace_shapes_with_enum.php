<?php

use Biigle\Shape;
use Biigle\Support\EnumMigrationHelper;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    private $foreignKeys = [
        ['image_annotations', 'shape_id', 'annotations_shape_id_foreign'],
        ['video_annotations', 'shape_id', 'video_annotations_shape_id_foreign'],
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $oldIds = DB::table('shapes')->pluck('id', 'name');
        $map = [
            $oldIds['Point']      => Shape::POINT->value,
            $oldIds['LineString'] => Shape::LINE->value,
            $oldIds['Polygon']    => Shape::POLYGON->value,
            $oldIds['Circle']     => Shape::CIRCLE->value,
            $oldIds['Rectangle']  => Shape::RECTANGLE->value,
            $oldIds['Ellipse']    => Shape::ELLIPSE->value,
            $oldIds['WholeFrame'] => Shape::WHOLE_FRAME->value,
        ];

        EnumMigrationHelper::replaceStaticTableWithEnum($map, 'shapes', $this->foreignKeys, true);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::create('shapes', function (Blueprint $t) {
            $t->increments('id');
            $t->string('name', 256);
        });

        DB::table('shapes')->insert([
            ['id' => Shape::POINT->value,      'name' => 'Point'],
            ['id' => Shape::LINE->value,       'name' => 'LineString'],
            ['id' => Shape::POLYGON->value,    'name' => 'Polygon'],
            ['id' => Shape::CIRCLE->value,     'name' => 'Circle'],
            ['id' => Shape::RECTANGLE->value,  'name' => 'Rectangle'],
            ['id' => Shape::ELLIPSE->value,    'name' => 'Ellipse'],
            ['id' => Shape::WHOLE_FRAME->value, 'name' => 'WholeFrame'],
        ]);

        EnumMigrationHelper::createForeignKeys($this->foreignKeys, 'shapes', true);
    }
};
