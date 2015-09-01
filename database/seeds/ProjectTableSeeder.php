<?php

use Illuminate\Database\Seeder;
use Dias\Project;
use Dias\Role;

class ProjectTableSeeder extends Seeder
{
    public function run()
    {
        DB::table('projects')->delete();
        DB::table('project_user')->delete();
        DB::table('project_transect')->delete();

        $project = Project::create([
            'name'        => 'Test Project',
            'description' => 'This is a test project.',
            'creator_id'  => 1,
        ]);

        // creator is already user
        $project->addUserId(2, Role::$editor->id);
        $project->transects()->attach(1);

        $project = Project::create([
            'name'        => 'Test Project 2',
            'description' => 'This is another test project.',
            'creator_id'  => 1,
        ]);
    }
}
