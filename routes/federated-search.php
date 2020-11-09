<?php

/*
|--------------------------------------------------------------------------
| Federated Search Routes
|--------------------------------------------------------------------------
|
| These routes are API routes with a different authentication.
|
*/

$router->get('federated-search-index', [
    'as' => 'federated-search-index',
    'uses' => 'FederatedSearchIndexController@index',
]);
