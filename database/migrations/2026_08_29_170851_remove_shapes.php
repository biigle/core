<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    private $foreignKeys = [
        ['image_annotations', 'shape_id', 'annotations_shape_id_foreign'],
        ['video_annotations', 'shape_id', 'video_annotations_shape_id_foreign'],
    ];

    /**
     * Run the migrations.
     */
    public function up(): void
    {
        foreach ($this->foreignKeys as [$table, $column, $constraint]) {
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
            ['id' => 1, 'name' => 'Point'],
            ['id' => 2, 'name' => 'LineString'],
            ['id' => 3, 'name' => 'Polygon'],
            ['id' => 4, 'name' => 'Circle'],
            ['id' => 5, 'name' => 'Rectangle'],
            ['id' => 6, 'name' => 'Ellipse'],
            ['id' => 7, 'name' => 'WholeFrame'],
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
