<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Migrations\Migration;
use Carbon\Carbon;
use Dias\Visibility;
use Dias\Role;

class CreateLabelTrees extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
       /*
        | Label categories belong to label category trees. Each user is able to create
        | label category trees. Projects can choose which trees they want to use.
        | Trees can be public or private.
        | Private trees maintain a list of projects that are allowed to use the tree.
        | Tree admins can edit this list.
        | Public trees may be used by all projects.
        | There may be "global" trees without members which are maintained by the global
        | admins of the Dias instance.
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

            // each user must not be added twice as a category tree member
            $table->unique(['label_tree_id', 'user_id']);
        });


        /*
         | Labels now belong to category trees instead of projects
         */
        Schema::table('labels', function ($table) {
            $table->integer('label_tree_id')->unsigned()->nullable();
            $table->foreign('label_tree_id')
                  ->references('id')
                  ->on('label_trees')
                  // delete labels of a tree if the tree is deleted
                  ->onDelete('cascade');
        });

       /*
        | Projects can choose which (public) category trees they want to use.
        | Private category trees can only be used if the project was authorized by
        | the category tree admins.
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
         | Migrate the existing labels.
         */

        // Create a global label tree
        $globalId = DB::table('label_trees')->insertGetId([
            'name' => 'Global',
            'description' => 'The global label tree.',
            'created_at' => new Carbon,
            'updated_at' => new Carbon,
            'visibility_id' => Visibility::$public->id,
        ]);

        // assign all labels with project_id null to the global tree
        DB::table('labels')->whereNull('project_id')->update(
            ['label_tree_id' => $globalId]
        );

        foreach (DB::table('projects')->select('id', 'name')->get() as $project) {
            // all projects should use the global tree
            DB::table('label_tree_project')->insert([
                'label_tree_id' => $globalId,
                'project_id' => $project->id,
            ]);

            if (DB::table('labels')->where('project_id', $project->id)->exists()) {

                // If the project has own labels, create a new label tree for the project
                // The tree is private and the project is the only authorized project
                // for the tree.
                $treeId = DB::table('label_trees')->insertGetId([
                    'name' => "{$project->name} labels",
                    'created_at' => new Carbon,
                    'updated_at' => new Carbon,
                    'visibility_id' => Visibility::$private->id,
                ]);

                DB::table('labels')->where('project_id', $project->id)->update(
                    ['label_tree_id' => $treeId]
                );

                DB::table('label_tree_project')->insert([
                    'label_tree_id' => $treeId,
                    'project_id' => $project->id,
                ]);

                DB::table('label_tree_authorized_project')->insert([
                    'label_tree_id' => $treeId,
                    'project_id' => $project->id,
                ]);

                // all project admins become label tree admins
                $admins = DB::table('project_user')
                    ->where('project_id', $project->id)
                    ->where('project_role_id', Role::$admin->id)
                    ->pluck('user_id');

                foreach ($admins as $userId) {
                    DB::table('label_tree_user')->insert([
                        'label_tree_id' => $treeId,
                        'user_id' => $userId,
                        'role_id' => Role::$admin->id,
                    ]);
                }
            }
        }


        /*
         | Finally set label_tree_id to be not nullable (since all IDs must be set now).
         | And finish the migration by removing the project_id.
         */

        Schema::table('labels', function ($table) {
            $table->integer('label_tree_id')
                ->unsigned()
                ->nullable(false)
                ->change();

            $table->dropForeign('labels_project_id_foreign');
            $table->dropColumn('project_id');
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('labels', function ($table) {
            $table->integer('project_id')->unsigned()->nullable();
            $table->foreign('project_id')
                  ->references('id')
                  ->on('projects')
                  // delete project specific labels when the project is deleted
                  ->onDelete('cascade');
        });

        // all trees that have a user are non global trees
        $nonGlobalTrees = DB::table('label_tree_user')
            ->distinct()
            ->pluck('label_tree_id');

        foreach ($nonGlobalTrees as $treeId) {
            // find the first project that uses the tree
            $projectId = DB::table('label_tree_project')
                ->where('label_tree_id', $treeId)
                ->take(1)
                ->pluck('project_id');

            if ($projectId !== null) {
                // assign all labels to the project that uses the tree
                DB::table('labels')->where('label_tree_id', $treeId)->update(
                    ['project_id' => $projectId[0]]
                );
            }
        }

        /*
         | All projects other than the fist one chosen above will loose the connection
         | to the labels. This will work fine if this migration was done just now (since
         | each tree is used by only one project). All global labels or the ones that
         | are not used by any project (but may be used in annotations) are assigned
         | to the (old) global category tree (with project_id null).
         */

        Schema::drop('label_tree_authorized_project');
        Schema::drop('label_tree_project');
        Schema::table('labels', function ($table) {
            $table->dropForeign('labels_label_tree_id_foreign');
            $table->dropColumn('label_tree_id');
        });
        Schema::drop('label_tree_user');
        Schema::drop('label_trees');
    }
}
