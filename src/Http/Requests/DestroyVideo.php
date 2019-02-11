<?php

namespace Biigle\Modules\Videos\Http\Requests;

use Biigle\Modules\Videos\Video;
use Illuminate\Foundation\Http\FormRequest;

class DestroyVideo extends FormRequest
{
    /**
     * The video that should be deleted.
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

        return $this->user()->can('destroy', $this->video);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'force' => 'filled|boolean',
        ];
    }

    /**
     * Configure the validator instance.
     *
     * @param  \Illuminate\Validation\Validator  $validator
     * @return void
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            if ($this->video->annotations()->exists() && !$this->input('force')) {
                $validator->errors()->add('id', "Deleting the video would delete annotations. Use the 'force' argument to delete anyway.");
            }
        });
    }
}
