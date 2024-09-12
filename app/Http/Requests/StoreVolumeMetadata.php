<?php

namespace Biigle\Http\Requests;

use Biigle\Rules\ImageMetadata;
use Biigle\Rules\VideoMetadata;
use Biigle\Services\MetadataParsing\ParserFactory;
use Biigle\Volume;
use Illuminate\Foundation\Http\FormRequest;

class StoreVolumeMetadata extends FormRequest
{
    /**
     * The volume to store the new metadata to.
     *
     * @var Volume
     */
    public $volume;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->volume = Volume::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->volume);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        $type = $this->volume->isImageVolume() ? 'image' : 'video';
        $parserClass = $this->input('parser', false);
        $mimeTypes = [];
        if ($parserClass && ParserFactory::has($type, $parserClass)) {
            $mimeTypes = $parserClass::getKnownMimeTypes();
        }

        return [
            'parser' => 'required',
            'file' => [
                'required',
                'file',
                'max:500000',
                'mimetypes:'.implode(',', $mimeTypes),
            ],
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
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $type = $this->volume->isImageVolume() ? 'image' : 'video';
            $parserClass = $this->input('parser');

            if (!ParserFactory::has($type, $parserClass)) {
                $validator->errors()->add('parser', 'Unknown metadata parser for this media type.');
                return;
            }

            $parser = new $parserClass($this->file('file'));
            if (!$parser->recognizesFile()) {
                $validator->errors()->add('file', 'Unknown metadata file format.');
                return;
            }

            $rule = match ($type) {
                'video' => new VideoMetadata,
                default => new ImageMetadata,
            };

            if (!$rule->passes('file', $parser->getMetadata())) {
                $validator->errors()->add('file', $rule->message());
            }
        });
    }
}
