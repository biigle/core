<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Dias\Modules\Copria\ColorSort\Sequence;

class CreateCopriaColorSortSequencesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create(Sequence::DB_TABLE_NAME, function (Blueprint $table) {
            $table->increments('id');

            $table->integer('transect_id')->unsigned();
            $table->foreign('transect_id')
              ->references('id')
              ->on('transects')
              // if the transect is deleted, the color sort information should be deleted, too
              ->onDelete('cascade');

            // hex color like BADA55
            $table->string('color', 6);
            // token used to authenticate the response from Copria
            $table->string('token')->nullable()->index();
            // the sequence of image IDs when sorted by this color
            $table->json('sequence')->nullable();

            $table->index(['transect_id', 'color']);
            $table->unique(['transect_id', 'color']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop(Sequence::DB_TABLE_NAME);
    }
}
