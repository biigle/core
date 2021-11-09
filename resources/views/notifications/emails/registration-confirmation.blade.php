@component('mail::message')
# Hello!

The following user has just signed up:

@component('mail::panel')
**Name:** {{$newUser->firstname}}&nbsp;{{$newUser->lastname}}

**Email:** {{$newUser->email}}

**Affiliation:** {{$newUser->affiliation}}

@if (View::exists('privacy'))
I have read and agree to the [privacy notice]({{route('privacy')}}). This includes the use of my full name, email address and affiliation.
@endif
@if (View::exists('terms'))
I have read and agree to the [terms of use]({{route('terms')}}).
@endif
@endcomponent

@if($duplicateUsers->isNotEmpty())
Some existing users are similar to the new user:

@foreach($duplicateUsers->take(3) as $user)
- [{{$user->firstname}} {{$user->lastname}}]({{route('admin-users-show', $user->id)}}) ({{$user->affiliation}})
@endforeach

@if($duplicateUsers->count() > 3)
{{$duplicateUsers->count() - 3}} more similar users are not shown.
@endif
@endif

@component('mail::button', ['url' => route('accept-registration', $newUser->id), 'color' => 'green'])
Accept as editor
@endcomponent

@component('mail::subcopy')
[Reject and delete]({{route('reject-registration', $newUser->id)}}) the new user.
@endcomponent

@endcomponent
