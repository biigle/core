<?php namespace Dias\Services;

use Dias\User;
use Validator;
use Illuminate\Contracts\Auth\Registrar as RegistrarContract;

class Registrar implements RegistrarContract {

	/**
	 * Get a validator for an incoming registration request.
	 *
	 * @param  array  $data
	 * @return \Illuminate\Contracts\Validation\Validator
	 */
	public function validator(array $data)
	{
		return Validator::make($data, User::$registerRules);
	}

	/**
	 * Create a new user instance after a valid registration.
	 *
	 * @param  array  $data
	 * @return User
	 */
	public function create(array $data)
	{
		$user = new User;
		$user->firstname = $data['firstname'];
		$user->lastname = $data['lastname'];
		$user->email = $data['email'];
		$user->password = bcrypt($data['password']);
		$user->save();
		return $user;
	}

}
