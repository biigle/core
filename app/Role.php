<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;

class Role extends Model {

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

	public function projectUsers()
	{
		return $this->hasMany('Dias\User', 'project_user');
	}

}
