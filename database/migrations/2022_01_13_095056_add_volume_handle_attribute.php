<?php

use Biigle\Volume;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddVolumeHandleAttribute extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('volumes', function (Blueprint $table) {
            $table->string('handle', 256)->nullable();
        });

        Volume::whereNotNull('attrs->doi')->eachById(function ($volume) {
            $attrs = $volume->attrs;
            $volume->handle = $attrs['doi'];
            unset($attrs['doi']);
            $volume->attrs = $attrs;
            $volume->save();
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Volume::whereNotNull('handle')->eachById(function ($volume) {
            $attrs = $volume->attrs;
            $attrs['doi'] = $volume->handle;
            $volume->attrs = $attrs;
            $volume->save();
        });

        Schema::table('volumes', function (Blueprint $table) {
            $table->dropColumn('handle');
        });
    }
}
