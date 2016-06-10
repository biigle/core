<div class="panel panel-default" data-ng-controller="MembersController" data-ng-class="{'panel-warning':isEditing()}">
    <div class="panel-heading">
        Members
        @can('update', $project)
            <span class="pull-right">
                <span class="ng-cloak" data-ng-if="isLoading()">loading...</span>
                <button class="btn btn-default btn-xs" title="Edit authorized projects" data-ng-click="toggleEditing()" data-ng-class="{active: isEditing()}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
            </span>
        @endcan
    </div>
    @can('update', $project)
        <div class="ng-cloak panel-body" data-ng-if="isEditing()">
            <form class="form-inline" data-ng-submit="attachMember()">
                <div class="form-group">
                    <input class="form-control" type="text" placeholder="Search new user" data-ng-model="newMember.user" data-uib-typeahead="user as username(user) for user in findUser($viewValue)" data-typeahead-wait-ms="250"/>
                    <select class="form-control" title="Role of the new user" data-ng-model="newMember.project_role_id">
                        @foreach ($roles as $id => $name)
                            <option value="{{$id}}">{{$name}}</option>
                        @endforeach
                    </select>
                    <button class="btn btn-default" type="submit" data-ng-disabled="!newMemberValid()">Add</button>
                </div>
            </form>
        </div>
    @endcan
    <ul class="list-group list-group-restricted">
        @can('update', $project)
            <li class="ng-cloak list-group-item clearfix" data-ng-repeat="member in getMembers() track by member.id">
                <span class="pull-right" data-ng-switch="isEditing() && !isOwnUser(member)">
                    <span data-ng-switch-when="true">
                        <form class="form-inline">
                            <select class="form-control input-sm" title="Change the role of @{{member.firstname}} @{{member.lastname}}" data-ng-disabled="isOwnUser(member)" data-ng-model="member.tmp_project_role_id" data-ng-change="updateRole(member)">
                                @foreach ($roles as $id => $name)
                                    <option value="{{$id}}">{{$name}}</option>
                                @endforeach
                            </select>
                            <button type="button" class="btn btn-default btn-sm" title="Remove @{{member.firstname}} @{{member.lastname}}" data-ng-click="detachMember(member)">Remove</button>
                        </form>
                    </span>
                    <span data-ng-switch-default="">
                        <span class="text-muted" data-ng-bind="getRole(member.project_role_id)"></span>
                    </span>
                </span>
                </span>
                <span data-ng-bind="member.firstname"></span> <span data-ng-bind="member.lastname"></span> <span class="text-muted" data-ng-if="isOwnUser(member)">(you)</span>
            </li>
        @else
            @foreach($members as $member)
                <li class="list-group-item clearfix">
                    <span class="text-muted pull-right">{{$roles[$member->project_role_id]}}</span>
                    {{$member->firstname}} {{$member->lastname}} @if($member->id === $user->id) <span class="text-muted">(you)</span> @endif
                </li>
            @endforeach
        @endcan
    </ul>
</div>
