<?php namespace Dias\Http\Controllers;

use Illuminate\Contracts\Auth\Guard;

abstract class ApiController extends Controller {

	/**
	 * The authenticator.
	 * 
	 * @var Guard
	 */
	protected $auth;

	/**
	 * Creates a new ApiController instance.
	 * 
	 * @param Guard $auth
	 */
	public function __construct(Guard $auth)
	{
		$this->auth = $auth;
	}

}
