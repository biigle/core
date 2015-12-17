<?php

namespace Dias\Exceptions;

use Exception;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Dias\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Illuminate\Database\Eloquent\ModelNotFoundException;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that should not be reported.
     *
     * @var array
     */
    protected $dontReport = [
        'Symfony\Component\HttpKernel\Exception\HttpException',
        'Illuminate\Database\Eloquent\ModelNotFoundException'
    ];

    private function renderJsonResponse(Exception $e)
    {
        $status = $this->isHttpException($e) ? $e->getStatusCode() : 500;

        if (config('app.debug')) {
            $message = $e->getMessage();
        } else {
            switch ($status) {
                case 404:
                    $message = 'Sorry, the page you are looking for could not be found.';
                    break;
                default:
                    $message = 'Whoops, looks like something went wrong.';
            }
        }

        return new JsonResponse(['message' => $message], $status);
    }

    /**
     * Report or log an exception.
     *
     * This is a great spot to send exceptions to Sentry, Bugsnag, etc.
     *
     * @param  \Exception  $e
     * @return void
     */
    public function report(Exception $e)
    {
        return parent::report($e);
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
        if ($e instanceof ModelNotFoundException) {
            $e = new NotFoundHttpException();
        }

        // use JsonResponse if this was an automated request
        if (Controller::isAutomatedRequest($request)) {
            return $this->renderJsonResponse($e);
        } elseif ($this->isHttpException($e)) {
            return $this->renderHttpException($e);
        } else {
            return parent::render($request, $e);
        }
    }
}
