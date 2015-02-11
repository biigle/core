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
	 */
	public static $authRules = array(
		'email'    => 'required|email|max:255',
		'password' => 'required|min:8'
	);

	/**
	 * validation rules for resetting the password
	 */
	public static $resetRules = array(
		'email'    => 'required|email|max:255',
		'password' => 'required|confirmed|min:8',
		'token' => 'required',
	);

	/**
	 * validation rules for registering a new user
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
		'login_at'
	);

	/**
	 * Generates a random string to use as an API key. The key will be stored in
	 * the api_key attribute of the user.
	 * @return string
	 */
	public function generateAPIKey()
	{
		$key = str_random(32);
		$this->api_key = $key;
		$this->save();
		return $key;
	}

	public function projects()
	{
		return $this->belongsToMany('Dias\Project');
	}

	/**
	 * All projects created by this user.
	 */
	public function createdProjects()
	{
		return $this->hasMany('Dias\Project', 'creator_id');
	}

	/**
	 * Determines if this user has the given role in the given project.
	 * @param Dias\Role $role
	 * @param Dias\Project $project
	 * @return boolean
	 */
	public function hasRoleInProject(Role $role, Project $project)
	{
		return 1 === $this->projects()
			->whereId($project->id)
			->whereRoleId($role->id)
			->count();
	}

	/**
	 * All annotations labeled by this user.
	 */
	public function annotations()
	{
		return $this->belongsToMany('Dias\Annotation', 'annotation_label')
			->distinct();
	}

}
