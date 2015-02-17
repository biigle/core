<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Cache;

/**
 * A role of a user. Users have one global role and can have many project-
 * specific roles.
 */
class Role extends Model {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * The admin role.
	 * 
	 * @return Role
	 */
	public static function admin()
	{
		return Cache::rememberForever('role-admin', function()
		{
			return Role::whereName('admin')->first();
		});
	}

	/**
	 * The admin role ID.
	 * 
	 * @return int
	 */
	public static function adminId()
	{
		return self::admin()->id;
	}

	/**
	 * The editor role.
	 * 
	 * @return Role
	 */
	public static function editor()
	{
		return Cache::rememberForever('role-editor', function()
		{
			return Role::whereName('editor')->first();
		});
	}

	/**
	 * The editor role ID.
	 * 
	 * @return int
	 */
	public static function editorId()
	{
		return self::editor()->id;
	}

	/**
	 * The guest role.
	 * 
	 * @return Role
	 */
	public static function guest()
	{
		return Cache::rememberForever('role-guest', function()
		{
			return Role::whereName('guest')->first();
		});
	}

	/**
	 * The guest role ID.
	 * 
	 * @return int
	 */
	public static function guestId()
	{
		return self::guest()->id;
	}

}
