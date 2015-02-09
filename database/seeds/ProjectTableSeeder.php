<?php

use Illuminate\Database\Seeder;
use Dias\Project;

class ProjectTableSeeder extends Seeder {

	public function run()
	{
		DB::table('projects')->delete();
		DB::table('project_user')->delete();
		DB::table('project_transect')->delete();

		$project = Project::create(array(
			'name'        => 'Test Project',
			'description' => 'This is a test project.',
			'creator_id'  => 1
		));

		// creator is already user
		$project->users()->attach(2, array('role_id' => 2));
		$project->transects()->attach(1);

		$project = Project::create(array(
			'name'        => 'Test Project 2',
			'description' => 'This is another test project.',
			'creator_id'  => 1
		));
	}

}