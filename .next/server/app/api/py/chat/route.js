/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/py/chat/route";
exports.ids = ["app/api/py/chat/route"];
exports.modules = {

/***/ "(rsc)/./app/api/py/chat/route.ts":
/*!**********************************!*\
  !*** ./app/api/py/chat/route.ts ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/api/server.js\");\n\nasync function POST(request) {\n    try {\n        const body = await request.json();\n        const { message } = body;\n        if (!message) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                response: \"Message is required\"\n            }, {\n                status: 400\n            });\n        }\n        // Determine the Python backend URL\n        const pythonBackendUrl =  false ? 0 : \"http://127.0.0.1:8000\";\n        // Forward the request to the Python backend\n        const response = await fetch(`${pythonBackendUrl}/chat`, {\n            method: \"POST\",\n            headers: {\n                \"Content-Type\": \"application/json\"\n            },\n            body: JSON.stringify({\n                message\n            })\n        });\n        if (!response.ok) {\n            const errorText = await response.text();\n            console.error(\"Python backend error:\", response.status, errorText);\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                response: \"Sorry, the AI service is currently unavailable. Please ensure the Python backend is running.\"\n            }, {\n                status: 503\n            });\n        }\n        const data = await response.json();\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json(data);\n    } catch (error) {\n        console.error(\"Error in chat API route:\", error);\n        // Check if it's a connection error\n        if (error instanceof TypeError && error.message.includes(\"fetch\")) {\n            return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n                response: \"Cannot connect to AI service. Please ensure the Python backend is running on port 8000.\"\n            }, {\n                status: 503\n            });\n        }\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            response: \"Sorry, I encountered an error. Please try again.\"\n        }, {\n            status: 500\n        });\n    }\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9hcHAvYXBpL3B5L2NoYXQvcm91dGUudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7QUFBd0Q7QUFFakQsZUFBZUMsS0FBS0MsT0FBb0I7SUFDN0MsSUFBSTtRQUNGLE1BQU1DLE9BQU8sTUFBTUQsUUFBUUUsSUFBSTtRQUMvQixNQUFNLEVBQUVDLE9BQU8sRUFBRSxHQUFHRjtRQUVwQixJQUFJLENBQUNFLFNBQVM7WUFDWixPQUFPTCxxREFBWUEsQ0FBQ0ksSUFBSSxDQUN0QjtnQkFBRUUsVUFBVTtZQUFzQixHQUNsQztnQkFBRUMsUUFBUTtZQUFJO1FBRWxCO1FBRUEsbUNBQW1DO1FBQ25DLE1BQU1DLG1CQUNKQyxNQUFxQyxHQUNqQyxDQUFlLEdBQ2Y7UUFFTiw0Q0FBNEM7UUFDNUMsTUFBTUgsV0FBVyxNQUFNSSxNQUFNLEdBQUdGLGlCQUFpQixLQUFLLENBQUMsRUFBRTtZQUN2REcsUUFBUTtZQUNSQyxTQUFTO2dCQUNQLGdCQUFnQjtZQUNsQjtZQUNBVCxNQUFNVSxLQUFLQyxTQUFTLENBQUM7Z0JBQUVUO1lBQVE7UUFDakM7UUFFQSxJQUFJLENBQUNDLFNBQVNTLEVBQUUsRUFBRTtZQUNoQixNQUFNQyxZQUFZLE1BQU1WLFNBQVNXLElBQUk7WUFDckNDLFFBQVFDLEtBQUssQ0FBQyx5QkFBeUJiLFNBQVNDLE1BQU0sRUFBRVM7WUFDeEQsT0FBT2hCLHFEQUFZQSxDQUFDSSxJQUFJLENBQ3RCO2dCQUNFRSxVQUFVO1lBQ1osR0FDQTtnQkFBRUMsUUFBUTtZQUFJO1FBRWxCO1FBRUEsTUFBTWEsT0FBTyxNQUFNZCxTQUFTRixJQUFJO1FBQ2hDLE9BQU9KLHFEQUFZQSxDQUFDSSxJQUFJLENBQUNnQjtJQUMzQixFQUFFLE9BQU9ELE9BQU87UUFDZEQsUUFBUUMsS0FBSyxDQUFDLDRCQUE0QkE7UUFFMUMsbUNBQW1DO1FBQ25DLElBQUlBLGlCQUFpQkUsYUFBYUYsTUFBTWQsT0FBTyxDQUFDaUIsUUFBUSxDQUFDLFVBQVU7WUFDakUsT0FBT3RCLHFEQUFZQSxDQUFDSSxJQUFJLENBQ3RCO2dCQUNFRSxVQUFVO1lBQ1osR0FDQTtnQkFBRUMsUUFBUTtZQUFJO1FBRWxCO1FBRUEsT0FBT1AscURBQVlBLENBQUNJLElBQUksQ0FDdEI7WUFDRUUsVUFBVTtRQUNaLEdBQ0E7WUFBRUMsUUFBUTtRQUFJO0lBRWxCO0FBQ0YiLCJzb3VyY2VzIjpbIkM6XFxVc2Vyc1xcbGF2YW5cXERvd25sb2Fkc1xcYmFua2luZy13ZWItYXBwbGljYXRpb25cXGFwcFxcYXBpXFxweVxcY2hhdFxccm91dGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgTmV4dFJlcXVlc3QsIE5leHRSZXNwb25zZSB9IGZyb20gXCJuZXh0L3NlcnZlclwiO1xyXG5cclxuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIFBPU1QocmVxdWVzdDogTmV4dFJlcXVlc3QpIHtcclxuICB0cnkge1xyXG4gICAgY29uc3QgYm9keSA9IGF3YWl0IHJlcXVlc3QuanNvbigpO1xyXG4gICAgY29uc3QgeyBtZXNzYWdlIH0gPSBib2R5O1xyXG5cclxuICAgIGlmICghbWVzc2FnZSkge1xyXG4gICAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXHJcbiAgICAgICAgeyByZXNwb25zZTogXCJNZXNzYWdlIGlzIHJlcXVpcmVkXCIgfSxcclxuICAgICAgICB7IHN0YXR1czogNDAwIH1cclxuICAgICAgKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBEZXRlcm1pbmUgdGhlIFB5dGhvbiBiYWNrZW5kIFVSTFxyXG4gICAgY29uc3QgcHl0aG9uQmFja2VuZFVybCA9XHJcbiAgICAgIHByb2Nlc3MuZW52Lk5PREVfRU5WID09PSBcInByb2R1Y3Rpb25cIlxyXG4gICAgICAgID8gXCIvYXBpL2luZGV4LnB5XCJcclxuICAgICAgICA6IFwiaHR0cDovLzEyNy4wLjAuMTo4MDAwXCI7XHJcblxyXG4gICAgLy8gRm9yd2FyZCB0aGUgcmVxdWVzdCB0byB0aGUgUHl0aG9uIGJhY2tlbmRcclxuICAgIGNvbnN0IHJlc3BvbnNlID0gYXdhaXQgZmV0Y2goYCR7cHl0aG9uQmFja2VuZFVybH0vY2hhdGAsIHtcclxuICAgICAgbWV0aG9kOiBcIlBPU1RcIixcclxuICAgICAgaGVhZGVyczoge1xyXG4gICAgICAgIFwiQ29udGVudC1UeXBlXCI6IFwiYXBwbGljYXRpb24vanNvblwiLFxyXG4gICAgICB9LFxyXG4gICAgICBib2R5OiBKU09OLnN0cmluZ2lmeSh7IG1lc3NhZ2UgfSksXHJcbiAgICB9KTtcclxuXHJcbiAgICBpZiAoIXJlc3BvbnNlLm9rKSB7XHJcbiAgICAgIGNvbnN0IGVycm9yVGV4dCA9IGF3YWl0IHJlc3BvbnNlLnRleHQoKTtcclxuICAgICAgY29uc29sZS5lcnJvcihcIlB5dGhvbiBiYWNrZW5kIGVycm9yOlwiLCByZXNwb25zZS5zdGF0dXMsIGVycm9yVGV4dCk7XHJcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcclxuICAgICAgICB7XHJcbiAgICAgICAgICByZXNwb25zZTogXCJTb3JyeSwgdGhlIEFJIHNlcnZpY2UgaXMgY3VycmVudGx5IHVuYXZhaWxhYmxlLiBQbGVhc2UgZW5zdXJlIHRoZSBQeXRob24gYmFja2VuZCBpcyBydW5uaW5nLlwiLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgeyBzdGF0dXM6IDUwMyB9XHJcbiAgICAgICk7XHJcbiAgICB9XHJcblxyXG4gICAgY29uc3QgZGF0YSA9IGF3YWl0IHJlc3BvbnNlLmpzb24oKTtcclxuICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihkYXRhKTtcclxuICB9IGNhdGNoIChlcnJvcikge1xyXG4gICAgY29uc29sZS5lcnJvcihcIkVycm9yIGluIGNoYXQgQVBJIHJvdXRlOlwiLCBlcnJvcik7XHJcbiAgICBcclxuICAgIC8vIENoZWNrIGlmIGl0J3MgYSBjb25uZWN0aW9uIGVycm9yXHJcbiAgICBpZiAoZXJyb3IgaW5zdGFuY2VvZiBUeXBlRXJyb3IgJiYgZXJyb3IubWVzc2FnZS5pbmNsdWRlcyhcImZldGNoXCIpKSB7XHJcbiAgICAgIHJldHVybiBOZXh0UmVzcG9uc2UuanNvbihcclxuICAgICAgICB7XHJcbiAgICAgICAgICByZXNwb25zZTogXCJDYW5ub3QgY29ubmVjdCB0byBBSSBzZXJ2aWNlLiBQbGVhc2UgZW5zdXJlIHRoZSBQeXRob24gYmFja2VuZCBpcyBydW5uaW5nIG9uIHBvcnQgODAwMC5cIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIHsgc3RhdHVzOiA1MDMgfVxyXG4gICAgICApO1xyXG4gICAgfVxyXG4gICAgXHJcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oXHJcbiAgICAgIHtcclxuICAgICAgICByZXNwb25zZTogXCJTb3JyeSwgSSBlbmNvdW50ZXJlZCBhbiBlcnJvci4gUGxlYXNlIHRyeSBhZ2Fpbi5cIixcclxuICAgICAgfSxcclxuICAgICAgeyBzdGF0dXM6IDUwMCB9XHJcbiAgICApO1xyXG4gIH1cclxufVxyXG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiUE9TVCIsInJlcXVlc3QiLCJib2R5IiwianNvbiIsIm1lc3NhZ2UiLCJyZXNwb25zZSIsInN0YXR1cyIsInB5dGhvbkJhY2tlbmRVcmwiLCJwcm9jZXNzIiwiZmV0Y2giLCJtZXRob2QiLCJoZWFkZXJzIiwiSlNPTiIsInN0cmluZ2lmeSIsIm9rIiwiZXJyb3JUZXh0IiwidGV4dCIsImNvbnNvbGUiLCJlcnJvciIsImRhdGEiLCJUeXBlRXJyb3IiLCJpbmNsdWRlcyJdLCJpZ25vcmVMaXN0IjpbXSwic291cmNlUm9vdCI6IiJ9\n//# sourceURL=webpack-internal:///(rsc)/./app/api/py/chat/route.ts\n");

/***/ }),

