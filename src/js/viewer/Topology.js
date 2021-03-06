
import { EventDispatcher } from '../Three';

function Topology ( metadataSource ) {

	// determine segments between junctions and entrances/passage ends and create mapping array.

	this.metadataSource = metadataSource;
	this.surveyTree = null;
	this.vertexPairToSegment = []; // maps vertex index to segment membership
	this.segmentMap = new Map(); // maps segments of survey between ends of passages and junctions.
	this.segmentToInfo = {};

	this.routes = new Map();
	this.routeNames = [];

	this.currentRoute = new Set();
	this.currentRouteName = null;
	this.adjacentSegments = new Set();
	this.maxDistance = 0;
	this.zeroStation = null;

	this.stations = null;
	this.legs = null;

	Object.defineProperty( this, 'setRoute', {
		set: function ( x ) { this.loadRoute( x ); },
		get: function () { return this.currentRouteName; }
	} );

	const routes = metadataSource.getRoutes();
	const routeNames = this.routeNames;

	var routeName;

	for ( routeName in routes ) {

		const route = routes[ routeName ];

		routeNames.push( routeName );
		this.routes.set( routeName, route.segments );

	}

	routeNames.sort();

	this.dispatchEvent( { type: 'changed', name: 'download' } );

}

Object.assign( Topology.prototype, EventDispatcher.prototype );

Topology.prototype.mapSurvey = function ( stations, legsObject, surveyTree ) {

	// determine segments between junctions and entrances/passage ends and create mapping array.
	this.surveyTree = surveyTree;
	this.stations = stations;
	this.legsObject = legsObject;

	const legs = legsObject.geometry.vertices;
	const segmentMap = this.segmentMap;
	const vertexPairToSegment = this.vertexPairToSegment;
	const segmentToInfo = this.segmentToInfo;
	const l = legs.length;

	var station;
	var newSegment = true;
	var segment = 0;
	var segmentInfo;
	var i;

	for ( i = 0; i < l; i = i + 2 ) {

		const v1 = legs[ i ];
		const v2 = legs[ i + 1 ];

		vertexPairToSegment.push( segment );

		station = stations.getStation( v1 );

		if ( station !== undefined ) {

			station.legs.push( i );
			station.linkedSegments.push( segment );

		}

		if ( newSegment ) {

			if ( station === undefined ) continue; // possible use of separator in station name.

			segmentInfo = {
				segment: segment,
				startStation: station,
				endStation: null,
			};

			newSegment = false;

		}

		station = stations.getStation( v2 );
		if ( station !== undefined ) station.legs.push( i );

		if ( station && ( v2.connections > 2 || ( i + 2 < l && ! v2.equals( legs[ i + 2 ] ) ) ) ) {

			// we have found a junction or a passage end
			segmentInfo.endStation = station;

			segmentMap.set( segmentInfo.startStation.id + ':' + station.id, segmentInfo );
			segmentToInfo[ segment ] = segmentInfo;

			station.linkedSegments.push( segment );

			segment++;

			newSegment = true;

		}

	}

	if ( ! newSegment ) {

		segmentInfo.endStation = station;

		segmentMap.set( segmentInfo.startStation.id + ':' + station.id, segmentInfo );

		station.linkedSegments.push( segment );

	}

	return this;

};

Topology.prototype.addRoute = function ( routeName ) {

	if ( routeName === this.currentRouteName || routeName === undefined ) return;

	if ( this.routeNames.indexOf( routeName ) < 0 ) {

		// create entry for empty route if a new name

		this.routeNames.push( routeName );
		this.routes.set( routeName, [] );

	}

	this.loadRoute( routeName );

};

Topology.prototype.loadRoute = function ( routeName ) {

	const self = this;

	const surveyTree = this.surveyTree;
	const currentRoute = this.currentRoute;
	const segmentMap = this.segmentMap;
	const routeSegments = this.routes.get( routeName );

	var i;

	if ( ! routeSegments ) {

		alert( 'route ' + routeName + ' does not exist' );
		return false;

	}

	currentRoute.clear();

	for ( i = 0; i < routeSegments.length; i++ ) {

		const segment = routeSegments[ i ];

		const map = segmentMap.get( surveyTree.getIdByPath( segment.start ) + ':' + surveyTree.getIdByPath( segment.end ) );

		if ( map !== undefined ) currentRoute.add( map.segment );

	}

	this.currentRouteName = routeName;

	self.dispatchEvent( { type: 'changed', name: '' } );

	return true;

};

