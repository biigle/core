<?php

use Biigle\LabelTree;
use Biigle\Project;
use Biigle\Volume;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddFederatedSearchTables extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('federated_search_instances', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 512);
            $table->string('url', 512);
            // The token the remote instance uses to authenticate with the local
            // instance (hashed).
            $table->string('local_token')->nullable();
            // The token the local instance uses to authenticate with the remote instance
            // (encrypted).
            $table->text('remote_token')->nullable();
            $table->timestamps();
            $table->timestamp('indexed_at')->nullable();

            $table->unique('url');
            $table->unique('local_token');
        });

        Schema::create('federated_search_models', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->enum('type', [LabelTree::class, Project::class, Volume::class]);
            $table->string('name', 512);
            $table->string('url', 512);
            $table->text('description')->nullable();
            $table->json('attrs')->nullable();
            $table->timestamps();

            $table->unsignedInteger('federated_search_instance_id');
            $table->foreign('federated_search_instance_id')
                ->references('id')
                ->on('federated_search_instances')
                ->onDelete('cascade');
        });

        Schema::create('federated_search_model_user', function (Blueprint $table) {
            $table->unsignedBigInteger('federated_search_model_id');
            $table->foreign('federated_search_model_id')
                ->references('id')
                ->on('federated_search_models')
                ->onDelete('cascade');

            $table->unsignedInteger('user_id');
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                ->onDelete('cascade');

            $table->unique(['federated_search_model_id', 'user_id']);
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('federated_search_model_user');
        Schema::dropIfExists('federated_search_models');
        Schema::dropIfExists('federated_search_instances');
    }
}
