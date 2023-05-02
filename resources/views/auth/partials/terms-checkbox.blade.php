@if (View::exists('terms'))
    <div class="form-group{{ $errors->has('terms') ? ' has-error' : '' }}">
        <div class="checkbox">
            <label>
                <input name="terms" type="checkbox" value="1" required @checked(old('terms'))> I have read and agree to the <a href="{{route('terms')}}">terms of use</a>.
            </label>
        </div>
        @if($errors->has('terms'))
            <span class="help-block">{{ $errors->first('terms') }}</span>
        @endif
    </div>
@endif
