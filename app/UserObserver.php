<?php namespace Dias;

class UserObserver {

	/**
	 * A user gets the role 'editor' by default.
	 * @param Dias\User $user
	 * @return boolean
	 */
	public function creating($user)
	{
		$user->role()->associate(Role::find(Role::editorId()));
		return true;
	}

}
