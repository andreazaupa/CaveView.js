
import { CursorMaterial } from './CursorMaterial';
import { ClusterMaterial } from './ClusterMaterial';
import { ContourMaterial } from './ContourMaterial';
import { DepthMaterial } from './DepthMaterial';
import { DepthCursorMaterial } from './DepthCursorMaterial';
import { DepthMapMaterial } from './DepthMapMaterial';
import { HeightMaterial } from './HeightMaterial';
import { HypsometricMaterial } from './HypsometricMaterial';
import { GlyphMaterial } from './GlyphMaterial';
import { GlyphString } from '../core/GlyphString';
import { MaterialFog } from './MaterialFog';

import { LineBasicMaterial, MeshLambertMaterial, NoColors, VertexColors } from '../Three';

const cache = new Map();

var cursorMaterials = [];

var depthMaterials = [];
var perSurveyMaterials = {};

var viewer;
var survey;

function cacheMaterial ( name, material ) {

	cache.set( name, material );

	return material;

}
function cacheSurveyMaterial ( name, material ) {

	cache.set( name, material );
	perSurveyMaterials[ name ] = material;

	return material;

}

function updateMaterialCursor ( material ) {

	viewer.initCursorHeight = material.setCursor( viewer.cursorHeight );

}

function updateCursors( /* event */ ) {

	cursorMaterials.forEach( updateMaterialCursor );

}

function updateDatumShifts( event ) {

	const datumShift = event.value;

	depthMaterials.forEach( _updateMaterialDepth );

	function _updateMaterialDepth ( material ) {

		material.setDatumShift( datumShift );

	}

}


function getHeightMaterial ( type ) {

	const name = 'height' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( name, new HeightMaterial( type, survey ) );

	}

	return material;

}

function getHypsometricMaterial () {

	const name = 'hypsometric';

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( name, new HypsometricMaterial( survey ) );

	}

	return material;

}

function getDepthMapMaterial ( terrain ) {

	return new DepthMapMaterial( terrain );

}

function getDepthMaterial ( type ) {

	const name = 'depth' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( name, new DepthMaterial( type, survey ) );

		depthMaterials.push( material );

	}

	return material;

}

function getCursorMaterial ( type ) {

	const name = 'cursor' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( name, new CursorMaterial( type, survey ) );

	}

	// restore current cursor

	viewer.initCursorHeight = material.getCursor();

	// set active cursor material for updating

	cursorMaterials[ type ] = material;

	return material;

}

function getDepthCursorMaterial( type ) {

	const name = 'depthCursor' + type;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( name, new DepthCursorMaterial( type, survey ) );

		depthMaterials.push( material );

	}

	// restore current cursor

	viewer.initCursorHeight = material.getCursor();

	// set active cursor material for updating

	cursorMaterials[ type ] = material;

	return material;

}

function getSurfaceMaterial ( color ) {

	const name = 'surface' + color;
	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheMaterial( name, new MeshLambertMaterial( { color: color, vertexColors: NoColors } ) );

	}

	return material;

}

function getLineMaterial () {

	var material = cache.get( 'line' );

	if ( material === undefined ) {

		material = cacheMaterial( 'line', new LineBasicMaterial( { color: 0xffffff, vertexColors: VertexColors } ) );

	}

	return material;

}

function getContourMaterial () {

	var material = cache.get( 'contour' );

	if ( material === undefined ) {

		material = cacheSurveyMaterial( 'contour', new ContourMaterial( survey ) );

		depthMaterials.push( material );

	}

	return material;

}

function getGlyphMaterial ( glyphAtlasSpec, rotation ) {

	const name = JSON.stringify( glyphAtlasSpec ) + ':' + rotation.toString();

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheMaterial( name, new GlyphMaterial( glyphAtlasSpec, rotation, viewer ) );

	}

	return material;

}

function getClusterMaterial ( count ) {

	const name = 'cluster' + count;

	var material = cache.get( name );

	if ( material === undefined ) {

		material = cacheMaterial( name, new ClusterMaterial( count ) );

	}

	return material;

}

function setTerrain( terrain ) {

	terrain.addEventListener( 'datumShiftChange', updateDatumShifts );

}

function initCache ( Viewer ) {

	cache.clear();

	viewer = Viewer;

	viewer.addEventListener( 'cursorChange', updateCursors );

}

function flushCache( surveyIn ) {

	var name;

	for ( name in perSurveyMaterials ) {

		const material = perSurveyMaterials[ name ];

		material.dispose( viewer );
		cache.delete( name );

	}

	depthMaterials = [];
	perSurveyMaterials = {};
	GlyphString.cache = new Map();

	survey = surveyIn;

}

function setFog( enable ) {

	MaterialFog.uniforms.fogEnabled.value = enable ? 1 : 0;

	return;

}

export const Materials = {
	getContourMaterial:     getContourMaterial,
	getHeightMaterial:      getHeightMaterial,
	getHypsometricMaterial: getHypsometricMaterial,
	getDepthMapMaterial:    getDepthMapMaterial,
	getDepthMaterial:       getDepthMaterial,
	getDepthCursorMaterial: getDepthCursorMaterial,
	getClusterMaterial:     getClusterMaterial,
	getCursorMaterial:      getCursorMaterial,
	getSurfaceMaterial:     getSurfaceMaterial,
	getLineMaterial:        getLineMaterial,
	getGlyphMaterial:       getGlyphMaterial,
	setTerrain:             setTerrain,
	initCache:              initCache,
	flushCache:             flushCache,
	setFog:                 setFog
};

// EOF