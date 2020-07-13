<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddImageLabelsLabelsIndices extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('image_labels', function (Blueprint $table) {
            $table->index('label_id');
            $table->index('image_id');
        });

        Schema::table('labels', function (Blueprint $table) {
            $table->index('parent_id');
            $table->index('label_tree_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('labels', function (Blueprint $table) {
            $table->dropIndex(['parent_id']);
            $table->dropIndex(['label_tree_id']);
        });

        Schema::table('image_labels', function (Blueprint $table) {
            $table->dropIndex(['label_id']);
            $table->dropIndex(['image_id']);
        });
    }
}
