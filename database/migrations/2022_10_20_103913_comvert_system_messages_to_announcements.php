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
        $importantType = DB::table('system_message_types')
            ->where('name', 'important')
            ->first();

        // System messages with a type other than important are converted to archived
        // newsletters by the biigle/newsletter module.
        DB::table('system_messages')
            ->where('type_id', '!=', $importantType->id)
            ->delete();

        Schema::rename('system_messages', 'announcements');

        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn('type_id');
            $table->renameColumn('published_at', 'show_until');
        });

        Schema::drop('system_message_types');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
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

        Schema::rename('announcements', 'system_messages');

        Schema::table('system_messages', function (Blueprint $table) {
            $table->renameColumn('show_until', 'published_at');

            $table->integer('type_id')->unsigned()->nullable();
            $table->foreign('type_id')
                ->references('id')
                ->on('system_message_types')
                  // dont delete type if it is in use
                ->onDelete('restrict');
        });

        $importantType = DB::table('system_message_types')
            ->where('name', 'important')
            ->first();

        DB::table('system_messages')->update(['type_id' => $importantType->id]);

        Schema::table('system_messages', function (Blueprint $table) {
            $table->integer('type_id')->unsigned()->nullable(false)->change();
        });
    }
};
