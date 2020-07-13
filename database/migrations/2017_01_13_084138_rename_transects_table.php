<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RenameTransectsTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::rename('transects', 'volumes');
        Schema::rename('project_transect', 'project_volume');

        Schema::table('project_volume', function (Blueprint $table) {
            $table->renameColumn('transect_id', 'volume_id');
        });

        Schema::table('images', function (Blueprint $table) {
            $table->renameColumn('transect_id', 'volume_id');
        });

        Schema::table('annotation_sessions', function (Blueprint $table) {
            $table->renameColumn('transect_id', 'volume_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('annotation_sessions', function (Blueprint $table) {
            $table->renameColumn('volume_id', 'transect_id');
        });

        Schema::table('images', function (Blueprint $table) {
            $table->renameColumn('volume_id', 'transect_id');
        });

        Schema::table('project_volume', function (Blueprint $table) {
            $table->renameColumn('volume_id', 'transect_id');
        });

        Schema::rename('project_volume', 'project_transect');
        Schema::rename('volumes', 'transects');
    }
}
