<?php namespace Dias;

use Illuminate\Auth\Authenticatable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Auth\Passwords\CanResetPassword;
use Illuminate\Contracts\Auth\Authenticatable as AuthenticatableContract;
use Illuminate\Contracts\Auth\CanResetPassword as CanResetPasswordContract;

class User extends Attributable implements AuthenticatableContract, CanResetPasswordContract {

	use Authenticatable, CanResetPassword;

	public static $authRules = array(
		'email'    => 'required|email',
		'password' => 'required|min:8'
	);

	public static $registerRules = array(
		'email'                 => 'required|email|unique:users',
		'password'              => 'required|min:8|confirmed',
		'password_confirmation' => 'required|min:8',
		'firstname'             => 'required|alpha',
		'lastname'              => 'required|alpha'
	);

	/**
	 * The attributes excluded from the model's JSON form.
	 *
	 * @var array
	 */
	protected $hidden = array(
		'password',
		'remember_token',
		'email',
		'created_at',
		'updated_at',
		'login_at'
	);

	public function projects()
	{
		return $this->belongsToMany('Dias\Project')
			->withPivot('role_id');
	}

	public function createdProjects()
	{
		return $this->hasMany('Dias\Project', 'creator_id');
	}

	public function hasRoleInProject(Role $role, Project $project)
	{
		return 1 === $this->projects()
			->where('id', $project->id)
			->where('role_id', $role->id)->count();
	}

}
