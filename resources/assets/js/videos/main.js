import './filters/videoTime';
import Navbar from './navbar.vue';
import SearchResults from './searchResults.vue';
import VideoContainer from './videoContainer.vue';
biigle.$mount('search-results', SearchResults);
biigle.$mount('video-annotations-navbar', Navbar);
biigle.$mount('video-container', VideoContainer);
