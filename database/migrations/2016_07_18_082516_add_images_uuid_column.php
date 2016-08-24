<?php

use Dias\Image;
use Ramsey\Uuid\Uuid;
use Doctrine\DBAL\Types\Type;
use Ramsey\Uuid\Doctrine\UuidType;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

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

        Schema::table('images', function (Blueprint $table) {
            // make doctrine/dbal work with uuid type
            if (!Type::hasType('uuid')) {
                Type::addType('uuid', UuidType::class);
            }
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
            $table->dropUnique('images_uuid_unique');
            $table->dropColumn('uuid');
        });
    }
}
