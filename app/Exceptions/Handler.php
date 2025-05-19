<?php

namespace Biigle\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Session\TokenMismatchException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var list<string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
        'auth_password',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Prepare exception for rendering.
     *
     * @param  Throwable  $e
     * @return Throwable
     */
    protected function prepareException(Throwable $e)
    {
        if ($e instanceof TokenMismatchException) {
            // Set a helpful error message for the user.
            $e = new TokenMismatchException('Your user session expired. Please refresh the page.');
        } elseif ($e instanceof MethodNotAllowedHttpException) {
            // Add a helpful message to this exception.
            $allow = explode(', ', $e->getHeaders()['Allow']);
            $e = new MethodNotAllowedHttpException($allow, 'The HTTP method is not allowed.', $e);
        }

        return parent::prepareException($e);
    }
}
