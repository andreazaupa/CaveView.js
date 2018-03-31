let graph = require( 'rollup-plugin-graph' );
let graphOptions = {prune: true};


function glsl () {
	return {
		transform ( code, id ) {
			if ( !/\.glsl$/.test( id ) ) return;

			return 'export default ' + JSON.stringify(
				code
					.replace( /[ \t]*\/\/.*\n/g, '' )
					.replace( /[ \t]*\/\*[\s\S]*?\*\//g, '' )
					.replace( /\n{2,}/g, '\n' )
			) + ';';
		}
	};
}

export default {
	input: 'src/js/CV.js',
	output: {
		name: 'CV',
		file: 'build/CaveView/js/CaveView.js',
		format: 'umd'
	},
	plugins: [
		glsl(),
		graph(graphOptions)
	]
};

