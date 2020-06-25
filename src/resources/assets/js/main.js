import CreateForm from './createForm';
import SearchResults from './searchResults';
import VideoContainer from './videoContainer';
import VideoPanel from './videoPanel';

biigle.$mount('create-video-form', CreateForm);
biigle.$mount('projects-show-video-list', VideoPanel);
biigle.$mount('search-results', SearchResults);
biigle.$mount('video-container', VideoContainer);
