<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateVideosTables extends Migration
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
            $table->string('url');

            $table->integer('project_id')->unsigned()->index();
            $table->foreign('project_id')
                ->references('id')
                ->on('projects')
                ->onDelete('cascade');

            $table->json('attrs')->nullable();
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

        Schema::create('video_annotation_labels', function (Blueprint $table) {
            $table->increments('id');
            $table->integer('video_annotation_id')->unsigned();
            $table->foreign('video_annotation_id')
                ->references('id')
                ->on('video_annotations')
                ->onDelete('cascade');

            $table->integer('label_id')->unsigned();
            $table->foreign('label_id')
                ->references('id')
                ->on('labels')
                  // don't delete labels in use
                ->onDelete('restrict');

            $table->integer('user_id')->unsigned()->nullable();
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                  // don't delete video annotation labels if the creator is deleted
                ->onDelete('set null');

            $table->timestamps();

            // each user may set the same label only once for each video annotation
            $table->unique(['video_annotation_id', 'label_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('video_annotation_labels');
        Schema::dropIfExists('video_annotations');
        Schema::dropIfExists('videos');
    }
}
