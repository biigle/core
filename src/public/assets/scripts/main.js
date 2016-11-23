angular.module("dias.projects",["dias.api","dias.ui"]),angular.module("dias.projects").controller("MembersController",["$scope","PROJECT","MEMBERS","ROLES","DEFAULT_ROLE_ID","USER_ID","ProjectUser","msg","User",function(e,n,r,t,o,i,c,u,d){"use strict";var s=!1,a=!1;e.newMember={user:null,project_role_id:o.toString()};var l=function(e){u.responseError(e),a=!1},f=function(e){e.project_role_id=parseInt(e.tmp_project_role_id),a=!1},p=function(e,n){e.tmp_project_role_id=e.project_role_id.toString(),l(n)},m=function(e){for(var n=r.length-1;n>=0;n--)if(r[n].id===e.id){r.splice(n,1);break}a=!1},_=function(e){for(var n=r.length-1;n>=0;n--)if(r[n].id===e.id)return!1;return!0},g=function(e){return e.filter(_)},j=function(n){n.tmp_project_role_id=n.project_role_id.toString(),r.push(n),e.newMember.user=null,a=!1};e.isEditing=function(){return s},e.toggleEditing=function(){s=!s},e.isLoading=function(){return a},e.getMembers=function(){return r},e.hasMembers=function(){return r.length>0},e.getRoles=function(){return t},e.getRole=function(e){return t[e]},e.isOwnUser=function(e){return i===e.id},e.updateRole=function(e){a=!0,c.save({project_id:n.id},{id:e.id,project_role_id:parseInt(e.tmp_project_role_id)},function(){f(e)},function(n){p(e,n)})},e.detachMember=function(e){a||(a=!0,c.detach({project_id:n.id},{id:e.id},function(){m(e)},l))},e.username=function(e){return e&&e.firstname&&e.lastname?e.firstname+" "+e.lastname:""},e.findUser=function(e){return d.find({query:encodeURIComponent(e)}).$promise.then(g)},e.newMemberValid=function(){return e.newMember.user&&void 0!==e.newMember.user.id&&_(e.newMember.user)&&null!==e.newMember.project_role_id},e.attachMember=function(){if(!a&&e.newMemberValid()){a=!0;var r=e.newMember.user;r.project_role_id=parseInt(e.newMember.project_role_id),c.attach({project_id:n.id},{id:r.id,project_role_id:r.project_role_id},function(){j(r)},l)}};for(var h=r.length-1;h>=0;h--)r[h].tmp_project_role_id=r[h].project_role_id.toString()}]),angular.module("dias.projects").controller("ProjectController",["$scope","PROJECT","Project","msg","$timeout","ProjectUser","USER_ID","REDIRECT_URL",function(e,n,r,t,o,i,c,u){"use strict";var d=!1,s=!1;e.projectInfo={name:n.name,description:n.description};var a=function(e){t.responseError(e),s=!1},l=function(e){n.name=e.name,n.description=e.description,d=!1,s=!1},f=function(){t.success("The project was deleted. Redirecting..."),o(function(){window.location.href=u},2e3)},p=function(){t.success("You left the project. Redirecting..."),o(function(){window.location.href=u},2e3)},m=function(e){400===e.status?confirm("Deleting this project will delete one or more transects with all annotations! Do you want to continue?")&&r.delete({id:n.id,force:!0},f,t.responseError):mgs.responseError(e)};e.isEditing=function(){return d},e.toggleEditing=function(){d=!d},e.isSaving=function(){return s},e.getName=function(){return n.name},e.getDescription=function(){return n.description},e.saveChanges=function(){s=!0,r.save({id:n.id,name:e.projectInfo.name,description:e.projectInfo.description},l,a)},e.discardChanges=function(){e.projectInfo.name=n.name,e.projectInfo.description=n.description,d=!1},e.deleteProject=function(){confirm("Do you really want to delete the project "+n.name+"?")&&r.delete({id:n.id},f,m)},e.leaveProject=function(){confirm("Do you really want to leave the project "+n.name+"?")&&i.detach({project_id:n.id},{id:c},p,t.responseError)}}]),angular.module("dias.projects").controller("ProjectLabelTreesController",["$scope","PROJECT","LABEL_TREES","ProjectLabelTree","msg",function(e,n,r,t,o){"use strict";var i,c=!1,u=!1;e.selected={tree:null};var d=function(e){for(var n=r.length-1;n>=0;n--)if(r[n].id===e.id)return!1;return!0},s=function(n){r.push(n),e.selected.tree=null,u=!1},a=function(e){for(var n=r.length-1;n>=0;n--)if(r[n].id===e.id){r.splice(n,1);break}u=!1};e.isEditing=function(){return c},e.isLoading=function(){return u},e.toggleEditing=function(){c=!c,i||(i=t.available({project_id:n.id}))},e.getTrees=function(){return r},e.attachLabelTree=function(e){e&&void 0!==e.id&&d(e)&&(t.attach({project_id:n.id},{id:e.id},function(){s(e)},o.responseError),u=!0)},e.getAvailableTrees=function(){return i.filter(d)},e.detachLabelTree=function(e){t.detach({project_id:n.id},{id:e.id},a,o.responseError),u=!0}}]);