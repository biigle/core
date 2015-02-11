<?php namespace Dias;

class Project extends Attributable {

	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected $hidden = array(
		'pivot',
	);

	public function users()
	{
		return $this->belongsToMany('Dias\User')
			->withPivot('role_id as role_id');
	}

	/**
	 * All users with the given role in this project.
	 * @param string $roleName
	 * @return Illuminate\Database\Eloquent\Relations\BelongsToMany
	 */
	public function usersWithRole($roleName)
	{
		$role = Role::byName($roleName);

		return $this->users()->whereRoleId($role->id);
	}

	/**
	 * Checks if the given user has the given role in this project.
	 * The user doesn't have to exist in this project.
	 * @param Dias\User $user
	 * @param string $roleName
	 * @return boolean
	 */
	public function userHasRole($user, $roleName)
	{
		$role = Role::byName($roleName);
		if ($role === null)
		{
			return false;
		}

		$user = $this->users()
			->whereId($user->id)
			->whereRoleId($role->id)
			->first();

		return $user !== null;
	}

	/**
	 * Checks if the given user exists in this project.
	 * @param Dias\User $user
	 * @return boolean
	 */
	public function hasUser($user)
	{
		return $this->users()->find($user->id) !== null;
	}

	/**
	 * The user that created this project. On creation this user is
	 * automatically added to the project's users with the 'admin' role by
	 * the ProjectObserver.
	 */
	public function creator()
	{
		return $this->belongsTo('Dias\User');
	}

	public function transects()
	{
		return $this->belongsToMany('Dias\Transect');
	}
}
