<?php

use Illuminate\Database\Seeder;
use Dias\Project;

class ProjectTableSeeder extends Seeder {

	public function run()
	{
		DB::table('projects')->delete();
		DB::table('project_user')->delete();

		$project = Project::create(array(
			'name'        => 'Test Project',
			'description' => 'This is a test project.',
			'creator_id'  => 1
		));

		// creator is already user
		$project->users()->attach(2, array('role_id' => 2));
	}

}