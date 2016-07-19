<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Dias\Image;

class AddImagesTokenColumn extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('images', function (Blueprint $table) {
            $table->string('token', 15)->nullable();
        });


        Image::select('id')->chunk(500, function ($images) {
            foreach ($images as $image) {
                $image->update(['token' => str_random(15)]);
            }
        });

        Schema::table('images', function (Blueprint $table) {
            $table->string('token', 15)
                ->nullable(false)
                ->change();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('images', function (Blueprint $table) {
            $table->dropColumn('token');
        });
    }
}
