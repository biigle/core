<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateVideoLabelsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('video_labels', function (Blueprint $table) {
            $table->increments('id');

            $table->integer('video_id')->unsigned();
            $table->foreign('video_id')
                ->references('id')
                ->on('videos')
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
                  // don't delete labels if the creator is deleted
                ->onDelete('set null');

            $table->timestamps();

            // each video may have the same label attached only once
            $table->unique(['video_id', 'label_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('video_labels');
    }
}