/***/ "(rsc)/./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fpy%2Fchat%2Froute&page=%2Fapi%2Fpy%2Fchat%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fpy%2Fchat%2Froute.ts&appDir=C%3A%5CUsers%5Clavan%5CDownloads%5Cbanking-web-application%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Clavan%5CDownloads%5Cbanking-web-application&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fpy%2Fchat%2Froute&page=%2Fapi%2Fpy%2Fchat%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fpy%2Fchat%2Froute.ts&appDir=C%3A%5CUsers%5Clavan%5CDownloads%5Cbanking-web-application%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Clavan%5CDownloads%5Cbanking-web-application&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_Users_lavan_Downloads_banking_web_application_app_api_py_chat_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./app/api/py/chat/route.ts */ \"(rsc)/./app/api/py/chat/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/py/chat/route\",\n        pathname: \"/api/py/chat\",\n        filename: \"route\",\n        bundlePath: \"app/api/py/chat/route\"\n    },\n    resolvedPagePath: \"C:\\\\Users\\\\lavan\\\\Downloads\\\\banking-web-application\\\\app\\\\api\\\\py\\\\chat\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_Users_lavan_Downloads_banking_web_application_app_api_py_chat_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvLnBucG0vbmV4dEAxNS4yLjZfcmVhY3QtZG9tQDE5LjAuMF9yZWFjdEAxOS4wLjBfX3JlYWN0QDE5LjAuMC9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZweSUyRmNoYXQlMkZyb3V0ZSZwYWdlPSUyRmFwaSUyRnB5JTJGY2hhdCUyRnJvdXRlJmFwcFBhdGhzPSZwYWdlUGF0aD1wcml2YXRlLW5leHQtYXBwLWRpciUyRmFwaSUyRnB5JTJGY2hhdCUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDVXNlcnMlNUNsYXZhbiU1Q0Rvd25sb2FkcyU1Q2Jhbmtpbmctd2ViLWFwcGxpY2F0aW9uJTVDYXBwJnBhZ2VFeHRlbnNpb25zPXRzeCZwYWdlRXh0ZW5zaW9ucz10cyZwYWdlRXh0ZW5zaW9ucz1qc3gmcGFnZUV4dGVuc2lvbnM9anMmcm9vdERpcj1DJTNBJTVDVXNlcnMlNUNsYXZhbiU1Q0Rvd25sb2FkcyU1Q2Jhbmtpbmctd2ViLWFwcGxpY2F0aW9uJmlzRGV2PXRydWUmdHNjb25maWdQYXRoPXRzY29uZmlnLmpzb24mYmFzZVBhdGg9JmFzc2V0UHJlZml4PSZuZXh0Q29uZmlnT3V0cHV0PSZwcmVmZXJyZWRSZWdpb249Jm1pZGRsZXdhcmVDb25maWc9ZTMwJTNEISIsIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7OztBQUErRjtBQUN2QztBQUNxQjtBQUNrQztBQUMvRztBQUNBO0FBQ0E7QUFDQSx3QkFBd0IseUdBQW1CO0FBQzNDO0FBQ0EsY0FBYyxrRUFBUztBQUN2QjtBQUNBO0FBQ0E7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUNBO0FBQ0EsWUFBWTtBQUNaLENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQSxRQUFRLHNEQUFzRDtBQUM5RDtBQUNBLFdBQVcsNEVBQVc7QUFDdEI7QUFDQTtBQUNBLEtBQUs7QUFDTDtBQUMwRjs7QUFFMUYiLCJzb3VyY2VzIjpbIiJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBBcHBSb3V0ZVJvdXRlTW9kdWxlIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUtbW9kdWxlcy9hcHAtcm91dGUvbW9kdWxlLmNvbXBpbGVkXCI7XG5pbXBvcnQgeyBSb3V0ZUtpbmQgfSBmcm9tIFwibmV4dC9kaXN0L3NlcnZlci9yb3V0ZS1raW5kXCI7XG5pbXBvcnQgeyBwYXRjaEZldGNoIGFzIF9wYXRjaEZldGNoIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvbGliL3BhdGNoLWZldGNoXCI7XG5pbXBvcnQgKiBhcyB1c2VybGFuZCBmcm9tIFwiQzpcXFxcVXNlcnNcXFxcbGF2YW5cXFxcRG93bmxvYWRzXFxcXGJhbmtpbmctd2ViLWFwcGxpY2F0aW9uXFxcXGFwcFxcXFxhcGlcXFxccHlcXFxcY2hhdFxcXFxyb3V0ZS50c1wiO1xuLy8gV2UgaW5qZWN0IHRoZSBuZXh0Q29uZmlnT3V0cHV0IGhlcmUgc28gdGhhdCB3ZSBjYW4gdXNlIHRoZW0gaW4gdGhlIHJvdXRlXG4vLyBtb2R1bGUuXG5jb25zdCBuZXh0Q29uZmlnT3V0cHV0ID0gXCJcIlxuY29uc3Qgcm91dGVNb2R1bGUgPSBuZXcgQXBwUm91dGVSb3V0ZU1vZHVsZSh7XG4gICAgZGVmaW5pdGlvbjoge1xuICAgICAgICBraW5kOiBSb3V0ZUtpbmQuQVBQX1JPVVRFLFxuICAgICAgICBwYWdlOiBcIi9hcGkvcHkvY2hhdC9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL3B5L2NoYXRcIixcbiAgICAgICAgZmlsZW5hbWU6IFwicm91dGVcIixcbiAgICAgICAgYnVuZGxlUGF0aDogXCJhcHAvYXBpL3B5L2NoYXQvcm91dGVcIlxuICAgIH0sXG4gICAgcmVzb2x2ZWRQYWdlUGF0aDogXCJDOlxcXFxVc2Vyc1xcXFxsYXZhblxcXFxEb3dubG9hZHNcXFxcYmFua2luZy13ZWItYXBwbGljYXRpb25cXFxcYXBwXFxcXGFwaVxcXFxweVxcXFxjaGF0XFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fpy%2Fchat%2Froute&page=%2Fapi%2Fpy%2Fchat%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fpy%2Fchat%2Froute.ts&appDir=C%3A%5CUsers%5Clavan%5CDownloads%5Cbanking-web-application%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Clavan%5CDownloads%5Cbanking-web-application&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!*********************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \*********************************************************************************************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!*********************************************************************************************************************************************************************************!*\
  !*** ./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \*********************************************************************************************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0"], () => (__webpack_exec__("(rsc)/./node_modules/.pnpm/next@15.2.6_react-dom@19.0.0_react@19.0.0__react@19.0.0/node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fpy%2Fchat%2Froute&page=%2Fapi%2Fpy%2Fchat%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fpy%2Fchat%2Froute.ts&appDir=C%3A%5CUsers%5Clavan%5CDownloads%5Cbanking-web-application%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5CUsers%5Clavan%5CDownloads%5Cbanking-web-application&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();