<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\VideoUrl;
use Biigle\Video;
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
