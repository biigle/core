@extends('app')

@section('title', "Join project {$project->name}")

@section('content')
<div class="container">
    <div class="row">
        <div class="col-md-4 col-md-offset-4 4 col-sm-6 col-sm-offset-3">
            @if ($invitation->isOpen())
                <form class="well project-invitation" role="form" method="POST" action="{{ url("api/v1/project-invitations/{$invitation->id}/join") }}">
                    <p class="text-center">
                        You were invited to join the project<br><b>{{$project->name}}</b>!
                    </p>

                    <input type="hidden" name="token" value="{{ $invitation->uuid }}">
                    <input type="hidden" name="_token" value="{{ csrf_token() }}">
                    <input type="submit" class="btn btn-success btn-block" value="Join the project">
                </form>
            @else
                <div class="well project-invitation text-center text-warning">
                    This project invitation is no longer open.
                </div>
            @endif
        </div>
    </div>
</div>
@endsection
