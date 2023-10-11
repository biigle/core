<?php

use Biigle\Volume;
use Illuminate\Database\Migrations\Migration;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Volume::where('url', 'like', '%/')->eachById(function ($volume) {
            // This will strip trailing slashes where necessary.
            $volume->url = $volume->url;
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
};
