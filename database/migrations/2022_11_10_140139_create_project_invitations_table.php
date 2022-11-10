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
        Schema::create('project_invitations', function (Blueprint $table) {
            $table->id();
            $table->timestamps();
            $table->timestampTz('expires_at');
            $table->uuid('uuid');
            // How many users have used the invitation to add themselves to the project.
            $table->unsignedInteger('current_uses')->default(0);
            // How many uses are allowed before the invitation expires.
            $table->unsignedInteger('max_uses')->nullable();

            $table->integer('project_id')->unsigned();
            $table->foreign('project_id')
                  ->references('id')
                  ->on('projects')
                  ->onDelete('cascade');

            $table->integer('role_id')->unsigned();
            $table->foreign('role_id')
                  ->references('id')
                  ->on('roles')
                  ->onDelete('restrict');
        });

        DB::statement('ALTER TABLE project_invitations ADD CONSTRAINT check_max_uses CHECK ("max_uses" IS NULL OR "current_uses" <= "max_uses")');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('project_invitations');
    }
};
