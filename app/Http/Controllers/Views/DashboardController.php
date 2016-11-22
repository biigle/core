<?php

namespace Dias\Http\Controllers\Views;

use Dias\ImageLabel;
use Dias\AnnotationLabel;
use Illuminate\Contracts\Auth\Guard;

class DashboardController extends Controller
{
    /**
     * Show the application dashboard to the user.
     *
     * @param Guard $auth
     * @return \Illuminate\Http\Response
     */
    public function index(Guard $auth)
    {
        $user = $auth->user();

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
                // take its transect
                $recentTransect = $recentImage->transect;
            } else {
                // else take the transect of the image label
                $recentTransect = $imageLabel->image->transect;
            }
        } elseif ($recentImage) {
            $recentTransect = $recentImage->transect;
        } else {
            $recentTransect = null;
        }

        $projects = $user->projects()
            ->orderBy('updated_at', 'desc')
            ->take(3)
            ->get();

        return view('dashboard', [
            'user' => $user,
            'recentImage' => $recentImage,
            'recentTransect' => $recentTransect,
            'projects' => $projects,
        ]);
    }
}
