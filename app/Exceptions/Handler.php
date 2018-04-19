<?php

namespace Biigle\Exceptions;

use Exception;
use ErrorException;
use Biigle\Http\Controllers\Controller;
use Illuminate\Http\Exceptions\HttpResponseException;
use Symfony\Component\Debug\Exception\FlattenException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Symfony\Component\Debug\ExceptionHandler as SymfonyExceptionHandler;
use Illuminate\Session\TokenMismatchException as BaseTokenMismatchException;

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
    ];

    /**
     * Report or log an exception.
     *
     * This is a great spot to send exceptions to Sentry, Bugsnag, etc.
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
     * @param  \Exception  $exception
     * @return \Illuminate\Http\Response
     */
    public function render($request, Exception $exception)
    {
        // Convert the exception here because we want to throw a 403 and not a 500.
        // Also set a helpful error message for the user.
        if ($exception instanceof BaseTokenMismatchException) {
            $exception = new TokenMismatchException('Your user session expired. Please refresh the page.');
        }

        if ($exception instanceof ErrorException && view()->exists('errors.500')) {
            return $this->renderCustomErrorPage($exception);
        } else {
            return parent::render($request, $exception);
        }
    }

    /**
     * Render the given HttpException.
     *
     * @param  \Symfony\Component\HttpKernel\Exception\HttpException  $e
     * @return \Symfony\Component\HttpFoundation\Response
     */
    protected function renderHttpException(HttpException $e)
    {
        $status = $e->getStatusCode();

        if (!view()->exists("errors.{$status}")) {
            return parent::renderHttpException($e);
        }

        return $this->renderCustomErrorPage($e);
    }

    /**
     * Render an exception with a custom view.
     *
     * @param \Exception $e
     * @return \Symfony\Component\HttpFoundation\Response
     */
    private function renderCustomErrorPage(Exception $e)
    {
        $e = FlattenException::create($e);
        $handler = new SymfonyExceptionHandler(config('app.debug'));
        $status = $e->getStatusCode();

        return response()->view(
            "errors.{$status}",
            [
                'exception' => $e,
                'content' => $handler->getContent($e),
                'css' => $handler->getStylesheet($e),
                'debug' => config('app.debug'),
            ],
            $status,
            $e->getHeaders()
        );
    }
}
