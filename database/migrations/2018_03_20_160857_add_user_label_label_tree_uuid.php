<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Ramsey\Uuid\Doctrine\UuidType;
use Ramsey\Uuid\Uuid;

class AddUserLabelLabelTreeUuid extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        $this->addUuidToTable('users');
        $this->addUuidToTable('label_trees');
        $this->addUuidToTable('labels');
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('labels', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });

        Schema::table('label_trees', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('uuid');
        });
    }

    /**
     * Add a UUID column to the given table.
     *
     * @param string $table
     */
    protected function addUuidToTable($table)
    {
        Schema::table($table, function (Blueprint $table) {
            $table->uuid('uuid')->nullable();
            $table->unique('uuid');
        });

        DB::table($table)->pluck('id')->each(function ($id) use ($table) {
            DB::table($table)->where('id', $id)->update(['uuid' => Uuid::uuid4()]);
        });

        Schema::table($table, function (Blueprint $table) {
            $table->uuid('uuid')->nullable(false)->change();
        });
    }
}
