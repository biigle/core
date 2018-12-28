<?php

namespace Biigle\Http\Controllers\Views;

use Biigle\User;
use Biigle\ImageLabel;
use Biigle\AnnotationLabel;
use Illuminate\Contracts\Auth\Guard;
use Illuminate\Support\Facades\View;

class DashboardController extends Controller
{
    /**
     * Create a new instance.
     */
    public function __construct()
    {
        if (!View::exists('landing')) {
            $this->middleware('auth');
        }
    }

    /**
     * Show the application dashboard to the user.
     *
     * @param Guard $auth
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth)
    {
        if ($auth->check()) {
            return $this->indexDashboard($auth->user());
        }

        return $this->indexLandingPage();
    }

    /**
     * Show the dashboard for a logged in user.
     *
     * @param User $user
     *
     * @return \Illuminate\Http\Response
     */
    protected function indexDashboard(User $user)
    {
        $annotationLabel = AnnotationLabel::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        $imageLabel = ImageLabel::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($annotationLabel) {
            $recentImage = $annotationLabel->annotation->image;
        } else {
            $recentImage = null;
        }

        if ($imageLabel) {
            if ($annotationLabel && $annotationLabel->created_at > $imageLabel->created_at) {
                // if the annotation label is newer than the image label,
                // take its volume
                $recentVolume = $recentImage->volume;
            } else {
                // else take the volume of the image label
                $recentVolume = $imageLabel->image->volume;
            }
        } elseif ($recentImage) {
            $recentVolume = $recentImage->volume;
        } else {
            $recentVolume = null;
        }

        $projects = $user->projects()
            ->orderBy('updated_at', 'desc')
            ->take(3)
            ->get();

        return view('dashboard', [
            'user' => $user,
            'recentImage' => $recentImage,
            'recentVolume' => $recentVolume,
            'projects' => $projects,
        ]);
    }

    /**
     * Show the landing page if no user is authenticated.
     *
     * @return \Illuminate\Http\Response
     */
    protected function indexLandingPage()
    {
        return view('landing');
    }
}
