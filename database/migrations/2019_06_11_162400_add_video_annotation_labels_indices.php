<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddVideoAnnotationLabelsIndices extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('video_annotation_labels', function (Blueprint $table) {
            $table->index('label_id');
            $table->index('video_annotation_id');
            $table->index('user_id');
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
            $table->dropIndex(['label_id']);
            $table->dropIndex(['video_annotation_id']);
            $table->dropIndex(['user_id']);
        });
    }
}
