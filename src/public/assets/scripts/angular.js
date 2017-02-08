angular.module("biigle.volumes",["biigle.api","biigle.ui"]),angular.module("biigle.volumes").config(["$compileProvider",function(e){"use strict";e.debugInfoEnabled(!1)}]),angular.module("biigle.volumes").controller("FilterController",["$scope","images","filter",function(e,t,n){"use strict";e.active=n.hasRules,e.data={negate:"false",filter:null,selected:null},e.setFilterMode=function(e){n.setMode(e),t.updateFiltering()},e.isFilterMode=function(e){return n.getMode()===e},e.getFilters=n.getAll,e.addRule=function(){var i={filter:e.data.filter,negate:"true"===e.data.negate,data:e.data.selected};n.hasRule(i)||n.addRule(i).then(t.updateFiltering)},e.getRules=n.getAllRules,e.removeRule=function(e){n.removeRule(e),t.updateFiltering()},e.rulesLoading=n.rulesLoading,e.numberImages=n.getNumberImages,e.selectData=function(t){e.data.selected=t},e.resetFiltering=function(){n.reset(),t.updateFiltering()},e.getHelpText=function(){return e.data.filter?"false"===e.data.negate?e.data.filter.helpText:e.data.filter.helpTextNegate:""}}]),angular.module("biigle.volumes").controller("HasImageLabelFilterController",["LabelImage","filter","VOLUME_ID",function(e,t,n){"use strict";t.add({name:"image labels",helpText:"All images that have one or more image labels attached.",helpTextNegate:"All images that have no image labels attached.",template:"hasImageLabelsFilterRule.html",getSequence:function(){return e.query({volume_id:n})}})}]),angular.module("biigle.volumes").controller("ImageLabelController",["$scope","labels","VOLUME_ID","keyboard",function(e,t,n,i){"use strict";var o=[],l=9,r="biigle.volumes."+n+".label-favourites",a=[],u=function(){var e=window.localStorage.getItem(r);e&&(e=JSON.parse(e),o=t.filter(function(t){return e.indexOf(t.id)!==-1}));for(var n=function(e){return function(){s(e)}},i=0;i<=l;i++)a.push(n(i))},s=function(t){t>=0&&t<o.length&&(e.selectLabel(o[t]),e.$apply())};e.selected={searchLabel:null},e.hotkeysMap=["𝟭","𝟮","𝟯","𝟰","𝟱","𝟲","𝟳","𝟴","𝟵"],e.getLabels=t.getLabels,e.getLabelTrees=t.getLabelTrees,e.selectLabel=function(n){t.selectLabel(n),e.selected.searchLabel="",e.$broadcast("labels.selected")},e.hasFavourites=function(){return o.length>0},e.favouritesLeft=function(){return o.length<l},e.getFavourites=function(){return o},e.isFavourite=function(e){return o.indexOf(e)!==-1},e.toggleFavourite=function(e,t){e.stopPropagation();var n=o.indexOf(t);if(n===-1&&o.length<l?o.push(t):o.splice(n,1),o.length>0){var i=o.map(function(e){return e.id});window.localStorage.setItem(r,JSON.stringify(i))}else window.localStorage.removeItem(r)},e.$on("label-mode.toggle",function(t,n){var o;if(n)for(o=0;o<=l;o++)i.on((o+1).toString(),a[o]);else for(e.selectLabel(null),o=0;o<=l;o++)i.off((o+1).toString(),a[o])}),u()}]),angular.module("biigle.volumes").controller("ImageLabelFilterController",["ImageLabelImage","filter","VOLUME_ID",function(e,t,n){"use strict";t.add({name:"image label",helpText:"All images that have the given image label attached.",helpTextNegate:"All images that don't have the given image label attached.",template:"imageWithLabelFilterRule.html",typeahead:"imageLabelFilterTypeahead.html",getSequence:function(t){return e.query({volume_id:n,data:t.id})}})}]),angular.module("biigle.volumes").controller("ImageLabelUserFilterController",["ImageLabelUserImage","filter","VOLUME_ID",function(e,t,n){"use strict";t.add({name:"image label by user",helpText:"All images that have one or more image labels attached by the given user.",helpTextNegate:"All images that don't have image labels attached by the given user.",template:"imageLabelByUserFilterRule.html",typeahead:"imageLabelUserFilterTypeahead.html",getSequence:function(t){return e.query({volume_id:n,data:t.id})}})}]),angular.module("biigle.volumes").controller("ImagesController",["$scope","$element","images","filter","keyboard","$timeout",function(e,t,n,i,o,l){"use strict";var r=function(){n.updateGrid(t[0].clientWidth,t[0].clientHeight)},a=function(t){n.scrollRows(t),e.$apply()},u=function(t){n.scrollToPercent(t),e.$apply()},s=function(e){a(e.deltaY>=0?1:-1)};e.getClass=function(){return{"label-mode":e.isInLabelMode()}},e.imageHasFlag=i.hasFlag,e.getImageIds=n.getSequence,e.disableScrolling=function(){t.unbind("wheel",s)},e.enableScrolling=function(){t.bind("wheel",s)},e.enableScrolling(),o.on(38,function(){a(-1)}),o.on(40,function(){a(1)});var c=function(){a(-1*n.getRows())};o.on(37,c),o.on(33,c);var g=function(){a(n.getRows())};o.on(39,g),o.on(34,g),o.on(36,function(){u(0)}),o.on(35,function(){u(1)}),window.addEventListener("resize",function(){e.$apply(r)}),e.$on("label-mode.toggle",function(){l(r)}),r(),n.initialize()}]),angular.module("biigle.volumes").controller("ProgressController",["$scope","images","debounce",function(e,t,n){"use strict";var i,o=!1,l=function(e){e.preventDefault(),i=e.target.getBoundingClientRect(),t.scrollToPercent((e.clientY-i.top)/i.height)};e.beginScrolling=function(){o=!0},e.stopScrolling=function(t){e.scroll(t),o=!1},e.scroll=function(e){o&&n(function(){l(e)},25,"volumes.progress.scroll")},e.progress=function(){return 100*t.progress()+"%"},e.top=function(){t.scrollToPercent(0)},e.prevPage=function(){t.scrollRows(-1*t.getRows())},e.prevRow=function(){t.scrollRows(-1)},e.nextRow=function(){t.scrollRows(1)},e.nextPage=function(){t.scrollRows(t.getRows())},e.bottom=function(){t.scrollToPercent(1)},e.isAtTop=function(){return 0===t.progress()},e.isAtBottom=function(){return 1===t.progress()}}]),angular.module("biigle.volumes").controller("SortByFilenameController",["$scope","sort","VOLUME_IMAGES",function(e,t,n){"use strict";var i="filename";e.active=function(){return t.isSorterActive("filename")},e.toggle=function(){e.active()||e.activateSorter(i,n)}}]),angular.module("biigle.volumes").controller("SortController",["$scope","sort","images",function(e,t,n){"use strict";var i={},o=!1;e.setCache=function(e,t){i[e]=t},e.getCache=function(e){return i[e]},e.hasCache=function(e){return i.hasOwnProperty(e)},e.active=t.isActive,e.setSortAscending=function(){t.setAscending(),n.updateSorting()},e.setSortDescending=function(){t.setDescending(),n.updateSorting()},e.isSortAscending=t.isAscending,e.isSortDescending=t.isDescending,e.activateSorter=function(e,i){t.activateSorter(e,i),n.updateSorting()},e.resetSorting=function(){t.reset(),n.updateSorting()},e.setLoading=function(e){o=e},e.isLoading=function(){return o}}]),angular.module("biigle.volumes").controller("SortRandomController",["$scope","sort","VOLUME_IMAGES",function(e,t,n){"use strict";var i="random",o=function(e){var t,n,i;for(t=e.length-1;t>0;t--)n=Math.floor(Math.random()*(t+1)),i=e[t],e[t]=e[n],e[n]=i;return e};e.active=function(){return t.isSorterActive("random")},e.toggle=function(){e.active()||e.activateSorter(i,o(n.slice(0)))}}]),angular.module("biigle.volumes").controller("VolumeController",["$scope",function(e){"use strict";var t=!1;e.isInLabelMode=function(){return t},e.toggleLabelMode=function(){t=!t,e.$broadcast("label-mode.toggle",t)}}]),angular.module("biigle.volumes").directive("labelTreeItem",["$compile","$timeout","$templateCache",function(e,t,n){"use strict";return{restrict:"C",templateUrl:"label-tree-item.html",scope:!0,link:function(i,o,l){var r=angular.element(n.get("label-subtree.html"));t(function(){o.append(e(r)(i))})},controller:["$scope","labels",function(e,t){var n=!1,i=!1,o=!1,l=function(){t.treeItemIsOpen(e.item)?(n=!0,o=!1):t.treeItemIsSelected(e.item)?(n=!0,o=!0):(n=!1,o=!1)},r=function(){i=e.tree&&!!e.tree[e.item.id]};e.getSubtree=function(){return n&&e.tree?e.tree[e.item.id]:[]},e.getClass=function(){return{open:n,expandable:i,selected:o}},e.$on("labels.selected",l),l(),r()}]}}]),angular.module("biigle.volumes").directive("volumeFigure",function(){"use strict";return{restrict:"A",controller:["$scope","labels","filter","msg","$timeout","images","IMAGES_UUIDS",function(e,t,n,i,o,l,r){var a=!1,u=!1,s=!1,c=!1,g=function(){a=!0,u=!1,s=!1,o(function(){a=!1},3e3)},d=function(e){a=!1,u=!1,s=!0,i.responseError(e)};e.uuid=r[e.id],e.hasFlag=function(){return n.hasFlag(e.id)},e.handleClick=function(n){e.isInLabelMode()&&(n.preventDefault(),u=!0,t.attachToImage(e.id).then(g,d))},e.getClass=function(){return{"image-label-saved":a,"image-label-saving":u,"image-label-error":s}},e.getImageLabels=function(){return t.getAttachedLabels(e.id)},e.imageLabelsResolved=function(){return t.getAttachedLabels(e.id).$resolved},e.hasImageLabels=function(){return t.getAttachedLabels(e.id).length>0},e.canDetachLabel=t.canDetachLabel,e.detachLabel=function(n){t.detachLabel(e.id,n).then(angular.noop,i.responseError)},e.toggleLabelPopover=function(){c=!c},e.isPopoverOpen=function(){return c},e.getPopoverPlacement=function(){return l.isImageInRightHalf(e.id)?"left":"right"},e.$on("label-mode.toggle",function(){u=!1,s=!1})}]}}),angular.module("biigle.volumes").directive("volumeFilterUserChooser",function(){"use strict";return{restrict:"A",scope:{select:"=volumeFilterUserChooser"},replace:!0,template:'<input type="text" data-ng-model="selected" data-uib-typeahead="name(user) for user in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',controller:["$scope","VolumeFilterUser",function(e,t){e.name=function(e){return e&&e.firstname&&e.lastname?e.firstname+" "+e.lastname:""},e.find=function(e){return t.find({query:encodeURIComponent(e)}).$promise}}]}}),angular.module("biigle.volumes").directive("volumeImageLabelChooser",function(){"use strict";return{restrict:"A",scope:{select:"=volumeImageLabelChooser",id:"=volumeId"},replace:!0,template:'<input type="text" data-ng-model="selected" data-uib-typeahead="label.name for label in find($viewValue)" data-typeahead-wait-ms="250" data-typeahead-on-select="select($item)"/>',controller:["$scope","VolumeImageLabels",function(e,t){e.find=function(n){return t.find({volume_id:e.id,query:encodeURIComponent(n)}).$promise}}]}}),angular.module("biigle.volumes").factory("ImageLabelImage",["$resource","URL",function(e,t){"use strict";return e(t+"/api/v1/volumes/:volume_id/images/filter/image-label/:data")}]),angular.module("biigle.volumes").factory("ImageLabelUserImage",["$resource","URL",function(e,t){"use strict";return e(t+"/api/v1/volumes/:volume_id/images/filter/image-label-user/:data")}]),angular.module("biigle.volumes").factory("LabelImage",["$resource","URL",function(e,t){"use strict";return e(t+"/api/v1/volumes/:volume_id/images/filter/labels")}]),angular.module("biigle.volumes").factory("VolumeFilterUser",["$resource","URL",function(e,t){"use strict";return e(t+"/api/v1/users/find/:query",{},{find:{method:"GET",params:{volume_id:null},isArray:!0}})}]),angular.module("biigle.volumes").factory("VolumeImageLabels",["$resource","URL",function(e,t){"use strict";return e(t+"/api/v1/volumes/:volume_id/image-labels/find/:query",{},{find:{method:"GET",isArray:!0}})}]),angular.module("biigle.volumes").factory("VolumeImageOrderByFilename",["$resource","URL",function(e,t){"use strict";return e(t+"/api/v1/volumes/:volume_id/images/order-by/filename")}]),angular.module("biigle.volumes").service("filter",["VOLUME_ID","VOLUME_IMAGES","filterSubset","filterExclude","$q",function(e,t,n,i,o){"use strict";var l="filter",r=this,a="biigle.volumes."+e+".filter.rules",u="biigle.volumes."+e+".filter.mode",s=[],c=window.localStorage.getItem(u)||l,g=JSON.parse(window.localStorage.getItem(a))||[],d=[],f=function(){angular.copy(t,d);for(var e,o=g.length-1;o>=0;o--)e=g[o],e.negate?i(d,e.ids):n(d,e.ids);g.length>0?window.localStorage.setItem(a,JSON.stringify(g)):window.localStorage.removeItem(a)};this.setMode=function(e){c=e,c!==l?window.localStorage.setItem(u,c):window.localStorage.removeItem(u)},this.getMode=function(){return c},this.add=function(e){if(!e.hasOwnProperty("name"))throw"A filter needs a name property";if(!e.hasOwnProperty("getSequence"))throw"A filter needs a getSequence property";if(s.push({name:e.name,helpText:e.helpText||"",helpTextNegate:e.helpTextNegate||"",getSequence:e.getSequence,template:e.template,typeahead:e.typeahead}),e.refreshSequence&&e.getSequence)for(var t=g.length-1;t>=0;t--)g[t].filter.name===e.name&&(g[t].ids=e.getSequence(g[t].data))},this.getAll=function(){return s},this.addRule=function(e){var t={filter:e.filter,negate:e.negate,data:e.data},n=function(){r.removeRule(t)};return g.push(t),t.ids=e.filter.getSequence(e.data),t.ids.$promise.then(f,n),t.ids.$promise},this.getAllRules=function(){return g},this.removeRule=function(e){var t=g.indexOf(e);t>=0&&g.splice(t,1),f()},this.hasRule=function(e){for(var t,n=g.length-1;n>=0;n--)if(t=g[n],t.filter==e.filter&&t.negate==e.negate&&t.data==e.data)return!0;return!1},this.hasRules=function(){return g.length>0},this.rulesLoading=function(){for(var e=g.length-1;e>=0;e--)if(g[e].ids.$resolved===!1)return!0;return!1},this.getNumberImages=function(){return d.length},this.getSequence=function(){return"filter"===c?d:t},this.hasFlag=function(e){return"flag"===c&&d.indexOf(e)>=0},this.reset=function(){g.length=0,r.setMode(l),f()},this.refresh=f,f()}]),angular.module("biigle.volumes").service("images",["VOLUME_ID","VOLUME_IMAGES","filterSubset","filter","sort","THUMB_DIMENSION","urlParams","debounce",function(e,t,n,i,o,l,r,a){"use strict";var u="biigle.volumes."+e+".images",s="biigle.volumes."+e+".offset",c=[];window.localStorage[u]?(c=JSON.parse(window.localStorage[u]),n(c,t)):angular.copy(t,c);var g={cols:0,rows:0},d=8,f=0,m=null,h=[],v=function(){h=c.slice(m,m+g.cols*g.rows)},p=0,b=function(){p=Math.ceil(c.length/g.cols)-g.rows,null!==m&&S(m)},I=function(){var e=!1;o.isActive()?(e=!0,angular.copy(o.getSequence(),c),n(c,t)):angular.copy(t,c),i.hasRules()&&(e=!0,n(c,i.getSequence())),v(),e?window.localStorage[u]=JSON.stringify(c):window.localStorage.removeItem(u)},S=function(e){m=Math.max(0,Math.min(p*g.cols,e)),v(),m===f?(window.localStorage.removeItem(s),r.unset("offset")):Number.isInteger(m)&&(window.localStorage[s]=m,r.set({offset:m}))};this.updateSorting=function(){I()},this.updateFiltering=function(){I(),b()},this.progress=function(){return Math.max(0,Math.min(1,m/(c.length-g.cols*g.rows)))},this.updateGrid=function(e,t){g.cols=Math.floor(e/(l.WIDTH+d)),g.rows=Math.floor(t/(l.HEIGHT+d)),v(),b()},this.scrollRows=function(e){S(m+g.cols*e)},this.scrollToPercent=function(e){S(g.cols*Math.round(p*e))},this.getSequence=function(){return h},this.getRows=function(){return g.rows},this.getCols=function(){return g.cols},this.getLength=function(){return c.length},this.isImageInRightHalf=function(e){var t=h.indexOf(e);return t!==-1&&t%g.cols>=g.cols/2},this.initialize=function(){S(void 0!==r.get("offset")?parseInt(r.get("offset")):window.localStorage[s]?parseInt(window.localStorage[s]):f)}}]),angular.module("biigle.volumes").service("labels",["LABEL_TREES","USER_ID","IS_ADMIN","ImageLabel","$q",function(e,t,n,i,o){"use strict";var l={},r=[],a={},u=[],s=null,c=function(){for(var t,n=function(e){var n=e.parent_id;a[t][n]?a[t][n].push(e):a[t][n]=[e]},i=e.length-1;i>=0;i--)t=e[i].name,a[t]={},e[i].labels.forEach(n),r=r.concat(e[i].labels)},g=function(e){for(var t=r.length-1;t>=0;t--)if(r[t].id===e)return r[t];return null},d=function(e){var t=e;if(u.length=0,t)for(;null!==t.parent_id;)u.unshift(t.parent_id),t=g(t.parent_id)},f=function(e){l.hasOwnProperty(e.image_id)&&l[e.image_id].unshift(e)},m=function(e,t){if(l.hasOwnProperty(e))for(var n=l[e],i=n.length-1;i>=0;i--)if(n[i].id===t.id){n.splice(i,1);break}},h=function(e,t){l.hasOwnProperty(e)&&l[e].push(t)};this.getLabels=function(){return r},this.getLabelTrees=function(){return a},this.selectLabel=function(e){d(e),s=e},this.treeItemIsOpen=function(e){return u.indexOf(e.id)!==-1},this.treeItemIsSelected=function(e){return s&&s.id===e.id},this.attachToImage=function(e){if(s)return i.attach({label_id:s.id,image_id:e},f).$promise;var t=o.defer();return t.reject({data:{message:"No label selected."}}),t.promise},this.getAttachedLabels=function(e){return l.hasOwnProperty(e)||(l[e]=i.query({image_id:e})),l[e]},this.canDetachLabel=function(e){return n||e.user.id===t},this.detachLabel=function(e,t){return m(e,t),i.delete({id:t.id},angular.noop,function(){h(e,t)}).$promise},c()}]),angular.module("biigle.volumes").service("sort",["VOLUME_ID","VOLUME_IMAGES",function(e,t){"use strict";var n="biigle.volumes."+e+".sorting.sorter",i="biigle.volumes."+e+".sorting.sequence",o="biigle.volumes."+e+".sorting.direction",l="asc",r="desc",a={DIRECTION:l,SORTER:"filename",SEQUENCE:t},u=window.localStorage.getItem(o);u||(u=a.DIRECTION);var s=window.localStorage.getItem(n);s||(s=a.SORTER);var c=JSON.parse(window.localStorage.getItem(i));c||(c=a.SEQUENCE);var g=function(e){u=e,u===a.DIRECTION?window.localStorage.removeItem(o):window.localStorage.setItem(o,u)};this.setAscending=function(){g(l)},this.setDescending=function(){g(r)},this.isAscending=function(){return u===l},this.isDescending=function(){return u===r},this.isSorterActive=function(e){return s===e},this.isActive=function(){return s!==a.SORTER||u!==a.DIRECTION},this.reset=function(){s=a.SORTER,window.localStorage.removeItem(n),c=a.SEQUENCE,window.localStorage.removeItem(i),u=a.DIRECTION,window.localStorage.removeItem(o)},this.activateSorter=function(e,t){if(s!==e){if(t.length!==a.SEQUENCE.length)throw"Requested sorting sequence length does not match the number of images in the volume!";s=e,s===a.SORTER?window.localStorage.removeItem(n):window.localStorage.setItem(n,s),c=t,c===a.SEQUENCE?window.localStorage.removeItem(i):window.localStorage.setItem(i,JSON.stringify(c))}},this.getSequence=function(){return u===r?c.slice().reverse():c}}]);