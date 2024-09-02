<?php

namespace Biigle\Http\Controllers\Views;

use Illuminate\Http\Response;
use View;

class ManualController extends Controller
{
    /**
     * Show the application manual to the user.
     */
    public function index()
    {
        return view('manual.index');
    }

    /**
     * Show a tutorials article.
     *
     * @param string $module Name of the module or name of the article
     * @param string $article Article name (only if the article belongs to a module)
     */
    public function tutorialsArticle($module, $article = null)
    {
        $view = 'manual.tutorials.';

        if (is_null($article) && View::exists("{$view}{$module}")) {
            return View::make("{$view}{$module}");
        } elseif (View::exists("{$view}{$module}.{$article}")) {
            return View::make("{$view}{$module}.{$article}");
        } elseif (View::exists("{$module}::{$view}{$article}")) {
            return View::make("{$module}::{$view}{$article}");
        }

        abort(Response::HTTP_NOT_FOUND);
    }

    /**
     * Show a documentation article.
     *
     * @param string $module Name of the module or name of the article
     * @param string $article Article name (only if the article belongs to a module)
     */
    public function documentationArticle($module, $article = null)
    {
        $view = 'manual.documentation.';

        if (is_null($article)) {
            $view .= $module;
        } else {
            $view = "{$module}::{$view}{$article}";
        }

        if (View::exists($view)) {
            return View::make($view);
        } else {
            abort(Response::HTTP_NOT_FOUND);
        }
    }
}
