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
        $mimeTypes = ParserFactory::getKnownMimeTypes($type);

        return [
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
            $parser = ParserFactory::getParserForFile($this->file('file'), $type);
            if (is_null($parser)) {
                $validator->errors()->add('file', 'Unknown metadata file format for this media type.');
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
