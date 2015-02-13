<?php namespace Dias\Contracts;

interface BelongsToProject {

	/**
	 * Returns an array of project IDs this model (indirectly) belongs to.
	 * @return array
	 */
	public function projectIds();

}

