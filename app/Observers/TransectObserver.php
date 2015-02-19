<?php namespace Dias\Observers;

use Exception;

class TransectObserver {

	/**
	 * A transect must not be created without having a creator.
	 * 
	 * @param \Dias\Transect $transect
	 * @return boolean
	 */
	public function creating($transect)
	{
		if ($transect->creator === null)
		{
			throw new Exception("Transect creator must not be null when creating a new transect.");
		}

		return true;
	}
}
