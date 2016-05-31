<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateVisibilitiesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        /*
        | Types of visibility that different models can have. E.g. a label category
        | tree may be "public" or "private".
        */
        Schema::create('visibilities', function (Blueprint $table) {
            $table->increments('id');
            // visibilities are primarily searched by name, so do index
            $table->string('name', 128)->index();

            // each visibility type should be unique
            $table->unique('name');

            // NO timestamps
        });

        DB::table('visibilities')->insert([
            ['name' => 'public'],
            ['name' => 'private'],
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::drop('visibilities');
    }
}
