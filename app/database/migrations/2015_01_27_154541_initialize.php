<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class Initialize extends Migration {

	/**
	 * Run the migrations.
	 *
	 * @return void
	 */
	public function up()
	{
		Schema::create('users', function(Blueprint $table) {
			$table->increments('id');
			$table->string('firstname', 128);
			$table->string('lastname', 128);
			$table->string('password', 60);
			$table->string('email', 256);
			$table->rememberToken();
			$table->timestamps();
			$table->timestamp('login_at')->nullable();

			$table->unique('email');
		});

		Schema::create('roles', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 128);
		});

		Schema::create('role_user', function(Blueprint $table) {
			$table->integer('role_id')->unsigned();
			$table->foreign('role_id')
			      ->references('id')
			      ->on('roles')
			      // dont delete role if it is in use
			      ->onDelete('restrict');

			$table->integer('user_id')->unsigned();
			$table->foreign('user_id')
			      ->references('id')
			      ->on('users')
			      ->onDelete('cascade');

			$table->unique(array('role_id', 'user_id'));
		});

		Schema::create('media_types', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 512);
		});

		Schema::create('projects', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 512);
			$table->text('description');

			// creator
			$table->integer('user_id')->unsigned()->nullable();
			$table->foreign('user_id')
			      ->references('id')
			      ->on('users')
			      ->onDelete('set null');

			$table->timestamps();
		});

		Schema::create('project_admin_user', function(Blueprint $table) {
			$table->integer('user_id')->unsigned();
			$table->foreign('user_id')
			      ->references('id')
			      ->on('users')
			      ->onDelete('cascade');

			$table->integer('project_id')->unsigned();
			$table->foreign('project_id')
			      ->references('id')
			      ->on('projects')
			      ->onDelete('cascade');

			$table->unique(array('user_id', 'project_id'));
		});

		Schema::create('project_editor_user', function(Blueprint $table) {
			$table->integer('user_id')->unsigned();
			$table->foreign('user_id')
			      ->references('id')
			      ->on('users')
			      ->onDelete('cascade');

			$table->integer('project_id')->unsigned();
			$table->foreign('project_id')
			      ->references('id')
			      ->on('projects')
			      ->onDelete('cascade');

			$table->unique(array('user_id', 'project_id'));
		});

		Schema::create('project_guest_user', function(Blueprint $table) {
			$table->integer('user_id')->unsigned();
			$table->foreign('user_id')
			      ->references('id')
			      ->on('users')
			      ->onDelete('cascade');

			$table->integer('project_id')->unsigned();
			$table->foreign('project_id')
			      ->references('id')
			      ->on('projects')
			      ->onDelete('cascade');

			$table->unique(array('user_id', 'project_id'));
		});

		Schema::create('labels', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 512);

			$table->integer('parent_id')->unsigned()->nullable();
			$table->foreign('parent_id')
			      ->references('id')
			      ->on('labels')
			      ->onDelete('cascade');

			$table->integer('aphia_id')->nullable();

			// TODO what is this for???
			$table->integer('project_id')->nullable();
		});

		Schema::create('attributes', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 512);

			// TODO what is this for? make a new table attribute_type?
			$table->integer('type');
		});

		Schema::create('transects', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 512);

			$table->integer('media_type_id')->unsigned();
			$table->foreign('media_type_id')
			      ->references('id')
			      ->on('media_types')
			      // media types in use shouldnt be deleted
			      ->onDelete('restrict');

			$table->integer('user_id')->unsigned()->nullable();
			$table->foreign('user_id')
			      ->references('id')
			      ->on('users')
			      ->onDelete('set null');

			$table->timestamps();

			$table->string('image_path', 512);
			$table->string('url', 256)->nullable();
		});

		Schema::create('project_transect', function(Blueprint $table) {
			$table->integer('transect_id')->unsigned();
			$table->foreign('transect_id')
			      ->references('id')
			      ->on('transects')
			      ->onDelete('cascade');

			$table->integer('project_id')->unsigned();
			$table->foreign('project_id')
			      ->references('id')
			      ->on('projects')
			      // projects with transects shouldn't be deleted
			      ->onDelete('restrict');

			$table->unique(array('transect_id', 'project_id'));
		});

		Schema::create('images', function(Blueprint $table) {
			$table->increments('id');
			$table->string('filename', 512);

			$table->integer('transect_id')->unsigned();
			$table->foreign('transect_id')
			      ->references('id')
			      ->on('transects')
			      // delete all images belonging to a deleted transect
			      ->onDelete('cascade');

			$table->string('hash', 32)->default('');
		});

		Schema::create('annotation_shapes', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 256);
		});

		Schema::create('annotations', function(Blueprint $table) {
			$table->increments('id');

			$table->integer('image_id')->unsigned();
			$table->foreign('image_id')
			      ->references('id')
			      ->on('images')
			      // delete all annotations of a deleted image
			      ->onDelete('cascade');

			$table->integer('annotation_shape_id')->unsigned();
			$table->foreign('annotation_shape_id')
			      ->references('id')
			      ->on('annotation_shapes')
			      // don't delete shapes in use
			      ->onDelete('restrict');

			$table->timestamps();
		});

		Schema::create('annotation_points', function(Blueprint $table) {
			$table->integer('annotation_id')->unsigned();
			$table->foreign('annotation_id')
			      ->references('id')
			      ->on('annotations')
			      // delete all points of a deleted annotation
			      ->onDelete('cascade');

			$table->integer('point_index');

			$table->unique(array('annotation_id', 'point_index'));

			$table->integer('x');
			$table->integer('y');
		});

		Schema::create('annotation_label', function(Blueprint $table) {
			$table->integer('annotation_id')->unsigned();
			$table->foreign('annotation_id')
			      ->references('id')
			      ->on('annotations')
			      ->onDelete('cascade');

			$table->integer('label_id')->unsigned();
			$table->foreign('label_id')
			      ->references('id')
			      ->on('labels')
			      // TODO cascade??
			      ->onDelete('restrict');

			$table->integer('user_id')->unsigned()->nullable();
			$table->foreign('user_id')
			      ->references('id')
			      ->on('users')
			      ->onDelete('set null');

			$table->double('confidence');
		});

		//TODO INSERT OTHER TABLES HERE

		Schema::create('attribute_project', function(Blueprint $table) {
			$table->integer('attribute_id')->unsigned();
			$table->foreign('attribute_id')
			      ->references('id')
			      ->on('attributes')
			      // TODO restrict?
			      ->onDelete('cascade');

			$table->integer('project_id')->unsigned();
			$table->foreign('project_id')
			      ->references('id')
			      ->on('projects')
			      ->onDelete('cascade');

			// TODO unique?
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
			      ->onDelete('cascade');

			$table->integer('user_id')->unsigned();
			$table->foreign('user_id')
			      ->references('id')
			      ->on('users')
			      ->onDelete('cascade');

			// TODO unique?
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
			      ->onDelete('cascade');

			$table->integer('transect_id')->unsigned();
			$table->foreign('transect_id')
			      ->references('id')
			      ->on('transects')
			      ->onDelete('cascade');

			// TODO unique?
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
			      ->onDelete('cascade');

			$table->integer('image_id')->unsigned();
			$table->foreign('image_id')
			      ->references('id')
			      ->on('images')
			      ->onDelete('cascade');

			// TODO unique?
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
			      ->onDelete('cascade');

			$table->integer('label_id')->unsigned();
			$table->foreign('label_id')
			      ->references('id')
			      ->on('labels')
			      ->onDelete('cascade');

			// TODO unique?
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
			      ->onDelete('cascade');

			$table->integer('annotation_id')->unsigned();
			$table->foreign('annotation_id')
			      ->references('id')
			      ->on('annotations')
			      ->onDelete('cascade');

			// TODO unique?
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

		Schema::drop('annotation_label');
		Schema::drop('annotation_points');
		Schema::drop('annotations');
		Schema::drop('annotation_shapes');
		Schema::drop('images');
		Schema::drop('project_transect');
		Schema::drop('transects');
		Schema::drop('attributes');
		Schema::drop('labels');
		Schema::drop('project_admin_user');
		Schema::drop('project_editor_user');
		Schema::drop('project_guest_user');
		Schema::drop('projects');
		Schema::drop('media_types');
		Schema::drop('role_user');
		Schema::drop('roles');
		Schema::drop('users');
	}

}
