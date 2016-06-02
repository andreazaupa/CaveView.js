"use strict";

var CV = CV || {};

CV.UI = ( function() {

var cave;
var caveLoader;

var caveIndex = Infinity;
var caveList = [];
var guiState = {};
var viewState;
var surveyTree;

var isCaveLoaded = false;

var container;
var frame;

var heightCursorGui;
var file;
var progressBar;

var legShadingModes = {
	"by height":          CV.SHADING_HEIGHT,
	"by leg length":      CV.SHADING_LENGTH,
	"by leg inclination": CV.SHADING_INCLINATION,
	"height cursor":      CV.SHADING_CURSOR,
	"fixed":              CV.SHADING_SINGLE,
	"survey":             CV.SHADING_SURVEY
}

var surfaceShadingModes = {
	"by height":          CV.SHADING_HEIGHT,
	"by leg inclination": CV.SHADING_INCLINATION,
	"height cursor":      CV.SHADING_CURSOR,
	"fixed":              CV.SHADING_SINGLE
}

var terrainShadingModes = {
	"by height":          CV.SHADING_HEIGHT,
	"height cursor":      CV.SHADING_CURSOR,
	"Relief shading":     CV.SHADING_SHADED
}

var cameraViews = {
	"Plan":        CV.VIEW_PLAN,
	"N Elevation": CV.VIEW_ELEVATION_N,
	"S Elevation": CV.VIEW_ELEVATION_S,
	"E Elevation": CV.VIEW_ELEVATION_E,
	"W Elevation": CV.VIEW_ELEVATION_W
}

var cameraModes = {
	"Orthographic": CV.CAMERA_ORTHOGRAPHIC,
	"Perspective":  CV.CAMERA_PERSPECTIVE
}

function init ( domID ) { // public method

	container = document.getElementById( domID );

	if (!container) {

		alert( "No container DOM object [" + domID + "] available" );
		return;

	}

	progressBar = new CV.ProgressBar( container );

	CV.Viewer.init( domID );

	caveLoader = new CV.Loader( caveLoaded, progress );

	// event handlers
	document.addEventListener( "keydown", function ( event ) { keyDown( event ); } );

	container.addEventListener( "drop", handleDrop );
	container.addEventListener( "dragover", handleDragover );

	Object.defineProperty( guiState, "file", {
		get: function ()  { return file; },
		set: function ( value ) { loadCave( value ); file = value; },
	} );

	viewState = CV.Viewer.getState;

	viewState.addEventListener( "change",  CV.Page.handleChange );
	viewState.addEventListener( "newCave", viewComplete );

	CV.Hud.init( container );

}

function closeFrame ( event ) {

	event.target.parentElement.classList.remove( "onscreen" );

}

function initSelectionPage () {

	var titleBar  = document.createElement( "div" )
	var rootId    = surveyTree.getRootId();
	var track     = [];
	var lastSelected  = false;
	var page;

	if ( !isCaveLoaded ) return;

	page = new CV.Page( frame, "icon_explore" );

	page.addHeader( "Selection" );

	titleBar.id = "ui-path";
	titleBar.addEventListener( "click", _handleSelectSurveyBack );

	page.appendChild( titleBar );

	page.addSlide( _displayPanel( rootId ), track.length, _handleSelectSurvey );

	var redraw = container.clientHeight;

	return;

	function _displayPanel ( id ) {

		var topNode  = surveyTree.getNodeData( id );
		var children = surveyTree.getChildData( id );
		var ul;
		var tmp;
		var i;
		var l;
		var surveyColours      = CV.Colours.surveyColoursCSS;
		var surveyColoursRange = surveyColours.length;
		var span;

		track.push( { name: topNode.name, id: id } );

		while ( tmp = titleBar.firstChild ) titleBar.removeChild( tmp );

		l = track.length;
		var footprint = track[ l - 1 ];

		titleBar.textContent = footprint.name;;

		if ( l > 1) {

			span = document.createElement( "span" );
			span.textContent = " \u25C4";

			titleBar.appendChild( span );

		}

		ul = document.createElement( "ul" );

		children.sort( _sortSurveys );

		l = children.length;

		for ( i = 0; i < l; i++ ) {

			var child = children[ i ];
			var li    = document.createElement( "li" );
			var txt   = document.createTextNode( child.name );

			li.id = "sv" + child.id;
			
			var key = document.createElement( "span" );

			key.style.color = surveyColours[ child.id % surveyColoursRange ];
			key.textContent = "\u2588 ";

			li.appendChild( key );
			li.appendChild( txt );

			if ( child.noChildren ) {

				var descend = document.createElement( "div" );

				descend.classList.add( "descend-tree" );
				descend.id = "ssv" + child.id;
				descend.textContent = "\u25bA";

				li.appendChild( descend );

			}

			ul.appendChild( li );

		}

		return ul;

		function _sortSurveys ( s1, s2 ) {

			return s1.name.localeCompare( s2.name );

		}

	}

	function _handleSelectSurveyBack ( event ) {

		if ( track.length === 1 ) return;

		track.pop();

		var id = track.pop().id;

		page.replaceSlide( _displayPanel( id ), track.length, _handleSelectSurvey );

	}

	function _handleSelectSurvey ( event ) {

		var target = event.target;
		var id = target.id.split( "v" )[ 1 ];

		event.stopPropagation();

		switch ( target.nodeName ) {

		case "LI":

			if (viewState.section !== Number( id ) ) {

				viewState.section = id;

				target.classList.add( "selected" );

				if ( lastSelected && lastSelected !== target ) {

					lastSelected.classList.remove( "selected" );

				}

				lastSelected = target;

			} else {

				viewState.section = 0;
				target.classList.remove( "selected" );

			}

			break;

		case "DIV":

			// FIXME - detect entries with no children.....

			if ( id ) {

				page.replaceSlide( _displayPanel( id ), track.length, _handleSelectSurvey );

			}

			break;

		}

	}

}

function initHelpPage () {

	var help = new CV.Page( frame, "icon_help" );
	var dl;

	help.addHeader( "Help - key commands" );

	help.addHeader( "Shading" );

	dl = document.createElement( "dl" );

	_addKey( "1", "depth" );
	_addKey( "2", "leg angle" );
	_addKey( "3", "leg length" );
	_addKey( "4", "depth cursor " );
	_addKey( "5", "single colour" );
	_addKey( "6", "survey section" );

	_addKey( "[", "move depth cursor up" );
	_addKey( "]", "move depth cursor down" );

	//addKey("n", "next cave");

	help.appendChild( dl );

	help.addHeader( "View" );

	dl = document.createElement( "dl" );

	_addKey( "O", "orthogonal view" );
	_addKey( "P", "perspective view" );
	_addKey( "R", "reset to plan view" );
	_addKey( ".", "center view on last feature selected" );

	help.appendChild( dl );

	help.addHeader( "Visibility" );

	dl = document.createElement( "dl" );

	_addKey( "C", "scraps on/off [lox only]" );
	_addKey( "L", "labels on/off" );
	_addKey( "Q", "splay legs on/off" );
	_addKey( "S", "surface legs on/off" );
	_addKey( "T", "terrain on/off" );
	_addKey( "W", "LRUD walls on/off" );

	help.appendChild( dl );

	help.addHeader( "Selection" );

	dl = document.createElement( "dl" );

	_addKey( "V", "Remove all except selected section" );

	help.appendChild( dl );

	function _addKey( key, description ) {

		var dt = document.createElement( "dt" );
		var dd = document.createElement( "dd" );

		dt.textContent = key;
		dd.textContent = description;

		dl.appendChild( dt );
		dl.appendChild( dd );

	}

}

function initInfoPage() {

	var page = new CV.Page( frame, "icon_info" );

	page.addHeader( "Information" );
	
	var p = document.createElement( "p" );

	p.textContent = "CV.Viewer - a work in progress 3d cave viewer for Survex (.3d) and Therion (.lox) models.";
	page.appendChild( p );

	p = document.createElement( "p" );

	p.textContent = "Requires a browser supporting WebGL (IE 11+ and most other recent browsers), no plugins required. Created using the THREE.js 3D library and chroma,js colour handling library.";
	page.appendChild( p );

}

function initSettingsPage () {

	var legShadingModesActive     = Object.assign( {}, legShadingModes );
	var terrainShadingModesActive = Object.assign( {}, terrainShadingModes );

	if ( viewState.hasTerrain ) legShadingModesActive.depth = CV.SHADING_DEPTH;

	var page = new CV.Page( frame, "icon_settings" );

	page.addHeader( "Survey" );

	page.addSelect( "File", caveList, guiState, "file" );

	page.addHeader( "View" );

	page.addSelect( "Camera Type", cameraModes, viewState, "cameraType" );
	page.addSelect( "View",        cameraViews, viewState, "view" );

	page.addHeader( "Shading" );

	page.addSelect( "Underground Legs", legShadingModesActive, viewState, "shadingMode" );

	if ( viewState.hasSurfaceLegs ) {

		page.addSelect( "Surface Legs", surfaceShadingModes, viewState, "surfaceShading" );

	}

	if ( viewState.hasTerrain ) {

		var overlays = viewState.terrainOverlays;

		if ( overlays.length > 0 ) terrainShadingModesActive[ "map overlay" ] = CV.SHADING_OVERLAY;

		page.addSelect( "Terrain", terrainShadingModesActive, viewState, "terrainShading" );

		if ( overlays.length > 1 ) page.addSelect( "Overlay", overlays, viewState, "terrainOverlay" );

	}

	page.addHeader( "WIP" );

	page.addRange( "Vertical scaling", viewState, "zScale" );

	if ( viewState.hasTerrain ) page.addRange( "Terrain opacity", viewState, "terrainOpacity" );

	page.addHeader( "Visibility" );

	if ( viewState.hasEntrances )    page.addCheckbox( "Entrances",     viewState, "entrances" );
	if ( viewState.hasScraps )       page.addCheckbox( "Scraps",        viewState, "scraps" );
	if ( viewState.hasSplays )       page.addCheckbox( "Splay Legs",    viewState, "splays" );
	if ( viewState.hasSurfaceLegs )  page.addCheckbox( "Surface Legs",  viewState, "surfaceLegs" );
	if ( viewState.hasTerrain )      page.addCheckbox( "Terrain",       viewState, "terrain" );
	if ( viewState.hasWalls )        page.addCheckbox( "Walls (LRUD)",  viewState, "walls" );
	if ( viewState.hasHUD )          page.addCheckbox( "Indicators",    viewState, "HUD" );

	page.addCheckbox( "Bounding Box", viewState, "box" );

}

function initUI () {

	CV.Page.reset();

	// create UI side panel and reveal tabs
	frame = document.createElement( "div" );

	frame.id = "frame";

	// close button

	var close = document.createElement( "div" );

	close.id = "close";

	close.addEventListener( "click", closeFrame );

	frame.appendChild( close );

	initSettingsPage();
	initSelectionPage();
	initInfoPage();
	initHelpPage();

	frame.style.display = "block";
	container.appendChild( frame );

}

function handleDragover ( event ) {

	event.preventDefault();
	event.dataTransfer.dropEffect = "copy";

}

function handleDrop ( event ) {

	var dt = event.dataTransfer;

	event.preventDefault();

	for ( var i = 0; i < dt.files.length; i++ ) {

		var file = dt.files[ i ];

		if ( i === 0 ) {

			loadCaveLocalFile( file );

		} else {

			// FIXME load other drag and drop into local file list or ignore??
		}

	}

}

function resetGUI () {

	if ( isCaveLoaded ) {

		isCaveLoaded = false;
		frame.addEventListener( "transitionend", afterReset );
		frame.classList.remove( "onscreen" );

		surveyTree  = null;

	}

}

function afterReset () {

	frame.removeEventListener( "transitionend", afterReset );

	if ( !isCaveLoaded ) {

		if ( frame !== undefined ) container.removeChild( frame );

	}

}

function loadCaveList ( list ) {

	caveList = list;
	nextCave();

}

function nextCave () {

	//cycle through caves in list provided
	if ( caveList.length === 0 ) return false;

	if ( ++caveIndex >= caveList.length ) caveIndex = 0;

	guiState.file = caveList[ caveIndex ];

}

function loadCave ( file ) {

	resetGUI();
	CV.Viewer.clearView();

	progressBar.Start( "Loading file " + file + " ..." );

	caveLoader.loadURL( "/surveys/" + file );

}

function loadCaveLocalFile ( file ) {

	resetGUI();
	CV.Viewer.clearView();

	progressBar.Start( "Loading file " + file.name + " ..." );

	caveLoader.loadFile( file );

}

function progress ( pcent ) {

	progressBar.Update( pcent );

}

function caveLoaded ( inCave ) { 

	cave = inCave;

	// slight delay to allow repaint to display 100%.
	setTimeout( _delayedTasks1, 100 );

	function _delayedTasks1 () {

		progressBar.End();
		progressBar.Start( "Rendering..." );

		setTimeout( _delayedTasks2, 100 );

	}

	function _delayedTasks2 () {

		CV.Viewer.loadCave( cave );
		progressBar.End();

		// viewComplete executed as "newCave"" event handler
	}

}

function viewComplete () {

	// display shading mode and initialize

	viewState.shadingMode = CV.SHADING_HEIGHT;

	surveyTree = CV.Viewer.getSurveyTree();
	isCaveLoaded = true;

	// drop reference to cave to free heap space
	cave = null;

	initUI();

}

function shadingModeChanged () {

	var stats = CV.Viewer.getStats();

}

function keyDown ( event ) {

	if ( !isCaveLoaded ) return;

	switch ( event.keyCode ) {

	case 49: // change colouring scheme to depth - '1'

		viewState.shadingMode = CV.SHADING_HEIGHT;

		break;

	case 50: // change colouring scheme to angle - '2'

		viewState.shadingMode = CV.SHADING_INCLINATION;

		break;

	case 51: // change colouring scheme to length - '3'

		viewState.shadingMode = CV.SHADING_LENGTH;

		break;

	case 52: // change colouring scheme to height cursor - '4'

		viewState.shadingMode = CV.SHADING_CURSOR;

		break;

	case 53: // change colouring scheme to white - '5'

		viewState.shadingMode = CV.SHADING_SINGLE;

		break;

	case 54: // change colouring scheme to per survey section - '6'

		viewState.shadingMode = CV.SHADING_SURVEY;

		break;

	case 55: // change colouring scheme to per survey section - 'y'

		viewState.shadingMode = CV.SHADING_DEPTH;

		break;

	case 67: // toggle scraps visibility - 'c'

		if ( viewState.hasScraps ) viewState.scraps = !viewState.scraps;

		break;

	case 76: //toggle entrance labels - 'l'

		if ( viewState.hasEntrances ) viewState.entrances = !viewState.entrances;

		break;

	case 78: // load next cave in list - 'n'

		nextCave();

		break;

	case 79: //switch view to orthoganal - 'o'

		viewState.cameraType = CV.CAMERA_ORTHOGRAPHIC;

		break;

	case 80: // switch view to perspective -'p'

		viewState.cameraType = CV.CAMERA_PERSPECTIVE;

		break;

	case 81: // switch view to perspective -'q'

		if ( viewState.hasSplays ) viewState.splays = !viewState.splays;

		break;

	case 82: // reset camera positions and settings to initial plan view -'r'

		viewState.view = CV.VIEW_PLAN;

		break;

	case 83: // switch view to perspective -'s'

		if ( viewState.hasSurfaceLegs ) viewState.surfaceLegs = !viewState.surfaceLegs;

		break;

	case 84: // switch terrain on/off 't'

		if ( viewState.hasTerrain ) viewState.terrain = !viewState.terrain;

		break;

	case 85: // switch terrain on/off 'u'

		if ( viewState.hasTerrain ) viewState.terrainShading = CV.SHADING_PW;

		break;

	case 86: // cut selected survey section 'v'  

		resetGUI();
		viewState.cut = true;

		break;

	case 87: // switch walls on/off 'w'

		if ( viewState.hasWalls ) viewState.walls = !viewState.walls;

		break;

	case 88: // switch walls on/off 'x'

		viewState.test = 8;

		break;

	case 107: // increase cursor depth - '+' (keypad)
	case 219: // '[' key 

		viewState.cursorHeight++;

		break;

	case 109: // decrease cursor depth - '-' (keypad)
	case 221: // ']' key

		viewState.cursorHeight--;

		break;

	case 190: // look ast last POI - '.'

		viewState.setPOI = true; // actual value here is ignored.

		break;
	}

}

// export public interface

return {
	init:         init,
	loadCave:     loadCave,
	loadCaveList: loadCaveList
};

} () );// end of UI Module

// EOF