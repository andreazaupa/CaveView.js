
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
	treeshake: true,
	input: 'src/js/workers/webTileWorker.js',
	output: {
		file: 'build/CaveView/js/workers/webTileWorker.js',
		format: 'umd'
	},
	plugins: [
		glsl()
	]
};
