@if (View::exists('privacy'))
    <div class="form-group{{ $errors->has('privacy') ? ' has-error' : '' }}">
        <div class="checkbox">
            <label>
                <input name="privacy" type="checkbox" value="1" required @checked(old('privacy'))> I have read and agree to the <a href="{{route('privacy')}}">privacy notice</a>. This includes the use of my full name, email address and affiliation.
            </label>
        </div>
        @if($errors->has('privacy'))
            <span class="help-block">{{ $errors->first('privacy') }}</span>
        @endif
    </div>
@endif
