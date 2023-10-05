<?php

use Illuminate\Database\Migrations\Migration;

class AddWholeFrameAnnotationShape extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('shapes')->insert([['name' => 'WholeFrame']]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::table('shapes')->where('name', 'WholeFrame')->delete();
    }
}
