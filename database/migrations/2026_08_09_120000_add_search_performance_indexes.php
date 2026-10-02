<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('project_volume', function (Blueprint $table) {
            // The only existing index is unique(volume_id, project_id), which
            // cannot serve lookups by project_id alone. That is the direction
            // used whenever the volumes of a user's projects are resolved.
            $table->index('project_id');
        });

        Schema::table('federated_search_model_user', function (Blueprint $table) {
            // Same problem: unique(federated_search_model_id, user_id) does not
            // support the lookup by user_id that every search request performs.
            $table->index('user_id');
        });

        Schema::table('federated_search_models', function (Blueprint $table) {
            $table->index('type');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('federated_search_models', function (Blueprint $table) {
            $table->dropIndex(['type']);
        });

        Schema::table('federated_search_model_user', function (Blueprint $table) {
            $table->dropIndex(['user_id']);
        });

        Schema::table('project_volume', function (Blueprint $table) {
            $table->dropIndex(['project_id']);
        });
    }
};