Topology.prototype.getCurrentRoute = function () {

	return this.currentRoute;

};

Topology.prototype.saveCurrent = function () {

	const routeName = this.currentRouteName;
	const segmentMap = this.segmentMap;
	const route = this.currentRoute;

	if ( ! routeName ) return;

	const routeSegments = [];

	segmentMap.forEach( _addRoute );

	// update in memory route

	this.routes.set( routeName, routeSegments );

	// update persistant browser storage

	this.metadataSource.saveRoute( routeName, { segments: routeSegments } );

	function _addRoute ( value /*, key */ ) {

		if ( route.has( value.segment ) ) {

			routeSegments.push( {
				start: value.startStation.getPath(),
				end: value.endStation.getPath()
			} );

		}

	}

};

Topology.prototype.getRouteNames = function () {

	return this.routeNames;

};

Topology.prototype.toggleSegment = function ( index ) {

	const self = this;
	const route = this.currentRoute;
	const segment = this.vertexPairToSegment[ index / 2 ];

	this.adjacentSegments.clear();

	if ( route.has( segment ) ) {

		route.delete( segment );

	} else {

		route.add( segment );

		// handle adjacent segments to the latest segment toggled 'on'

		const segmentInfo = this.segmentToInfo[ segment ];

		if ( segmentInfo !== undefined ) {

			segmentInfo.startStation.linkedSegments.forEach( _setAdjacentSegments );
			segmentInfo.endStation.linkedSegments.forEach( _setAdjacentSegments );

		}

	}

	return;

	function _setAdjacentSegments ( segment ) {

		if ( ! route.has( segment ) ) self.adjacentSegments.add( segment );

	}

};

Topology.prototype.inCurrentRoute = function ( index ) {

	return this.currentRoute.has( this.vertexPairToSegment[ index / 2 ] );

};

Topology.prototype.adjacentToRoute = function ( index ) {

	return this.adjacentSegments.has( this.vertexPairToSegment[ index / 2 ] );

};

Topology.prototype.shortestPathSearch = function ( station ) {

	// queue of stations searched.
	const queue = [ station ];

	const legsObject = this.legsObject;
	const legs = legsObject.geometry.vertices;
	const stations = this.stations;

	stations.resetDistances();

	var maxDistance = 0;

	station.distance = 0;

	while ( queue.length > 0 ) {

		const station = queue.shift();
		const currentDistance = station.distance;
		const stationLegs = station.legs;

		// console.log( 'station:', station.getPath(), currentDistance );

		maxDistance = Math.max( maxDistance, currentDistance );

		let i;

		// find stations connected to this station
		for ( i = 0; i < stationLegs.length; i++ ) {

			const leg = stationLegs[ i ];

			const v1 = legs[ leg ];
			const v2 = legs[ leg + 1 ];

			const nextVertex = ( v1 !== station.p ) ? v1 : v2;
			const nextStation = stations.getStation( nextVertex );
			const nextLength = legsObject.legLengths[ leg / 2 ];

			// label stations with distance of shortest path
			// add to search list

			if ( nextStation.distance > currentDistance + nextLength ) {

				nextStation.distance = currentDistance + nextLength;
				queue.push( nextStation );

				// console.log( 'new next', nextStation.distance, queue.length );

			}

		}

	}

	// console.log( 'max:', maxDistance );
	this.zeroStation = station;
	this.maxDistance = maxDistance;

};

Topology.prototype.getShortestPath = function ( startStation ) {

	const zeroStation = this.zeroStation;
	const path = new Set();

	if (
		this.zeroStation === null ||
		startStation.distance === Infinity ||
		this.zeroStation === startStation ||
		startStation.distance === 0
	) return path;

	const stations = this.stations;
	const legsObject = this.legsObject;
	const legs = legsObject.geometry.vertices;

	var nextStation = startStation;
	var testNext = true;


	// for each station find station with shortest distance to zeroStation

	while ( testNext ) {

		const stationLegs = nextStation.legs;
		const l = stationLegs.length;

		let i;

		for ( i = 0; i < l; i++ ) {

			const leg = stationLegs[ i ];

			const v1 = legs[ leg ];
			const v2 = legs[ leg + 1 ];

			const nextVertex = ( v1 !== nextStation.p ) ? v1 : v2;
			const testStation = stations.getStation( nextVertex );

			if ( testStation.distance < nextStation.distance ) {

				nextStation = testStation;
				path.add( leg );

				if ( nextStation === zeroStation ) testNext = false;

			}

		}

	}

	return path;

};

export { Topology };

