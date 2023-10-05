<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;

class Initialize extends Migration
{
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
        | Types of visibility that different models can have. E.g. a label
        | tree may be "public" or "private".
        */
        Schema::create('visibilities', function (Blueprint $table) {
            $table->increments('id');
            // visibilities are primarily searched by name, so do index
            $table->string('name', 128)->index();

            // each visibility type should be unique
            $table->unique('name');

            // NO timestamps
        });

        /*
        | The roles users can have. For example a user can be 'admin' in one
        | project and 'guest' un another. Roles are not restricted to projects,
        | so a user can have a 'global' role, too.
        */
        Schema::create('roles', function (Blueprint $table) {
            $table->increments('id');
            // roles are primarily searched by name, so do index
            $table->string('name', 128)->index();

            // each role should be unique
            $table->unique('name');

            // NO timestamps
        });

        /*
        | The user. Each user belongs to one or many projects and has one role
        | for each project. A user can be creator of different objects
        | (transects, projects, ...).
        */
        Schema::create('users', function (Blueprint $table) {
            $table->increments('id');
            $table->string('firstname', 128);
            $table->string('lastname', 128);
            // hashing uses bcrypt so the password is always 60 chars long
            $table->string('password', 60);
            // users are primarily searched by email, so do index
            $table->string('email', 256)->index();
            // the global user role
            $table->integer('role_id')->unsigned();

            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                  // dont delete role if it is in use
                ->onDelete('restrict');

            // token for the "stay logged in" session
            $table->rememberToken();
            $table->timestamps();
            $table->timestamp('login_at')->nullable();

            // email and key are used for authentication and must be unique
            $table->unique('email');
        });

        /*
         | Users are allowed to create multiple API tokens. These tokens act just like
         | passwords. Each token is intended to be used with only one external
         | application, so users are able to disallow connections for each individual
         | external application by deleting individual tokens. Previously there was only
         | one token which would have affected *all* connected applications if deleted.
         */
        Schema::create('api_tokens', function (Blueprint $table) {
            $table->increments('id');
            $table->timestamps();

            // the user, this token belongs to
            $table->integer('owner_id')->unsigned();
            $table->foreign('owner_id')
                ->references('id')
                ->on('users')
                  // delete tokens of a user if they are deleted
                ->onDelete('cascade');

            $table->string('purpose');
            // hashing uses bcrypt so the token hash is always 60 chars long
            $table->string('hash', 60);
        });

        /*
        | Labels belong to label trees. Each user is able to create label trees.
        | Projects can choose which trees they want to use.
        | Trees can be public or private.
        | Private trees maintain a list of projects that are allowed to use the tree.
        | Tree admins can edit this list.
        | Public trees may be used by all projects.
        | There may be "global" trees without members which are maintained by the global
        | admins of the Biigle instance.
        */
        Schema::create('label_trees', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 256);
            $table->text('description')->nullable();

            $table->integer('visibility_id')->unsigned();
            $table->foreign('visibility_id')
                ->references('id')
                ->on('visibilities')
                  // don't delete a visibility that is in use
                ->onDelete('restrict');

