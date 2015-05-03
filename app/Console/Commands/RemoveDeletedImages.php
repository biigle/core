<?php namespace Dias\Console\Commands;

use Illuminate\Console\Command;
use Dias\Image;
use File;

class RemoveDeletedImages extends Command {

	/**
	 * The console command name.
	 *
	 * @var string
	 */
	protected $name = 'remove-deleted-images';

	/**
	 * The console command description.
	 *
	 * @var string
	 */
	protected $description = 'Removes all transect images and their associated files that no longer belong to any transect';

	/**
	 * Removes all images no longer belonging to a transect.
	 * 
	 * These images are marked for deletion by having their `transect_id` 
	 * attribute set to `null`. Like this the images and all their associated
	 * files can be deleted in a regular cron job.
	 * 
	 * @return void
	 */
	public function handle()
	{
		Image::whereNull('transect_id')->chunk(100, function($images) {
			foreach ($images as $image) {
				if (File::exists($image->thumbPath))
				{
					File::delete($image->thumbPath);
				}
				$image->delete();
			}
		});
	}

}
