<?php namespace Dias\Contracts;

/**
 * A model that is (not necessarily directly) related to one or more projects.
 */
interface BelongsToProjectContract {

	/**
	 * Returns an array of project IDs this model (indirectly) belongs to.
	 * @return array
	 */
	public function projectIds();

}

