<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class AddPatchesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Schema::create('patches', function (Blueprint $table) {
        //     $table->integer('annotation_id')->unsigned();
        //     $table->foreign('annotation_id')
        //           ->references('id')
        //           ->on('annotations')
        //           ->onDelete('cascade');

        //     $table->string('path');
        // });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
         // Schema::drop('patches');
    }
}
