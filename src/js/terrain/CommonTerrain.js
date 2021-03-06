
import { SHADING_RELIEF, SHADING_OVERLAY, SHADING_CONTOURS } from '../core/constants';
import { Cfg } from '../core/lib';
import { Materials } from '../materials/Materials';
import { unpackRGBA } from '../core/unpackRGBA';
import { StencilLib } from '../core/StencilLib';
import { Overlay } from './Overlay';
import { Group, Box3, Vector3 } from '../Three';

const overlays = {};

// preallocated tmp objects

const __pixelCoords = new Vector3();
const __adjust = new Vector3();

const __result = new Uint8Array( 4 );

function CommonTerrain () {

	Group.call( this );

	this.hasOverlay = false;
	this.activeOverlay = null;
	this.depthTexture = null;
	this.renderer = null;
	this.renderTarget = null;
	this.datumShift = 0;
	this.activeDatumShift = 0;
	this.terrainBase = null;
	this.terrainRange = null;
	this.isFlat = false;
	this.screenAttribution = null;
	this.terrainShadingModes = {};

	this.addEventListener( 'removed', function removeTerrain() { this.removed(); } );

}

CommonTerrain.addOverlay = function ( name, overlayProvider, container ) {

	overlays[ name ] = new Overlay( overlayProvider, container );

};

CommonTerrain.prototype = Object.create( Group.prototype );

CommonTerrain.prototype.shadingMode = SHADING_RELIEF;
CommonTerrain.prototype.opacity = 0.5;

CommonTerrain.prototype.removed = function () {};

CommonTerrain.prototype.getOpacity = function () {

	return this.opacity;

};

CommonTerrain.prototype.commonRemoved = function () {

	const activeOverlay = this.activeOverlay;

	if ( activeOverlay !== null ) activeOverlay.setInactive();

	if ( this.renderTarget !== null ) this.renderTarget.dispose();

};

CommonTerrain.prototype.checkTerrainShadingModes = function ( renderer ) {

	const terrainShadingModes = {};

	terrainShadingModes[ 'terrain.shading.height' ] = SHADING_RELIEF;

	if ( renderer.extensions.get( 'OES_standard_derivatives' ) !== null && ! this.isFlat ) {

		terrainShadingModes[ 'terrain.shading.contours' + ' (' + Cfg.themeValue( 'shading.contours.interval' ) + '\u202fm)' ] = SHADING_CONTOURS;

	}

	if ( this.isTiled ) {

		var name;

		for ( name in overlays ) {

			const overlay = overlays[ name ];

			if ( overlay.checkCoverage( this.limits, this.displayCRS, this.surveyCRS ) ) {

				overlay.active = ( this.activeOverlay === overlay );
				terrainShadingModes[ name ] = name;

			}

		}

	} else if ( this.hasOverlay ) {

		terrainShadingModes[ 'terrain.shading.overlay' ] = SHADING_OVERLAY;

	}

	this.terrainShadingModes = terrainShadingModes;

	return terrainShadingModes;

};

CommonTerrain.prototype.setShadingMode = function ( mode, renderCallback ) {

	const activeOverlay = this.activeOverlay;

	var material;
	var hideAttribution = true;

	StencilLib.featureShowThrough = true;

	var overlay = null;

	switch ( mode ) {

	case SHADING_RELIEF:

		material = Materials.getHypsometricMaterial();

		break;

	case SHADING_OVERLAY:

		this.setOverlay( renderCallback );
		hideAttribution = false;

		break;

	case SHADING_CONTOURS:

		material = Materials.getContourMaterial();
		StencilLib.featureShowThrough = false;

		break;

	default:

		overlay = overlays[ mode ];

		if ( overlay !== undefined ) {

			if ( this.isTiled && overlay.hasCoverage ) {

				this.setOverlay( overlay, renderCallback );
				hideAttribution = false;

			} else {

				// if initial setting is not valid, default to shaded relief
				material = Materials.getHypsometricMaterial();
				mode = SHADING_RELIEF;

			}

		} else {

			console.warn( 'unknown mode', mode );
			return false;

		}

	}

	if ( hideAttribution && activeOverlay !== null ) {

		activeOverlay.setInactive();

		this.activeOverlay = null;

	}

	if ( material !== undefined ) this.setMaterial( material );

	this.shadingMode = mode;

	return true;

};

CommonTerrain.prototype.setVisibility = function ( mode ) {

	if ( mode ) {

		this.showAttribution();

	} else {

		this.hideAttribution();

	}

};

CommonTerrain.prototype.showAttribution = function () {

	const attribution = this.screenAttribution;

	if ( attribution !== null ) {

		this.container.appendChild( attribution );

	}

	if ( this.activeOverlay !== null ) this.activeOverlay.showAttribution();

};

CommonTerrain.prototype.hideAttribution = function () {

	const attribution = this.screenAttribution;

	if ( attribution !== null ) {

		const parent = attribution.parentNode;

		if ( parent !== null ) parent.removeChild( attribution );


	}

	if ( this.activeOverlay !== null ) this.activeOverlay.hideAttribution();

};

CommonTerrain.prototype.applyDatumShift = function ( mode ) {

	if ( mode && this.activeDatumShift === 0 ) {

		this.translateZ( this.datumShift );
		this.activeDatumShift = this.datumShift;

	} else if ( ! mode && this.activeDatumShift !== 0 ) {

		this.translateZ( - this.datumShift );
		this.activeDatumShift = 0;

	}

	this.updateMatrix();

	this.dispatchEvent( { type: 'datumShiftChange', value: this.activeDatumShift } );

};

CommonTerrain.prototype.computeBoundingBox = function () {

	const bb = new Box3();

	this.traverse( _getBoundingBox );

	this.boundingBox = bb;

	function _getBoundingBox( obj ) {

		if ( obj.isTile ) bb.union( obj.geometry.boundingBox );

	}

	return bb;

};

CommonTerrain.prototype.addHeightMap = function ( renderer, renderTarget ) {

	this.depthTexture = renderTarget.texture;
	this.renderer = renderer;
	this.renderTarget = renderTarget;

};

CommonTerrain.prototype.getHeight = function ( point ) {

	const renderTarget = this.renderTarget;

	if ( this.terrainBase === null ) {

		if ( this.boundingBox === undefined ) this.computeBoundingBox();

		this.terrainBase = this.boundingBox.min;
		this.terrainRange = this.boundingBox.getSize( new Vector3() );

		// setup value cached

		__adjust.set( renderTarget.width, renderTarget.height, 1 ).divide( this.terrainRange );

	}

	const terrainBase = this.terrainBase;

	__pixelCoords.copy( point ).sub( terrainBase ).multiply( __adjust ).round();

	this.renderer.readRenderTargetPixels( renderTarget, __pixelCoords.x, __pixelCoords.y, 1, 1, __result );

	// convert to survey units and return

	return unpackRGBA( __result ) * this.terrainRange.z + terrainBase.z;

};

export { CommonTerrain };

// EOF