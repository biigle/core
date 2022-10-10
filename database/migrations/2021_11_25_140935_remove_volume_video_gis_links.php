<?php

use Biigle\Volume;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RemoveVolumeVideoGisLinks extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Volume::whereNotNull('attrs->video_link')
            ->eachById(function ($volume) {
                $attrs = $volume->attrs;
                unset($attrs['video_link']);
                $volume->attrs = $attrs;
                $volume->save();
            });

        Volume::whereNotNull('attrs->gis_link')
            ->eachById(function ($volume) {
                $attrs = $volume->attrs;
                unset($attrs['gis_link']);
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
        //
    }
}
