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
	 * Returns the admin role ID.
	 * @return Dias\Role
	 */
	public static function adminId()
	{
		return Cache::rememberForever('role-admin', function()
		{
			return Role::whereName('admin')->first()->id;
		});
	}

	/**
	 * Returns the editor role ID.
	 * @return Dias\Role
	 */
	public static function editorId()
	{
		return Cache::rememberForever('role-editor', function()
		{
			return Role::whereName('editor')->first()->id;
		});
	}

	/**
	 * Returns the guest role ID.
	 * @return Dias\Role
	 */
	public static function guestId()
	{
		return Cache::rememberForever('role-guest', function()
		{
			return Role::whereName('guest')->first()->id;
		});
	}

}
