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

	public function admins()
	{
		return $this->users()->whereRoleId(Role::adminId());
	}

	/**
	 * Checks if the user ID is an admin of this project.
	 * @param int $id
	 * @return boolean
	 */
	public function hasAdminId($id)
	{
		return $this->admins()->find($id) !== null;
	}

	/**
	 * Checks if the user is an admin of this project.
	 * @param Dias\User $user
	 * @return boolean
	 */
	public function hasAdmin($user)
	{
		return $this->hasAdminId($user->id);
	}

	/**
	 * Checks if the given user Id exists in this project.
	 * @param int $id
	 * @return boolean
	 */
	public function hasUserId($id)
	{
		return $this->users()->find($id) !== null;
	}

	/**
	 * Checks if the given user exists in this project.
	 * @param Dias\User $user
	 * @return boolean
	 */
	public function hasUser($user)
	{
		return $this->hasUserId($user->id);
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

	/**
	 * Sets the creator if it isn't already set.
	 * @param Dias\User $user
	 * @return boolean
	 */
	public function setCreator($user)
	{
		// user must exist and creator mustn't
		if (!$this->creator && $user)
		{
			$this->creator()->associate($user);
			return true;
		}

		return false;
	}

	public function transects()
	{
		return $this->belongsToMany('Dias\Transect');
	}
}
