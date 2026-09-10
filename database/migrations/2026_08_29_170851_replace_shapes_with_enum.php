<?php

use Biigle\Shape;
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
            $oldIds['Point']      => Shape::pointId(),
            $oldIds['LineString'] => Shape::lineId(),
            $oldIds['Polygon']    => Shape::polygonId(),
            $oldIds['Circle']     => Shape::circleId(),
            $oldIds['Rectangle']  => Shape::rectangleId(),
            $oldIds['Ellipse']    => Shape::ellipseId(),
            $oldIds['WholeFrame'] => Shape::wholeFrameId(),
        ];

        foreach ($this->foreignKeys as [$table, $column, $constraint]) {
            foreach ($map as $oldId => $newId) {
                DB::table($table)
                    ->where($column, $oldId)
                    ->update([$column => $newId]);
            }

            Schema::table($table, fn (Blueprint $t) => $t->dropForeign($constraint));
        }
        Schema::dropIfExists('shapes');
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
            ['id' => Shape::pointId(),      'name' => 'Point'],
            ['id' => Shape::lineId(),       'name' => 'LineString'],
            ['id' => Shape::polygonId(),    'name' => 'Polygon'],
            ['id' => Shape::circleId(),     'name' => 'Circle'],
            ['id' => Shape::rectangleId(),  'name' => 'Rectangle'],
            ['id' => Shape::ellipseId(),    'name' => 'Ellipse'],
            ['id' => Shape::wholeFrameId(), 'name' => 'WholeFrame'],
        ]);

        foreach ($this->foreignKeys as [$table, $column, $constraint]) {
            Schema::table($table, function (Blueprint $t) use ($column, $constraint) {
                $t->foreign($column, $constraint)
                    ->references('id')
                    ->on('shapes')
                    ->onDelete('restrict');
            });
        }
    }
};
