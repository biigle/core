<?php

namespace Biigle\Modules\Videos\Http\Requests;

use Biigle\Modules\Videos\Video;
use Biigle\Modules\Videos\Rules\VideoUrl;
use Illuminate\Foundation\Http\FormRequest;

class UpdateVideo extends FormRequest
{
    /**
     * The video that should be updated.
     *
     * @var Video
     */
    public $video;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->video = Video::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->video);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'filled|max:512',
            'url' => ['filled', new VideoUrl],
        ];
    }
}
