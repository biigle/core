<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateAnnotationsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('shapes', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 256);
            // NO timestamps
        });

        DB::table('shapes')->insert([
            ['name' => 'Point'],
            ['name' => 'Circle'],
        ]);

        Schema::create('annotations', function (Blueprint $table) {
            $table->increments('id');
            $table->json('points')->nullable();

            $table->integer('video_id')->unsigned()->index();
            $table->foreign('video_id')
                  ->references('id')
                  ->on('videos')
                  // delete all annotations of a deleted video
                  ->onDelete('cascade');

            $table->integer('shape_id')->unsigned();
            $table->foreign('shape_id')
                  ->references('id')
                  ->on('shapes')
                  // don't delete shapes that are used
                  ->onDelete('restrict');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('annotations');
        Schema::dropIfExists('shapes');
    }
}
