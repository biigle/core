<?php namespace Dias;

use Illuminate\Database\Eloquent\Model;
use Cache;

class Role extends Model {

	/**
	 * Don't maintain timestamps for this model.
	 *
	 * @var boolean
	 */
	public $timestamps = false;

	/**
	 * Returns the admin role.
	 * @return Dias\Role
	 */
	public static function admin()
	{
		return Cache::rememberForever('role-admin', function()
		{
			return Role::whereName('admin')->first();
		});
	}

	/**
	 * Returns the admin role ID.
	 * @return int
	 */
	public static function adminId()
	{
		return self::admin()->id;
	}

	/**
	 * Returns the editor role.
	 * @return Dias\Role
	 */
	public static function editor()
	{
		return Cache::rememberForever('role-editor', function()
		{
			return Role::whereName('editor')->first();
		});
	}

	/**
	 * Returns the editor role ID.
	 * @return int
	 */
	public static function editorId()
	{
		return self::editor()->id;
	}

	/**
	 * Returns the guest role.
	 * @return Dias\Role
	 */
	public static function guest()
	{
		return Cache::rememberForever('role-guest', function()
		{
			return Role::whereName('guest')->first();
		});
	}

	/**
	 * Returns the guest role ID.
	 * @return int
	 */
	public static function guestId()
	{
		return self::guest()->id;
	}

}
