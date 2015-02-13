<?php namespace Dias\Observers;

use Dias\Role;

class User {

	/**
	 * A user gets the role 'editor' by default.
	 * @param Dias\User $user
	 * @return boolean
	 */
	public function creating($user)
	{
		$user->role()->associate(Role::editor());
		return true;
	}

}
