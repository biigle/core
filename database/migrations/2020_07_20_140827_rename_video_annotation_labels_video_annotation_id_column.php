<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class RenameVideoAnnotationLabelsVideoAnnotationIdColumn extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('video_annotation_labels', function (Blueprint $table) {
            $table->renameColumn('video_annotation_id', 'annotation_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('video_annotation_labels', function (Blueprint $table) {
            $table->renameColumn('annotation_id', 'video_annotation_id');
        });
    }
}
