<?php namespace Dias;

class Project extends Attributable {

	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected $hidden = array(
		'pivot',
		'creator_id',
		// these attributes were displayed in a single project as json
		'role_id',
		'user_id',
		'project_id',
	);

	public function users()
	{
		return $this->belongsToMany('Dias\User');
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

	public function usersWithRole($roleName)
	{
		$role = Role::byName($roleName);

		return $this->users()->where('role_id', $role->id);
	}

	public function transects()
	{
		return $this->belongsToMany('Dias\Transect');
	}
}
