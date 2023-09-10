# @ewsjs/xhr
renaming ews-javascript-api-auth to @ewsjs/xhr

other related libs will also move to @ewsjs scope/org

> 1.3.0 brings several changes, new api and proxy support. this is also re-written using popular `request` package

## 2.0.0
* Removed deprecated xhr apis (`cookieAuthXhrApi`, `ntlmAuthXhrApi`, `proxySupportedXhrApi`).
* removed dependency on `request`, `bluebird` and `fetch`.

## 1.5.0 
#15 use pre-call options in stream

# Install

`npm install @ewsjs/xhr --save`

# How To
> public methods `useProxy`, `useNtlmAuthentication` and `useCookieAuthentication` returns the instance for chaining.


```ts
// import 
import { ......,  ConfigurationApi } from "ews-javascript-api";
import { XhrApi } from "@ewsjs/xhr";

// create instance
let xhr = new XhrApi({ headers: { 'custom-header': 'value' }, rejectUnauthorized: false})
    .useCookieAuthentication(credentials.userName, credentials.password)
    .useProxy("http://squidorOtherProxyServer:3128", "proxyUser", "password");

// alternatively 
let xhr = new XhrApi({ headers: { 'custom-header': 'value' }, rejectUnauthorized: false});
xhr.useCookieAuthentication(credentials.userName, credentials.password);
xhr.useProxy("http://squidorOtherProxyServer:3128", "proxyUser", "password");

// use in ews-javascript-api
ConfigurationApi.ConfigureXHR(xhr);
```


## constructor
```ts
/**
 * Creates an instance of XhrApi optionally passing options for request
 * @memberof XhrApi
 */
new XhrApi();
/**
 * Creates an instance of XhrApi optionally passing options for request
 * @param {CoreOptions} requestOptions Options for request
 * @memberof XhrApi
 */
new XhrApi(requestOptions: CoreOptions); // CoreOptions is from @types/request, part of request pkg
/**
 * Creates an instance of XhrApi. optionally pass true to bypass remote ssl/tls certificate check
 * @param {boolean} allowUntrustedCertificate whether to allow non trusted certificate or not
 * @memberof XhrApi
 */
new XhrApi(allowUntrustedCertificate: boolean);
```

## Proxy server support
```ts
import { XhrApi } from "@ewsjs/xhr";

// without proxy credential
let xhr = new XhrApi({ headers: { 'custom-header': 'value' }, rejectUnauthorized: false})
    .useProxy("http://squidorOtherProxyServer:3128");

// with proxy credential
let xhr = new XhrApi({ headers: { 'custom-header': 'value' }, rejectUnauthorized: false})
    .useProxy("http://squidorOtherProxyServer:3128", "proxyUser", "password");
```

## adding Ntlm authentication (or Windows Integrated Authentication with EWS)
```ts
import { XhrApi } from "@ewsjs/xhr";
let xhr = new XhrApi()
    .useNtlmAuthentication(credentials.userName, credentials.password);
```

## adding cookies authentication (usage with TMG/ISA)
```ts
import { XhrApi } from "@ewsjs/xhr";
let xhr = new XhrApi({ rejectUnauthorized: false})
    .useCookieAuthentication(credentials.userName, credentials.password);
```

### using proxy with cookies authentication
```ts
import { XhrApi } from "@ewsjs/xhr";
let xhr = new XhrApi(true)
    .useCookieAuthentication(credentials.userName, credentials.password)
    .useProxy("http://squidorOtherProxyServer:3128", "proxyUser", "password");
```

## Info: No Proxy support with Ntlm (yet!)    
There are issues which needs to be sorted out before Ntlm can be used with proxy, this situation is rarly needed in corporate environment anyways.   

## License
MIT

### 1.1.1 changes
* fixed header check to be case insensitive
* moved header helper method creation to util.js