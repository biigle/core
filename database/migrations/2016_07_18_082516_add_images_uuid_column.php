<?php

use Biigle\Image;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Ramsey\Uuid\Doctrine\UuidType;
use Ramsey\Uuid\Uuid;

class AddImagesUuidColumn extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('images', function (Blueprint $table) {
            $table->uuid('uuid')->nullable();
            $table->unique('uuid');
        });

        Image::unguard();
        Image::select('id')->chunkById(1000, function ($images) {
            foreach ($images as $image) {
                $image->update(['uuid' => Uuid::uuid4()]);
            }
        });
        Image::reguard();

        Schema::table('images', function (Blueprint $table) {
            $table->uuid('uuid')
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
            // do this in its own transaction, else it would clash with dropColumn
            $table->dropUnique('images_uuid_unique');
        });

        Schema::table('images', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }
}
