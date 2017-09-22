<?php

use Illuminate\Database\Migrations\Migration;

class AddEllipseShape extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        DB::table('shapes')->insert([
            ['name' => 'Ellipse'],
        ]);
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        //
    }
}
