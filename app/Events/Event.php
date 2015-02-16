<?php namespace Dias\Events;

use Carbon\Carbon;

/**
 * The generic event object.
 */
abstract class Event {

	/**
	 * The time, the event was generated.
	 * @var Carbon\Carbon
	 */
	public $time;

	public function __construct()
	{
		$this->time = new Carbon;
	}

}
