<?php namespace Dias;

use Illuminate\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;

class User extends Attributable implements AuthenticatableContract, CanResetPasswordContract {

	use Authenticatable, CanResetPassword;

	/**
	 * validation rules for logging in
	 * @var array
	 */
	public static $authRules = array(
		'email'    => 'required|email|max:255',
		'password' => 'required|min:8'
	);

	/**
	 * validation rules for resetting the password
	 * @var array
	 */
	public static $resetRules = array(
		'email'    => 'required|email|max:255',
		'password' => 'required|confirmed|min:8',
		'token'    => 'required',
	);

	/**
	 * validation rules for registering a new user
	 * @var array
	 */
	public static $registerRules = array(
		'email'     => 'required|email|unique:users|max:255',
		'password'  => 'required|min:8|confirmed',
		'firstname' => 'required|alpha|max:127',
		'lastname'  => 'required|alpha|max:127'
	);

	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected $hidden = array(
		'password',
		'remember_token',
		'api_key',
		'email',
		'created_at',
		'updated_at',
		'login_at',
		'pivot'
	);

	/**
	 * Generates a random string to use as an API key. The key will be stored in
	 * the api_key attribute of the user.
	 * @return string
	 */
	public function generateApiKey()
	{
		$key = str_random(32);
		$this->api_key = $key;
		return $key;
	}

	public function projects()
	{
		return $this->belongsToMany('Dias\Project');
	}

	/**
	 * The global role of this user.
	 * @return Dias\Role
	 */
	public function role()
	{
		return $this->belongsTo('Dias\Role');
	}

}
