<?php

Route::group([
        'namespace' => '\Dias\Modules\Annotations\Http\Controllers',
        'middleware' => 'auth',
        'prefix' => 'annotate',
    ], function ($router) {
    $router->get('/{id}', [
        'as'   => 'annotate',
        'uses' => 'AnnotationController@index',
    ]);
});
