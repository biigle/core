<?php

class ProjectObserver {

	/**
	 * When a project is newly created, the creator woll automatically
	 * become an admin of it.
	 */
	public function created($project)
	{
		if ($project->creator)
		{
			$project->users()->attach(
				$project->creator->id,
				array('role_id' => Role::byNameOrNew('admin')->id)
			);
		}
	}

}
