<?php

namespace Biigle\Http\Requests;

use Biigle\AnnotationSession;
use Illuminate\Foundation\Http\FormRequest;

class DestroyAnnotationSession extends FormRequest
{
    /**
     * The annotation session that should be deleted.
     *
     * @var AnnotationSession
     */
    public $annotationSession;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->annotationSession = AnnotationSession::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->annotationSession->volume);
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
}
