const {XhrApi} = require('../src/');

describe('NTLM Provider Tests', function() {
    this.timeout(1000);

     it('Error in preCall response handler properly rejects promise', function (done) {
        const xhrApi = new XhrApi().useNtlmAuthentication('foo', 'bar');
        const result = xhrApi.xhr({
            type: 'GET',
            url: 'https://outlook.office365.com/EWS/Exchange.asmx',  // This will cause decodeType2Message to fail
            data: {},
            headers: {},
        }).then(function (result) {
            done(new Error('Request unexpectedly succeeed.'));
        }).catch(function (err) {
            done();
        });
    });

 });