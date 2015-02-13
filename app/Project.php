<?php namespace Dias;

use Illuminate\Database\QueryException;

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
			->withPivot('project_role_id as project_role_id');
	}

	public function admins()
	{
		return $this->users()->whereProjectRoleId(Role::adminId());
	}

	public function editors()
	{
		return $this->users()->whereProjectRoleId(Role::editorId());
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
	 * Checks if the user ID is an editor of this project.
	 * @param int $id
	 * @return boolean
	 */
	public function hasEditorId($id)
	{
		return $this->editors()->find($id) !== null;
	}

	/**
	 * Checks if the user is an editor of this project.
	 * @param Dias\User $user
	 * @return boolean
	 */
	public function hasEditor($user)
	{
		return $this->hasEditorId($user->id);
	}

	/**
	 * Checks if the given user ID exists in this project.
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

	/**
	 * Adds the user with the given role to this project.
	 * @param int $userId
	 * @param int $roleId
	 */
	public function addUserId($userId, $roleId)
	{
		try {
			$this->users()->attach($userId, array('project_role_id' => $roleId));
		} catch (QueryException $e) {
			abort(400, "The user already exists in this project.");
		}
	}

	/**
	 * Changes the role of an existing user in this project.
	 * @param int $userId
	 * @param int $roleId
	 */
	public function changeRole($userId, $roleId)
	{
		if (!$this->hasUserId($userId))
		{
			abort(400, "User doesn't exist in this project.");
		}

		// removeUserId prevents changing the last remaining admin to anything
		// else, too!
		if ($this->removeUserId($userId))
		{
			// only re-attach if detach was successful
			$this->users()->attach($userId, array('project_role_id' => $roleId));
		}
		else
		{
			return abort(500, "The user couldn't be modified.");
		}
	}

	/**
	 * Removes the user by ID from this project.
	 * @param int $userId
	 * @return boolean
	 */
	public function removeUserId($userId)
	{
		$admins = $this->admins();
		// is this an attempt to remove the last remaining admin?
		if ($admins->count() == 1 && $admins->find($userId))
		{
			abort(400, "The last project admin cannot be removed.");
		}
		
		return (boolean) $this->users()->detach($userId);
	}

	public function transects()
	{
		return $this->belongsToMany('Dias\Transect');
	}

	/**
	 * Adds a transect to this project if it wasn't already.
	 * @param int $id
	 */
	public function addTransectId($id)
	{
		try {
			$this->transects()->attach($id);
		} catch (QueryException $e) {
			// transect already exists for this project, so everything is fine
		}
	}

	// TODO if this is the last project, the transect belongs to, the whole
	// transect should be deleted (but with warning!)
	// public function removeTransectId($id)
}
