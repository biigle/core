<?php namespace Dias\Observers;

use Dias\Role;

class UserObserver {

	/**
	 * A user gets the global role 'editor' by default.
	 * @param \Dias\User $user
	 * @return boolean
	 */
	public function creating($user)
	{
		$user->role()->associate(Role::editor());
		return true;
	}

}
