<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;

class Initialize extends Migration {

	/**
	 * Run the migrations.
	 *
	 * MIND THE ORDERING BECAUSE OF FOREIGN KEY RELATIONS
	 *
	 * @return void
	 */
	public function up()
	{
		/*
		| The user. Each user belongs to one or many projects and has one role
		| for each project. A user can be creator of different objects
		| (transects, projects, ...).
		*/
		Schema::create('users', function(Blueprint $table) {
			$table->increments('id');
			$table->string('firstname', 128);
			$table->string('lastname', 128);
			// hashing uses bcrypt so the password is always 60 chars long
			$table->string('password', 60);
			// users are primarily searched by email, so do index
			$table->string('email', 256)->index();
			// token for the "stay logged in" session
			$table->rememberToken();
			$table->timestamps();
			$table->timestamp('login_at')->nullable();

			// email is used for login and thus unique
			$table->unique('email');
		});

		/*
		| The roles users can have. For example a user can be 'admin' in one
		| project and 'guest' un another. Roles are not restricted to projects.
		*/
		Schema::create('roles', function(Blueprint $table) {
			$table->increments('id');
			// roles are primarily searched by name, so do index
			$table->string('name', 128)->index();

			// each role should be unique
			$table->unique('name');

			// NO timestamps
		});

		// seed table with required rows
		DB::table('roles')->insert(array(
			array('name' => 'admin'),
			array('name' => 'editor'),
			array('name' => 'guest'),
		));

		/*
		| Users and transects are grouped into projects.
		*/
		Schema::create('projects', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 512);
			$table->text('description');

			// creator of the project
			$table->integer('creator_id')->unsigned()->nullable();
			$table->foreign('creator_id')
			      ->references('id')
			      ->on('users')
			      // if the creator is deleted, the project should still exist
			      ->onDelete('set null');

			$table->timestamps();
		});

		/*
		| Users can participate in multiple projects and have one specific role
		| in each project.
		*/
		Schema::create('project_user', function(Blueprint $table) {
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

			$table->integer('project_id')->unsigned();
			$table->foreign('project_id')
			      ->references('id')
			      ->on('projects')
			      ->onDelete('cascade');

			// users shouldn't have multiple roles in the same project
			$table->unique(array('role_id', 'user_id', 'project_id'));
		});

		/*
		| Media type of a transect. E.g. time-series of a stationary camera or
		| images from different locations of a moving camera.
		*/
		Schema::create('media_types', function(Blueprint $table) {
			$table->increments('id');
			// media types are primarily searched by name, so do index
			$table->string('name', 512)->index();

			// each type should exist only once
			$table->unique('name');

			// NO timestamps
		});

		// seed table with required rows
		DB::table('media_types')->insert(array(
			array('name' => 'time-series'),
			array('name' => 'location-series'),
		));

		/*
		| A transect is a series of images. Each transect belongs to one or more
		| projects.
		|
		| A transect may reference to a remote location where the images are
		| stored. This may be a remote server or even a directory other than
		| the default data directory on the same machine (e.g. another volume).
		|
		| If the transect references to a remote location, only the image
		| thumbnails are stored locally; the original images are loaded from 
		| remote.
		*/
		Schema::create('transects', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 512);

			// which kind of data is stored in this transect?
			$table->integer('media_type_id')->unsigned();
			$table->foreign('media_type_id')
			      ->references('id')
			      ->on('media_types')
			      // media types in use shouldn't be deleted
			      ->onDelete('restrict');

			// the creator of the transect
			$table->integer('creator_id')->unsigned()->nullable();
			$table->foreign('creator_id')
			      ->references('id')
			      ->on('users')
			      // the transect should still exist if the creator was deleted
			      ->onDelete('set null');

			$table->timestamps();

			// stores external URL (e.g. http: or file:) if the images of the
			// transect are not stored in the default path
			$table->string('url', 256)->nullable();
		});

		/*
		| Transects belong to one or many projects.
		*/
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

			// each transect may belong to each project only once
			$table->unique(array('transect_id', 'project_id'));
		});

		/*
		| Transects consist of multiple images. Each image belongs to a single
		| transect.
		*/
		Schema::create('images', function(Blueprint $table) {
			$table->increments('id');
			// if the transect references to a remote location, the images may
			// have non-standard filenames
			$table->string('filename', 512);

			// images are primarily searched by transect, so do index
			$table->integer('transect_id')->unsigned()->index();
			$table->foreign('transect_id')
			      ->references('id')
			      ->on('transects')
			      // delete all images belonging to a deleted transect
			      ->onDelete('cascade');

			// filename must be unique for each transect
			$table->unique(array('filename', 'transect_id'));

			// NO timestamps (same as transect)
		});

		/*
		| An annotation can have multiple labels. Each label is set by a user.
		| Each label may have a 'parent' so labels can be ordered in a tree-like
		| structure.
		*/
		Schema::create('labels', function(Blueprint $table) {
			$table->increments('id');
			// labels are primarily searched by name, so do index
			$table->string('name', 512)->index();

			// parent label. if the parent is deleted, ask the user if all
			// children should be deleted as well
			$table->integer('parent_id')->unsigned()->nullable();
			$table->foreign('parent_id')
			      ->references('id')
			      ->on('labels')
			      // ask user if all children should be deleted!
			      ->onDelete('set null');

			// id for the World Register of Marine Species (WoRMS)
			$table->integer('aphia_id')->nullable();

			// NO timestamps
		});

		// seed table with required rows
		DB::table('labels')->insert(array(
			array('name' => 'Benthic Object', 'parent_id' => null),
			array('name' => 'Coral', 'parent_id' => 1),
		));

		/*
		| An annotation can be of a certain shape, e.g. circle, line, polygon.
		*/
		Schema::create('shapes', function(Blueprint $table) {
			$table->increments('id');
			$table->string('name', 256);

			// NO timestamps
		});

		// seed table with required rows
		DB::table('shapes')->insert(array(
			array('name' => 'point'),
			array('name' => 'line'),
			array('name' => 'rectangle'),
			array('name' => 'polygon'),
			array('name' => 'circle'),
		));

		/*
		| Annotations mark regions or distances on an image. These annotations
		| then can be labeled with multiple labels describing what the annotation
		| (probably) shows.
		*/
		Schema::create('annotations', function(Blueprint $table) {
			$table->increments('id');

			// annotations are primarily searched by image, so do index
			$table->integer('image_id')->unsigned()->index();
			$table->foreign('image_id')
			      ->references('id')
			      ->on('images')
			      // delete all annotations of a deleted image
			      ->onDelete('cascade');

			$table->integer('shape_id')->unsigned();
			$table->foreign('shape_id')
			      ->references('id')
			      ->on('shapes')
			      // don't delete shapes that are used
			      ->onDelete('restrict');

			$table->timestamps();
		});

		/*
		| Each annotation consists of one or multiple points (e.g. two points of
		| a line). Each point belongs to a single annotation.
		*/
		Schema::create('annotation_points', function(Blueprint $table) {
			$table->increments('id');

			// points are primarily searched by annotation, so do index
			$table->integer('annotation_id')->unsigned()->index();
			$table->foreign('annotation_id')
			      ->references('id')
			      ->on('annotations')
			      // delete all points of a deleted annotation
			      ->onDelete('cascade');

			// for e.g. polygons the ordering of the points is essential, so the
			// polygon can be correctly reconstructed
			$table->integer('index')->index();

			// point index must be unique for each annotation
			$table->unique(array('annotation_id', 'index'));

			$table->integer('x');
			$table->integer('y');

			// NO timestamps
		});

		/*
		| Each annotation may get labels by the users. Each user may set multiple
		| labels to the same annotation e.g. with different levels of confidence
		| ("i'm not sure, it may be 90% this type or 10% the other").
		*/
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
			      // don't delete labels in use
			      ->onDelete('restrict');

			$table->integer('user_id')->unsigned()->nullable();
			$table->foreign('user_id')
			      ->references('id')
			      ->on('users')
			      // don't delete labels if the creator is deleted
			      ->onDelete('set null');

			$table->double('confidence');

			// each user may set the same label only once for each annotation
			$table->unique(array('annotation_id', 'label_id', 'user_id'));
		});
	}

	/**
	 * Reverse the migrations.
	 *
	 * MIND THE ORDERING BECAUSE OF FOREIGN KEY RELATIONS
	 *
	 * @return void
	 */
	public function down()
	{
		Schema::drop('annotation_label');
		Schema::drop('annotation_points');
		Schema::drop('annotations');
		Schema::drop('shapes');
		Schema::drop('labels');
		Schema::drop('images');
		Schema::drop('project_transect');
		Schema::drop('transects');
		Schema::drop('media_types');
		Schema::drop('project_user');
		Schema::drop('projects');
		Schema::drop('roles');
		Schema::drop('users');
	}

}
