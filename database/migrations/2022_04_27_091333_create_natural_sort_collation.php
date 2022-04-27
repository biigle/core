<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        // Create a collation to sort strings "naturally".
        // See: https://stackoverflow.com/a/67975489/1796523
        DB::statement('CREATE COLLATION "natural" (provider = icu, locale = "en@colNumeric=yes");');

        DB::statement('ALTER TABLE "images" ALTER COLUMN "filename" type VARCHAR(512) COLLATE "natural";');
        DB::statement('ALTER TABLE "videos" ALTER COLUMN "filename" type VARCHAR(512) COLLATE "natural";');
        DB::statement('ALTER TABLE "projects" ALTER COLUMN "name" type VARCHAR(512) COLLATE "natural";');
        DB::statement('ALTER TABLE "volumes" ALTER COLUMN "name" type VARCHAR(512) COLLATE "natural";');
        DB::statement('ALTER TABLE "labels" ALTER COLUMN "name" type VARCHAR(512) COLLATE "natural";');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        DB::statement('ALTER TABLE "labels" ALTER COLUMN "name" type VARCHAR(512) COLLATE pg_catalog."default";');
        DB::statement('ALTER TABLE "volumes" ALTER COLUMN "name" type VARCHAR(512) COLLATE pg_catalog."default";');
        DB::statement('ALTER TABLE "projects" ALTER COLUMN "name" type VARCHAR(512) COLLATE pg_catalog."default";');
        DB::statement('ALTER TABLE "videos" ALTER COLUMN "filename" type VARCHAR(512) COLLATE pg_catalog."default";');
        DB::statement('ALTER TABLE "images" ALTER COLUMN "filename" type VARCHAR(512) COLLATE pg_catalog."default";');

        DB::statement('DROP COLLATION IF EXISTS "natural";');
    }
};
