var swaggerParser = require( 'swagger-parser' );
var fs = require( 'fs' );
var path = require( 'path' );
var mkdirp = require( './mkdirp' );
var nfcall = require( './nfcall' );
var debug = require( 'debug' )( 'edge-cli:generate' );

module.exports = GenerateController;

function GenerateController() {

}

Object.assign( GenerateController.prototype, {

  apiPolicy: function ( swagger, target ) {

    swagger = swagger || 'swagger.yaml';
    target = target || 'apiproxy';

    return swaggerParser.bundle( swagger ).then( function ( api ) {

      return create( target + '/resources/jsc/api.js',
        "// generated by edge-cli\n" +
        "if ( !context.getVariable( 'api' ) ) {\n" +
        "  context.setVariable( 'api', " + JSON.stringify( api ) + " );\n" +
        "}\n" +
        "\n" +
        "if ( context.flow === 'PROXY_RESP_FLOW' ) {\n" +
        "  context.setVariable( 'apiResponse', true );\n" +
        "  context.setVariable( 'response.header.Content-Type', 'application/json' );\n" +
        "  context.setVariable( 'response.content', JSON.stringify( context.getVariable( 'api' ) ) );\n" +
        "}\n"
      );

    } ).then( function () {

      return create( target + '/policies/api.xml',
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' +
        '<!-- generated by edge-cli -->\n' +
        '<Javascript async="false" continueOnError="false" enabled="true" timeLimit="200" name="api">\n' +
        '  <DisplayName>api</DisplayName>\n' +
        '  <Properties/>\n' +
        '  <ResourceURL>jsc://api.js</ResourceURL>\n' +
        '</Javascript>\n'
      );

    } ).then( function () {

      return { ok: true };

    } );

  }

} );

function create( pat, contents ) {
  return mkdirp( path.dirname( pat ) ).then( function () {
    return nfcall( fs.writeFile, pat, contents );
  } );
}
