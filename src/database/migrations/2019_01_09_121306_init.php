<?php

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class Init extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('videos', function (Blueprint $table) {
            $table->increments('id');
            $table->uuid('uuid')->unique();
            $table->string('name');
            $table->string('description')->nullable();
            $table->string('url');

            $table->integer('project_id')->unsigned()->index();
            $table->foreign('project_id')
                  ->references('id')
                  ->on('projects')
                  ->onDelete('cascade');

            $table->json('meta');
            $table->timestamps();
        });

        Schema::create('video_annotations', function (Blueprint $table) {
            $table->increments('id');
            $table->json('frames')->nullable();
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
        Schema::dropIfExists('video_annotations');
        Schema::dropIfExists('videos');
    }
}
