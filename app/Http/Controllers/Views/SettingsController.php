<?php

namespace Dias\Http\Controllers\Views;

class SettingsController extends Controller
{
    /**
     * Redirects to the profile settings.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        return redirect()->route('settings-profile');
    }

    /**
     * Shows the profile settings.
     *
     * @return \Illuminate\Http\Response
     */
    public function profile()
    {
        return view('settings.profile')
            ->withUser($this->user)
            ->withSaved(session('saved'));
    }

    /**
     * Shows the account settings.
     *
     * @return \Illuminate\Http\Response
     */
    public function account()
    {
        return view('settings.account')
            ->withUser($this->user)
            ->withSaved(session('saved'))
            ->withOrigin(session('_origin'));
    }

    /**
     * Shows the tokens settings.
     *
     * @return \Illuminate\Http\Response
     */
    public function tokens()
    {
        return view('settings.tokens')
            ->withUser($this->user)
            ->withTokens($this->user->apiTokens()->orderBy('updated_at', 'desc')->get())
            ->withToken(session('token'))
            ->withDeleted(session('deleted'));
    }
}
