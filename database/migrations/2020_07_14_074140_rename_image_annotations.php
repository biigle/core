<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

class RenameImageAnnotations extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::rename('annotations', 'image_annotations');
        Schema::rename('annotation_labels', 'image_annotation_labels');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::rename('image_annotations', 'annotations');
        Schema::rename('image_annotation_labels', 'annotation_labels');
    }
}
