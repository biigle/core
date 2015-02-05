<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class CreateAttributesTable extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		/*
		| Attributes are generic. Multiple Models can have attributes, and some
		| even can have the same attributes. E.g. an attribute may be a 'new'
		| tag for a project or a transect. Each attribute is of a certain type.
		| The value of the attribute is stored in the pivot table for the related
		| model.
		|
		| Attributes are not directly stored in the tables of their related
		| models because they are very seldom assigned to an object (e.g. 'new').
		*/
		Schema::create('attributes', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 512);
			// types, each attribute can have
			$table->enum('type', array('integer', 'double', 'string', 'boolean'));

			// NO timestamps
		});

		/*
		| Now follow the attribute to object relations for each model that
		| may have attributes. We don't use a single pivot table and polymorphic
		| relations for this because of the use of foreign keys.
		|
		| Each object may have the same attribute only once. Each relation 
		| stores the value of the attribute, depending on the type. A boolean
		| is defined by the relation (true if related, false otherwise) and 	
		| doesn't need a special column.
		*/

		Schema::create('attribute_project', function(Blueprint $table) {
			$table->integer('attribute_id')->unsigned();
			$table->foreign('attribute_id')
			      ->references('id')
			      ->on('attributes')
			      // don't delete attributes in use
			      ->onDelete('restrict');

			$table->integer('project_id')->unsigned();
			$table->foreign('project_id')
			      ->references('id')
			      ->on('projects')
			      ->onDelete('cascade');

			$table->unique(array('attribute_id', 'project_id'));

			$table->integer('value_int')->nullable();
			$table->double('value_double')->nullable();
			$table->string('value_string', 512)->nullable();
		});

		Schema::create('attribute_user', function(Blueprint $table) {
			$table->integer('attribute_id')->unsigned();
			$table->foreign('attribute_id')
			      ->references('id')
			      ->on('attributes')
			      // don't delete attributes in use
			      ->onDelete('restrict');

			$table->integer('user_id')->unsigned();
			$table->foreign('user_id')
			      ->references('id')
			      ->on('users')
			      ->onDelete('cascade');

			$table->unique(array('attribute_id', 'user_id'));

			$table->integer('value_int')->nullable();
			$table->double('value_double')->nullable();
			$table->string('value_string', 512)->nullable();
		});

		Schema::create('attribute_transect', function(Blueprint $table) {
			$table->integer('attribute_id')->unsigned();
			$table->foreign('attribute_id')
			      ->references('id')
			      ->on('attributes')
			      // don't delete attributes in use
			      ->onDelete('restrict');

			$table->integer('transect_id')->unsigned();
			$table->foreign('transect_id')
			      ->references('id')
			      ->on('transects')
			      ->onDelete('cascade');

			$table->unique(array('attribute_id', 'transect_id'));

			$table->integer('value_int')->nullable();
			$table->double('value_double')->nullable();
			$table->string('value_string', 512)->nullable();
		});

		Schema::create('attribute_image', function(Blueprint $table) {
			$table->integer('attribute_id')->unsigned();
			$table->foreign('attribute_id')
			      ->references('id')
			      ->on('attributes')
			      // don't delete attributes in use
			      ->onDelete('restrict');

			$table->integer('image_id')->unsigned();
			$table->foreign('image_id')
			      ->references('id')
			      ->on('images')
			      ->onDelete('cascade');

			$table->unique(array('attribute_id', 'image_id'));

			$table->integer('value_int')->nullable();
			$table->double('value_double')->nullable();
			$table->string('value_string', 512)->nullable();
		});

		Schema::create('attribute_label', function(Blueprint $table) {
			$table->integer('attribute_id')->unsigned();
			$table->foreign('attribute_id')
			      ->references('id')
			      ->on('attributes')
			      // don't delete attributes in use
			      ->onDelete('restrict');

			$table->integer('label_id')->unsigned();
			$table->foreign('label_id')
			      ->references('id')
			      ->on('labels')
			      ->onDelete('cascade');

			$table->unique(array('attribute_id', 'label_id'));

			$table->integer('value_int')->nullable();
			$table->double('value_double')->nullable();
			$table->string('value_string', 512)->nullable();
		});

		Schema::create('annotation_attribute', function(Blueprint $table) {
			$table->integer('attribute_id')->unsigned();
			$table->foreign('attribute_id')
			      ->references('id')
			      ->on('attributes')
			      // don't delete attributes in use
			      ->onDelete('restrict');

			$table->integer('annotation_id')->unsigned();
			$table->foreign('annotation_id')
			      ->references('id')
			      ->on('annotations')
			      ->onDelete('cascade');

			$table->unique(array('attribute_id', 'annotation_id'));

			$table->integer('value_int')->nullable();
			$table->double('value_double')->nullable();
			$table->string('value_string', 512)->nullable();
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('attribute_project');
		Schema::drop('attribute_user');
		Schema::drop('attribute_transect');
		Schema::drop('attribute_image');
		Schema::drop('attribute_label');
		Schema::drop('annotation_attribute');

		Schema::drop('attributes');
	}

}
