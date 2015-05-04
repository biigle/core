<?php namespace Dias\Http\Controllers\Api;

use Dias\Image;
use InterventionImage;

class ImageController extends Controller {

	/**
	 * Shows the specified image.
	 * 
	 * @api {get} images/:id Get image information
	 * @apiGroup Images
	 * @apiName ShowImages
	 * @apiPermission projectMember
	 * 
	 * @apiParam {Number} id The image ID.
	 * @apiSuccessExample {json} Success response:
	 * {
	 *    "id": 1,
	 *    "transect_id": 1
	 * }
	 *
	 * @param int $id image id
	 * @return Image
	 */
	public function show($id)
	{
		$image = $this->requireNotNull(Image::find($id));
		$this->requireCanSee($image);

		return $image;
	}

	/**
	 * Shows the specified image thumbnail file.
	 * 
	 * @api {get} images/:id/thumb Get a thumbnail image
	 * @apiGroup Images
	 * @apiName ShowImageThumbs
	 * @apiPermission projectMember
	 * @apiDescription Responds with a JPG image thumbnail.
	 * 
	 * @apiParam {Number} id The image ID.
	 *
	 * @param int $id image id
	 * @return \Illuminate\Http\Response
	 */
	public function showThumb($id)
	{
		$image = $this->requireNotNull(Image::find($id));
		$this->requireCanSee($image);

		return $image->getThumb()->response('jpg');
	}

	/**
	 * Shows the specified image file.
	 * 
	 * @api {get} images/:id/file Get an original image
	 * @apiGroup Images
	 * @apiName ShowImageFiles
	 * @apiPermission projectMember
	 * @apiDescription Responds with a JPG image of the original file.
	 * 
	 * @apiParam {Number} id The image ID.
	 *
	 * @param int $id image id
	 * @return \Illuminate\Http\Response
	 */
	public function showFile($id)
	{
		$image = $this->requireNotNull(Image::find($id));
		$this->requireCanSee($image);

		return $image->getFile()->response('jpg');
	}
}
