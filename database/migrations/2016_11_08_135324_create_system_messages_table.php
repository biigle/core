<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateSystemMessagesTable extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::create('system_message_types', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 128)->index()->unique();
        });

        // Create the types.
        DB::table('system_message_types')->insert([
            ['name' => 'important'],
            ['name' => 'update'],
            ['name' => 'info'],
        ]);

        /*
         | System messages are broadcasts from the application administrators that reach
         | all users of the instance. Whenevr a new system message is published, each
         | user will get a notification to read it.
         */
        Schema::create('system_messages', function (Blueprint $table) {
            $table->increments('id');
            $table->timestamps();
            $table->timestamp('published_at')->nullable();
            $table->text('body');
            $table->string('title');

            $table->integer('type_id')->unsigned();
            $table->foreign('type_id')
                ->references('id')
                ->on('system_message_types')
                  // dont delete type if it is in use
                ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::dropIfExists('system_messages');
        Schema::dropIfExists('system_message_types');
    }
}
