<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Dias\Image;

class AddImagesTransectIdConstraint extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        /*
         | Remove all image thumbnails marked for deletion.
         */
        Image::whereNull('transect_id')->chunk(100, function ($images) {
            event('images.cleanup', [$images->pluck('id')->all()]);
            foreach ($images as $image) {
                if (File::exists($image->thumbPath)) {
                    File::delete($image->thumbPath);
                }
            }
        });

        // never delete items inside of chunk()
        // http://blog.krucas.lt/2015/11/database-chunk-delete/
        Image::whereNull('transect_id')->delete();

        Schema::table('images', function (Blueprint $table) {
            $table->dropForeign('images_transect_id_foreign');

            $table->integer('transect_id')
                ->unsigned()
                ->nullable(false)
                ->change();

            $table->foreign('transect_id')
                  ->references('id')
                  ->on('transects')
                  ->onDelete('cascade');
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
            $table->dropForeign('images_transect_id_foreign');

            $table->integer('transect_id')
                ->unsigned()
                ->nullable()
                ->change();

            $table->foreign('transect_id')
                  ->references('id')
                  ->on('transects')
                  ->onDelete('set null');
        });
    }
}
