<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateAnnotationLabelIndex extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('annotation_labels', function (Blueprint $table) {
            $table->index('annotation_id');
            $table->index('label_id');
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
        Schema::table('annotation_labels', function (Blueprint $table) {
            $table->dropIndex('annotation_labels_annotation_id_index');
            $table->dropIndex('annotation_labels_label_id_index');
            $table->dropIndex('annotation_labels_user_id_index');
        });
    }
}
