<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateImageLabelsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        /*
        | Table of pivot objects for image labels. Each image can get a label attached to
        | similar to annotations. But where annotations can get the same label attached
        | multiple times by different users, images can have the same label attached only
        | once.
        | If a user is deleted, their image labels should persist.
        */
        Schema::create('image_labels', function (Blueprint $table) {
            $table->increments('id');

            $table->integer('image_id')->unsigned();
            $table->foreign('image_id')
                  ->references('id')
                  ->on('images')
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

            // each image may have the same label attached only once
            $table->unique(['image_id', 'label_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('image_labels');
    }
}
