<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Dias\Annotation;
use Dias\Shape;

class DropAnnotationPointsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        /*
         | Instead of storing each annotation point in a separate database table,
         | we will store them in a JSON array directly in the annotation from now on.
         | An annotation is always fetched together with its points and points are
         | updated by entirely replacing the previous points so this will be way faster
         | and easier to handle.
         */
        Schema::table('annotations', function (Blueprint $table) {
            $table->json('points')->default('[]');
        });


        $circleId = Shape::$circleId;

        $count = DB::table('annotations')->count();
        $processed = 0;
        $chunk = 10000;
        $silent = App::runningInConsole() && App::runningUnitTests();
        if (!$silent) echo "Progress:        ";

        DB::table('annotations')->select('id', 'points', 'shape_id')
            ->chunk($chunk, function ($annotations) use ($circleId, &$processed, $count, $silent) {

                foreach ($annotations as $annotation) {
                    $points = DB::table('annotation_points')
                        ->where('annotation_id', $annotation->id)
                        ->orderBy('index', 'asc')
                        ->get();

                    // convert old points to new points array
                    $points = array_reduce($points, function ($carry, $item) {
                        $carry[] = $item->x;
                        $carry[] = $item->y;
                        return $carry;
                    }, []);

                    // take only the first tree values for circles
                    if ($annotation->shape_id === $circleId) {
                        $points = [$points[0], $points[1], $points[2]];
                    }

                    DB::table('annotations')
                        ->where('id', $annotation->id)
                        ->update(['points' => json_encode($points)]);

                    if (!$silent) {
                        echo "\033[8D";
                        echo str_pad(round($processed++ / $count * 100, 2), 6, ' ', STR_PAD_LEFT).' %';
                    }
                }
        });

        if (!$silent) echo "\n";

        Schema::drop('annotation_points');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::create('annotation_points', function (Blueprint $table) {
            $table->increments('id');

            // points are primarily searched by annotation, so do index
            $table->integer('annotation_id')->unsigned()->index();
            $table->foreign('annotation_id')
                  ->references('id')
                  ->on('annotations')
                  // delete all points of a deleted annotation
                  ->onDelete('cascade');

            // for e.g. polygons the ordering of the points is essential, so the
            // polygon can be correctly reconstructed
            $table->integer('index');

            // point index must be unique for each annotation
            $table->unique(['annotation_id', 'index']);

            $table->integer('x');
            $table->integer('y');

            // NO timestamps
        });

        $circleId = Shape::$circleId;
        $count = DB::table('annotations')->count();
        $processed = 0;
        $chunk = 10000;
        $silent = App::runningInConsole() && App::runningUnitTests();

        if (!$silent) echo "Progress:        ";

        DB::table('annotations')->select('id', 'points', 'shape_id')
            ->chunk($chunk, function ($annotations) use ($circleId, &$processed, $count) {
                foreach ($annotations as $annotation) {
                    $oldPoints = json_decode($annotation->points);
                    $size = sizeof($oldPoints);

                    if ($annotation->shape_id === $circleId) {
                        $newPoints = [
                            [
                                'annotation_id' => $annotation->id,
                                'index' => 0,
                                'x' => $oldPoints[0],
                                'y' => $oldPoints[1],
                            ],
                            [
                                'annotation_id' => $annotation->id,
                                'index' => 1,
                                'x' => $oldPoints[2],
                                'y' => 0,
                            ]
                        ];
                    } else {
                        $newPoints = [];
                        $index = 0;

                        for ($i= 0; $i < $size; $i += 2) {
                            $newPoints[] = [
                                'annotation_id' => $annotation->id,
                                'index' => $index++,
                                'x' => $oldPoints[$i],
                                'y' => $oldPoints[$i + 1],
                            ];
                        }
                    }

                    DB::table('annotation_points')->insert($newPoints);

                    if (!$silent) {
                        echo "\033[8D";
                        echo str_pad(round($processed++ / $count * 100, 2), 6, ' ', STR_PAD_LEFT).' %';
                    }
                }
        });

        if (!$silent) echo "\n";

        Schema::table('annotations', function (Blueprint $table) {
            $table->dropColumn('points');
        });
    }
}
