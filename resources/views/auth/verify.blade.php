@extends('app')

@section('title', 'Verify Email')
@section('show-navbar', false)

@section('content')
<div class="container">
    <div class="row center-form">
        <div class="col-md-6 col-md-offset-3 col-sm-8 col-sm-offset-2">
            <div class="well text-center">
                <h1>Verify Your Email Address</h1>
                <p>Before proceeding, please check your email for a verification link.</p>
                <p>If you did not receive the email, click the button below to request another.</p>
                @if (session('resent'))
                    <p class="text-success">A fresh verification link has been sent to your email address.</p>
                @endif
                <form method="POST" action="{{ route('verification.resend') }}">
                    @csrf
                    <button type="submit" class="btn btn-primary">Resend Verification Email</button>
                </form>
            </div>
        </div>
    </div>
</div>
@include('partials.footer', ['positionAbsolute' => true])
@endsection