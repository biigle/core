<?php

namespace Biigle\Exceptions;

use Exception;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Session\TokenMismatchException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array
     */
    protected $dontReport = [
        //
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array
     */
    protected $dontFlash = [
        'password',
        'password_confirmation',
        'auth_password',
    ];

    /**
     * Report or log an exception.
     *
     * @param  \Exception  $exception
     * @return void
     */
    public function report(Exception $exception)
    {
        parent::report($exception);
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Exception  $e
     * @return \Illuminate\Http\Response
     */
    public function render($request, Exception $e)
    {
        // Convert the exception here because we want to throw a 403 and not a 500.
        // Also set a helpful error message for the user.
        if ($e instanceof TokenMismatchException) {
            $e = new TokenMismatchException('Your user session expired. Please refresh the page.');
        }

        return parent::render($request, $e);
    }

    /**
     * Prepare exception for rendering.
     *
     * @param  \Exception  $e
     * @return \Exception
     */
    protected function prepareException(Exception $e)
    {
        if ($e instanceof MethodNotAllowedHttpException) {
            // Add a helpful message to this exception.
            $allow = explode(', ', $e->getHeaders()['Allow']);
            $e = new MethodNotAllowedHttpException($allow, 'The HTTP method is not allowed.', $e);
        }

        return parent::prepareException($e);
    }
}