            $table->timestamps();
        });

        /*
        | Trees have admins and editors. The tree creator automatically becomes admin.
        | Editors can add and remove labels from the tree. Admins additionally can
        | add/modify/remove tree members and set the tree visibility.
        */
        Schema::create('label_tree_user', function (Blueprint $table) {
            $table->integer('label_tree_id')->unsigned();
            $table->foreign('label_tree_id')
                ->references('id')
                ->on('label_trees')
                  // remove the member assignment if the label tree is deleted
                ->onDelete('cascade');

            $table->integer('user_id')->unsigned();
            $table->foreign('user_id')
                ->references('id')
                ->on('users')
                  // remove the member if the user is deleted
                ->onDelete('cascade');

            $table->integer('role_id')->unsigned();
            $table->foreign('role_id')
                ->references('id')
                ->on('roles')
                  // dont delete role if it is in use
                ->onDelete('restrict');

            // each user must not be added twice as a label tree member
            $table->unique(['label_tree_id', 'user_id']);
        });

        /*
        | Users and transects are grouped into projects.
        */
        Schema::create('projects', function (Blueprint $table) {
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
        | Projects can choose which (public) label trees they want to use.
        | Private label trees can only be used if the project was authorized by
        | the label tree admins.
        */
        Schema::create('label_tree_project', function (Blueprint $table) {
            $table->integer('label_tree_id')->unsigned();
            $table->foreign('label_tree_id')
                ->references('id')
                ->on('label_trees')
                  // delete the label tree from the project if the tree is deleted
                ->onDelete('cascade');

            $table->integer('project_id')->unsigned();
            $table->foreign('project_id')
                ->references('id')
                ->on('projects')
                  // delete the reference to the label tree if the project was deleted
                ->onDelete('cascade');

            // each project may "use" each label tree only once
            $table->unique(['label_tree_id', 'project_id']);
        });

        /*
        | This table specifies which projects are allowed (authorized) to use a private
        | label tree.
        */
        Schema::create('label_tree_authorized_project', function (Blueprint $table) {
            $table->integer('label_tree_id')->unsigned();
            $table->foreign('label_tree_id')
                ->references('id')
                ->on('label_trees')
                  // delete the authorization if the tree is deleted
                ->onDelete('cascade');

            $table->integer('project_id')->unsigned();
            $table->foreign('project_id')
                ->references('id')
                ->on('projects')
                  // delete the reference to the label tree if the project was deleted
                ->onDelete('cascade');

            // each project may be authorized only once
            $table->unique(['label_tree_id', 'project_id']);
        });

        /*
        | Users can participate in multiple projects and have one specific role
        | in each project.
        */
        Schema::create('project_user', function (Blueprint $table) {
            $table->integer('project_role_id')->unsigned();
            $table->foreign('project_role_id')
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

            // users should only have one role per project since roles
            // are hierarchical
            $table->unique(['user_id', 'project_id']);
        });

        /*
        | Media type of a transect. E.g. time-series of a stationary camera or
        | images from different locations of a moving camera.
        */
        Schema::create('media_types', function (Blueprint $table) {
            $table->increments('id');
            // media types are primarily searched by name, so do index
            $table->string('name', 512)->index();

            // each type should exist only once
            $table->unique('name');

            // NO timestamps
        });

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
        Schema::create('transects', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 512);

            // don't call it "attributes" because Eloquent models already have an
            // "attributes" variable!
            $table->json('attrs')->nullable();

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

            // stores URL (e.g. http:// or file://) where the original image files
            // are stored
            $table->string('url', 256);
        });

        /*
        | Transects belong to one or many projects.
        */
        Schema::create('project_transect', function (Blueprint $table) {
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
            $table->unique(['transect_id', 'project_id']);
        });

        /*
        | Transects consist of multiple images. Each image belongs to a single
        | transect.
        */
        Schema::create('images', function (Blueprint $table) {
            $table->increments('id');
            // if the transect references to a remote location, the images may
            // have non-standard filenames
            $table->string('filename', 512);

            // images are primarily searched by transect, so do index
            $table->integer('transect_id')->unsigned()->index();
            $table->foreign('transect_id')
                ->references('id')
                ->on('transects')
                ->onDelete('cascade');

            // filename must be unique for each transect
            $table->unique(['filename', 'transect_id']);

            // NO timestamps (same as transect)
        });

        /*
        | An annotation can have multiple labels. Each label is set by a user.
        | Each label may have a 'parent' so labels can be ordered in a tree-like
        | structure.
        */
        Schema::create('labels', function (Blueprint $table) {
            $table->increments('id');
            // labels are primarily searched by name, so do index
            $table->string('name', 512)->index();

            $table->string('color', 6)->default('0099ff');

            // parent label. if the parent is deleted, ask the user if all
            // children should be deleted as well
            $table->integer('parent_id')->unsigned()->nullable();
            $table->foreign('parent_id')
                ->references('id')
                ->on('labels')
                ->onDelete('cascade');

            // id for the World Register of Marine Species (WoRMS)
            $table->integer('aphia_id')->nullable();

            $table->integer('label_tree_id')->unsigned()->nullable();
            $table->foreign('label_tree_id')
                ->references('id')
                ->on('label_trees')
                  // delete labels of a tree if the tree is deleted
                ->onDelete('cascade');

            // NO timestamps
        });

        /*
        | Table of pivot objects for image labels. Each image can get a label attached to
        | similar to annotations. But where annotations can get the same label attached
        | multiple times by different users, images can have the same label attached only
        | once.
        | If a user is deleted, their image labels should persist.
        */
        Schema::create('image_labels', function (Blueprint $table) {
            $table->increments('id');

            $table->integer('image_id')->unsigned();
            $table->foreign('image_id')
                ->references('id')
                ->on('images')
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

            $table->timestamps();

            // each image may have the same label attached only once
            $table->unique(['image_id', 'label_id']);
        });

        /*
        | An annotation can be of a certain shape, e.g. circle, line, polygon.
        */
        Schema::create('shapes', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 256);

            // NO timestamps
        });

        /*
        | Annotations mark regions or distances on an image. These annotations
        | then can be labeled with multiple labels describing what the annotation
        | (probably) shows.
        */
        Schema::create('annotations', function (Blueprint $table) {
            $table->increments('id');
            // json type cant have a default value so it must be nullable
            $table->json('points')->nullable();

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
        | Each annotation may get labels by the users. Each user may set multiple
        | labels to the same annotation e.g. with different levels of confidence
        | ("i'm not sure, it may be 90% this type or 10% the other").
        |
        | This was once just a pivot table but is now a table for pivot objects
        | for better handling of annotation labels.
        */
        Schema::create('annotation_labels', function (Blueprint $table) {
            $table->increments('id');

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

            $table->float('confidence');

            $table->timestamps();

            // each user may set the same label only once for each annotation
            $table->unique(['annotation_id', 'label_id', 'user_id']);
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
        Schema::drop('annotation_labels');
        Schema::drop('annotations');
        Schema::drop('shapes');
        Schema::drop('image_labels');
        Schema::drop('labels');
        Schema::drop('images');
        Schema::drop('project_transect');
        Schema::drop('transects');
        Schema::drop('media_types');
        Schema::drop('project_user');
        Schema::drop('label_tree_authorized_project');
        Schema::drop('label_tree_project');
        Schema::drop('projects');
        Schema::drop('label_tree_user');
        Schema::drop('label_trees');
        Schema::drop('api_tokens');
        Schema::drop('users');
        Schema::drop('roles');
        Schema::drop('visibilities');
    }
}
