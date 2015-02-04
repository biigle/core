<?php

class Role extends Eloquent {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * Searches for a role object by the role name.
	 *
	 * @return Role object or null if there is no role with this name.
	 */
	public static function byName($name)
	{
		return Role::where('name', $name)->first();
	}

	/**
	 * Searches for a role object by the role name and creates a new role
	 * if it doesn't exist.
	 *
	 * @return Role object.
	 */
	public static function byNameOrNew($name)
	{
		$role = Role::byName($name);
		if ($role === null)
		{
			$role = new Role;
			$role->name = $name;
			$role->save();
		}
		return $role;
	}

	public function projectUsers()
	{
		return $this->hasMany('User', 'project_user');
	}

}
