<?php

namespace Biigle\Http\Requests;

use App;
use Biigle\FederatedSearchInstance;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFederatedSearchInstance extends FormRequest
{

    /**
     * The instance that should be updated.
     *
     * @var FederatedSearchInstance
     */
    public $instance;

    /**
     * Determine if the user is authorized to make this request.
     *
     * @return bool
     */
    public function authorize()
    {
        $this->instance = FederatedSearchInstance::findOrFail($this->route('id'));

        return $this->user()->can('update', $this->instance);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array
     */
    public function rules()
    {
        return [
            'name' => 'filled|min:1|max:512',
            'url' => [
                'filled',
                'url',
                Rule::unique('federated_search_instances')->ignore($this->instance->id),
            ],
            'remote_token' => 'nullable|string',
            'local_token' => 'filled|bool',
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
            $token = $this->input('remote_token');
            $baseUrl = $this->input('url', $this->instance->url);
            $url = $baseUrl.route('federated-search-index', '', false);

            try {
                if ($this->has('remote_token') && $token) {
                    $this->checkRemoteConnection($url, $token);
                } elseif (!$this->has('remote_token') && $this->instance->remote_token) {
                    $this->checkRemoteConnection($url, $this->instance->remote_token);
                }
            } catch (RequestException $e) {
                $response = $e->getResponse();
                if ($response && $response->getStatusCode() === 401) {
                    $validator->errors()->add('remote_token', 'The token is not accepted by the remote instance.');
                } else {
                    $validator->errors()->add('url', 'Could not connect to the remote instance. Is the URL correct?');
                }
            }
        });
    }

    /**
     * Check the connection to the remote instance.
     *
     * @param string $url
     * @param string $token
     * @throws RequestException If the connection wasn't successful
     */
    protected function checkRemoteConnection($url, $token)
    {
        $client = App::make(Client::class);
        $client->head($url, ['headers' => ['Authorization' => "Bearer {$token}"]]);
    }
}
