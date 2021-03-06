import {
	BufferGeometry,
	Points,
	Float32BufferAttribute,
} from '../Three';

import { ExtendedPointsMaterial } from '../materials/ExtendedPointsMaterial';

import { STATION_ENTRANCE } from '../core/constants';
import { Viewer } from '../viewer/Viewer';
import { Cfg } from '../core/lib';
import { PointIndicator } from './PointIndicator';

function onUploadDropBuffer() {

	// call back from BufferAttribute to drop JS buffers after data has been transfered to GPU
	this.array = null;

}

function Stations () {

	Points.call( this, new BufferGeometry, new ExtendedPointsMaterial() );

	this.type = 'CV.Stations';
	this.map = new Map();
	this.stationCount = 0;

	this.baseColor     = Cfg.themeColor( 'stations.default.marker' );
	this.junctionColor = Cfg.themeColor( 'stations.junctions.marker' );
	this.entranceColor = Cfg.themeColor( 'stations.entrances.marker' );

	this.pointSizes = [];
	this.vertices   = [];
	this.colors     = [];

	this.stations = [];

	this.selected = null;
	this.selectedSize = 0;
	this.sectionIdSet = null;

	const self = this;

	Viewer.addEventListener( 'change', _viewChanged );

	this.addEventListener( 'removed', _removed );

	const point = new PointIndicator( 0xff0000 );

	point.visible = false;

	this.addStatic( point );
	this.highlightPoint = point;

	function _viewChanged( event ) {

		if ( event.name === 'splays' ) {

			const splaySize = Viewer.splays ? 6.0 : 0.0;

			const stations = self.stations;
			const pSize = self.geometry.getAttribute( 'pSize' );
			const l = stations.length;
			const sectionIdSet = self.sectionIdSet;

			var i;

			for ( i = 0; i < l; i++ ) {

				const node = stations[ i ];

				if ( node.p.connections === 0 && ( sectionIdSet === null || sectionIdSet.has( node.id ) ) ) {

					pSize.setX( i, splaySize );

				}

			}

			pSize.needsUpdate = true;
			Viewer.renderView();

		}

	}

	function _removed ( ) {

		Viewer.removeEventListener( 'change', _viewChanged );

	}

}

Stations.prototype = Object.create ( Points.prototype );

Stations.prototype.addStation = function ( node ) {

	const point = node.p;

	const seen = this.map.get( point );

	if ( seen !== undefined ) {

		// console.log( 'duplicate', node.getPath(), seen.getPath() );
		return;

	}

	const connections = point.connections;

	this.vertices.push( point );


	var pointSize = 0.0;

	if ( node.type === STATION_ENTRANCE ) {

		this.colors.push( this.entranceColor );

		pointSize = 12.0;

	} else {

		this.colors.push( connections > 2 ? this.junctionColor : this.baseColor );

		pointSize = 8.0;

	}

	this.pointSizes.push( pointSize );

	this.map.set( point, node );
	this.stations.push( node );

	node.stationVertexIndex = this.stationCount++;
	node.linkedSegments = [];
	node.legs = [];
	node.distance = Infinity;

};

Stations.prototype.getStation = function ( vertex ) {

	return this.map.get( vertex );

};

Stations.prototype.getVisibleStation = function ( vertex ) {

	const node = this.map.get( vertex );
	const sectionIdSet = this.sectionIdSet;

	if (
		( sectionIdSet === null || sectionIdSet.has( node.id ) ) &&
		( node.p.connections > 0 || Viewer.splays )
	) return node;

	if ( node.label !== undefined ) node.label.visible = false;

	return null;

};

Stations.prototype.getStationByIndex = function ( index ) {

	return this.stations[ index ];

};

Stations.prototype.clearSelected = function () {

	if ( this.selected !== null ) {

		const pSize = this.geometry.getAttribute( 'pSize' );

		pSize.setX( this.selected, this.selectedSize );
		pSize.needsUpdate = true;

		this.selected = null;

	}

};

Stations.prototype.highlightStation = function ( node ) {

	const highlightPoint = this.highlightPoint;

	highlightPoint.position.copy( node.p );
	highlightPoint.updateMatrix();

	highlightPoint.visible = true;

	return node;

};

Stations.prototype.clearHighlight = function () {

	this.highlightPoint.visible = false;

};

Stations.prototype.selectStation = function ( node ) {

	this.selectStationByIndex( node.stationVertexIndex );

};

Stations.prototype.selectStationByIndex = function ( index ) {

	const pSize = this.geometry.getAttribute( 'pSize' );

	if ( this.selected !== null ) {

		pSize.setX( this.selected, this.selectedSize );

	}

	this.selectedSize = pSize.getX( index );

	pSize.setX( index, this.selectedSize * 2 );

	pSize.needsUpdate = true;

	this.selected = index;

};

Stations.prototype.selectStations = function ( sectionIdSet ) {

	const stations = this.stations;
	const l = stations.length;
	const pSize = this.geometry.getAttribute( 'pSize' );
	const splaySize = Viewer.splays ? 6.0 : 0.0;

	// track this to maintain spay settings

	this.sectionIdSet = sectionIdSet;

	var i;

	for ( i = 0; i < l; i++ ) {

		const node = stations[ i ];

		let size = 8;

		if ( sectionIdSet.size === 0 || sectionIdSet.has( node.id ) ) {

			if ( node.type === STATION_ENTRANCE ) {

				size = 12;

			} else if ( node.p.connections === 0 ) {

				size = splaySize;

			}

			pSize.setX( i , size );

		} else {

			pSize.setX( i, 0 );

			if ( node.label !== undefined ) node.label.visible = false;

		}

	}

	pSize.needsUpdate = true;

};

Stations.prototype.finalise = function () {

	const bufferGeometry = this.geometry;

	const positions = new Float32BufferAttribute(this.vertices.length * 3, 3 );
	const colors = new Float32BufferAttribute( this.colors.length * 3, 3 );

	bufferGeometry.addAttribute( 'pSize', new Float32BufferAttribute( this.pointSizes, 1 ) );
	bufferGeometry.addAttribute( 'position', positions.copyVector3sArray( this.vertices ) );
	bufferGeometry.addAttribute( 'color', colors.copyColorsArray( this.colors ) );

	bufferGeometry.getAttribute( 'color' ).onUpload( onUploadDropBuffer );

	this.pointSizes = null;
	this.colors = null;

};

Stations.prototype.resetDistances = function () {

	this.stations.forEach( function _resetDistance( node ) { node.distance = Infinity; } );

};

export { Stations };