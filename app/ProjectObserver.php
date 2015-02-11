<?php namespace Dias;

use Exception;

class ProjectObserver {

	/**
	 * A project must not be created without having a creator.
	 * @param Dias\Project $project
	 * @return boolean
	 */
	public function creating($project)
	{
		if ($project->creator === null)
		{
			throw new Exception("Project creator must not be null when creating a new project.");
		}

		return true;
	}

	/**
	 * When a project is newly created, the creator will automatically
	 * become an admin of it.
	 * @param Dias\Project $project
	 */
	public function created($project)
	{
		// this must be done *after* the project is savet so it already has an id
		$project->users()->attach(
			$project->creator->id,
			array('role_id' => Role::adminId())
		);
	}

}
