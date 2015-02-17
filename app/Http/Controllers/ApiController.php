<?php namespace Dias\Http\Controllers;

use Illuminate\Contracts\Auth\Guard;

abstract class ApiController extends Controller {

	/**
	 * The authenticator.
	 * 
	 * @var \Illuminate\Contracts\Auth\Guard
	 */
	protected $auth;

	public function __construct(Guard $auth)
	{
		$this->auth = $auth;
	}

}
