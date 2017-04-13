<div v-if="isPrivate" @if(!$private) v-cloak @endif class="panel panel-default" id="label-trees-authorized-projects" :class="classObject">
    <div class="panel-heading">
        Authorized Projects
        <span class="pull-right">
            <loader :active="loading"></loader>
            <button class="btn btn-default btn-xs" title="Edit authorized projects" v-on:click="toggleEditing" :class="{active: editing}"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span></button>
        </span>
    </div>
    <div v-if="editing" v-cloak class="panel-body">
        <form class="form-inline">
            <div class="form-group">
                <typeahead :items="authorizableProjects" placeholder="Project name" title="Authorize one of your projects to use this tree" v-on:select="addAuthorizedProject" :clear-on-select="true"></typeahead>
            </div>
        </form>
    </div>
    <ul v-cloak class="list-group list-group-restricted">
        <li v-for="project in authorizedProjects" class="list-group-item">
            <button v-if="editing" type="button" class="close pull-right" aria-label="Close" title="Remove authorization for this project" v-on:click="removeAuthorizedProject(project)"><span aria-hidden="true">&times;</span></button>
            @if (Route::has('project'))
                <a v-if="isOwnProject(project)" :href="'{{route('project', '')}}/' + project.id" v-text="project.name"></a>
                <span v-else v-text="project.name"></span>
            @else
                <span v-text="project.name"></span>
            @endif
        </li>
        <li class="list-group-item" v-if="!hasAuthorizedProjects">
            There are no projects authorized to use this label tree.
        </li>
    </ul>
</div>
