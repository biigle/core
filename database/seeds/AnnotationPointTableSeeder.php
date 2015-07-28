<?php

use Illuminate\Database\Seeder;
use Dias\AnnotationPoint;

class AnnotationPointTableSeeder extends Seeder
{
    public function run()
    {
        DB::table('annotation_points')->delete();

        AnnotationPoint::create([
            'annotation_id' => 1,
            'index' => 1,
            'x' => 50,
            'y' => 500,
        ]);

        AnnotationPoint::create([
            'annotation_id' => 2,
            'index' => 1,
            'x' => 50,
            'y' => 50,
        ]);

        AnnotationPoint::create([
            'annotation_id' => 2,
            'index' => 2,
            'x' => 250,
            'y' => 50,
        ]);

        AnnotationPoint::create([
            'annotation_id' => 2,
            'index' => 3,
            'x' => 150,
            'y' => 200,
        ]);

        AnnotationPoint::create([
            'annotation_id' => 3,
            'index' => 1,
            'x' => 200,
            'y' => 200,
        ]);

        AnnotationPoint::create([
            'annotation_id' => 3,
            'index' => 2,
            'x' => 400,
            'y' => 400,
        ]);

        AnnotationPoint::create([
            'annotation_id' => 4,
            'index' => 1,
            'x' => 500,
            'y' => 500,
        ]);

        AnnotationPoint::create([
            'annotation_id' => 4,
            'index' => 2,
            'x' => 100,
            'y' => 0,
        ]);
    }
}
