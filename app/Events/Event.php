<?php namespace Dias\Events;

use Carbon\Carbon;

abstract class Event {

	public $time;

	public function __construct()
	{
		$this->time = new Carbon;
	}

}
