<?php

use Illuminate\Auth\UserTrait;
use Illuminate\Auth\UserInterface;
use Illuminate\Auth\Reminders\RemindableTrait;
use Illuminate\Auth\Reminders\RemindableInterface;

class User extends Eloquent implements UserInterface, RemindableInterface {

	use UserTrait, RemindableTrait;

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

	public static $authRules = array(
		'email'    => 'required|email',
		'password' => 'required|min:8'
	);

	public function projects()
	{
		return $this->belongsToMany('Project')
			->withPivot('role_id');
	}

	public function createdProjects()
	{
		return $this->hasMany('Project');
	}

	public function hasRoleInProject(Role $role, Project $project)
	{
		return 1 === $this->projects()
			->where('id', '=', $project->id)
			->where('role_id', '=', $role->id)->count();
	}

}
