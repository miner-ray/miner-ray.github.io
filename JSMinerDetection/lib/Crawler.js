"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var puppeteer_1 = __importDefault(require("puppeteer"));
var fs_1 = require("fs");
var util_1 = require("util");
var path_1 = require("path");
var v1_1 = __importDefault(require("uuid/v1"));
var rmdirAsync = util_1.promisify(fs_1.rmdir);
var preloadFile = fs_1.readFileSync(path_1.join(__dirname, './instrumentationCode.js'), 'utf8');
var Crawler = /** @class */ (function () {
    function Crawler(url) {
        this.browser = undefined;
        this.webAssemblyWorkers = []; //Holds the JSHandles of the instrumentation objects used to store tarces in WebWorkers
        this.allJSONOfRecordedWorkers = []; //Holds the JSONed versions of the instrumentation objects
        this.capturedRequests = {};
        this.currentURL = '';
        this.userDataDirPath = '';
        this.currentURL = url;
    }
    Crawler.prototype.getBrowser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var userDataDir, chromeArgs, browser;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.browser != null) {
                            return [2 /*return*/, this.browser];
                        }
                        userDataDir = v1_1.default().split('-')[0];
                        this.userDataDirPath = userDataDir;
                        chromeArgs = [
                            '--disable-background-timer-throttling',
                            '--disable-backgrounding-occluded-windows',
                            '--disable-renderer-backgrounding',
                            '--disable-gpu',
                            '--no-sandox',
                            '--autoplay-policy="No user gesture is required"'
                        ];
                        return [4 /*yield*/, puppeteer_1.default.launch({
                                userDataDir: userDataDir,
                                // args: chromeArgs,
                                dumpio: true,
                                headless: false,
                                devtools: true,
                            })];
                    case 1:
                        browser = _a.sent();
                        this.browser = browser;
                        return [2 /*return*/, this.browser];
                }
            });
        });
    };
    Crawler.prototype.getPage = function () {
        return __awaiter(this, void 0, void 0, function () {
            var browser, page;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getBrowser()];
                    case 1:
                        browser = _a.sent();
                        return [4 /*yield*/, browser.newPage()];
                    case 2:
                        page = _a.sent();
                        return [4 /*yield*/, page.setRequestInterception(true)];
                    case 3:
                        _a.sent();
                        page.on('request', function (interceptedRequest) {
                            var requestURL = interceptedRequest.url();
                            var resourceType = interceptedRequest.resourceType();
                            if (resourceType == 'script' ||
                                resourceType == 'document') {
                                _this.capturedRequests[_this.currentURL].push(requestURL);
                            }
                            interceptedRequest.continue();
                        });
                        page.evaluateOnNewDocument(preloadFile);
                        page.on('workercreated', function (worker) { return __awaiter(_this, void 0, void 0, function () {
                            var currentWorkerWebAssembly, err_1;
                            var _this = this;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        console.log('Worker created: ' + worker.url());
                                        return [4 /*yield*/, worker.evaluate(preloadFile)];
                                    case 1:
                                        _a.sent();
                                        _a.label = 2;
                                    case 2:
                                        _a.trys.push([2, 5, , 6]);
                                        return [4 /*yield*/, worker.evaluate(function () {
                                                setTimeout(function () {
                                                    console.log(self);
                                                }, 1000);
                                            })];
                                    case 3:
                                        _a.sent();
                                        setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                                            var workerObject, error_1;
                                            return __generator(this, function (_a) {
                                                switch (_a.label) {
                                                    case 0:
                                                        _a.trys.push([0, 3, , 4]);
                                                        return [4 /*yield*/, worker.evaluateHandle(function () {
                                                                return self.WebAssemblyCallLocations;
                                                            })];
                                                    case 1: return [4 /*yield*/, (_a.sent()).jsonValue()];
                                                    case 2:
                                                        workerObject = _a.sent();
                                                        this.allJSONOfRecordedWorkers.push(workerObject);
                                                        return [3 /*break*/, 4];
                                                    case 3:
                                                        error_1 = _a.sent();
                                                        console.log(error_1);
                                                        return [3 /*break*/, 4];
                                                    case 4: return [2 /*return*/];
                                                }
                                            });
                                        }); }, 2010);
                                        return [4 /*yield*/, worker.evaluateHandle(function () {
                                                return self.WebAssemblyCallLocations;
                                            })];
                                    case 4:
                                        currentWorkerWebAssembly = _a.sent();
                                        this.webAssemblyWorkers.push(currentWorkerWebAssembly);
                                        return [3 /*break*/, 6];
                                    case 5:
                                        err_1 = _a.sent();
                                        console.error('Worker Eval', err_1);
                                        return [3 /*break*/, 6];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); });
                        return [2 /*return*/, page];
                }
            });
        });
    };
    Crawler.prototype.closeBrowser = function () {
        return __awaiter(this, void 0, void 0, function () {
            var e_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.browser != null)) return [3 /*break*/, 2];
                        return [4 /*yield*/, this.browser.close()];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        // @ts-ignore
                        return [4 /*yield*/, rmdirAsync(this.userDataDirPath, {
                                recursive: true
                            })];
                    case 3:
                        // @ts-ignore
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        e_1 = _a.sent();
                        console.error(e_1);
                        return [3 /*break*/, 5];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Crawler.prototype.formatStackTrace = function (stackTrace) {
        var stackTraceFrames = stackTrace.replace('Error\n ', '')
            .replace(/Object\./g, '')
            .split(/at(.*)(\(.*\))?/g)
            .filter(function (str) {
            return str !== undefined && str.match(/\S/g) != null;
        });
        var fromattedstackTraceFrames = stackTraceFrames.map(function (frame, index) {
            if (frame.includes('__puppeteer_evaluation_script__')) {
                return null;
            }
            if (frame.match(/<anonymous>:.*/)) {
                return null;
            }
            if (frame.includes('closureReturn')) {
                return null;
            }
            frame = frame.replace(/(\(.*\))/g, "");
            if (index === 0) {
                frame = frame.trim();
                frame = frame.replace(/^Object\./, '');
            }
            frame = frame.trim();
            return frame;
        })
            .filter(function (str) { return str != null; });
        return fromattedstackTraceFrames;
    };
    Crawler.prototype.formatInstrumentObject = function (webassemblyObject) {
        var _this = this;
        if (webassemblyObject.instantiate != null) {
            webassemblyObject.instantiate = webassemblyObject.instantiate.map(this.formatStackTrace);
        }
        if (webassemblyObject.instantiateStreaming != null) {
            webassemblyObject.instantiateStreaming = webassemblyObject.instantiateStreaming.map(this.formatStackTrace);
        }
        if (webassemblyObject.exportCalls != null) {
            var newObj = {};
            var _loop_1 = function (funcName) {
                var stacks = webassemblyObject.exportCalls[funcName];
                newObj[funcName] = stacks.map(function (stack) {
                    var formattedTraces = _this.formatStackTrace(stack);
                    formattedTraces.unshift(funcName);
                    return formattedTraces;
                });
            };
            for (var funcName in webassemblyObject.exportCalls) {
                _loop_1(funcName);
            }
            webassemblyObject.exportCalls = newObj;
        }
        if (webassemblyObject.importCalls != null) {
            var newObj = {};
            var _loop_2 = function (funcName) {
                var stacks = webassemblyObject.importCalls[funcName];
                newObj[funcName] = stacks.map(function (stack) {
                    var formattedTraces = _this.formatStackTrace(stack);
                    formattedTraces.unshift(funcName);
                    return formattedTraces;
                });
            };
            for (var funcName in webassemblyObject.importCalls) {
                _loop_2(funcName);
            }
            webassemblyObject.importCalls = newObj;
        }
    };
    Crawler.prototype.main = function () {
        return __awaiter(this, void 0, void 0, function () {
            var page, windowWebAssemblyHandle, windowWebSocketHandle, finish, pageTimer;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPage()];
                    case 1:
                        page = _a.sent();
                        this.capturedRequests[this.currentURL] = [];
                        windowWebAssemblyHandle = null;
                        windowWebSocketHandle = null;
                        finish = function () { return __awaiter(_this, void 0, void 0, function () {
                            var e_2, workerWebAssemblyJson, _i, _a, x, workerObject, error_2;
                            var _b;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 5, , 6]);
                                        return [4 /*yield*/, page.evaluateHandle(function () { return window.WebAssemblyCallLocations; })];
                                    case 1: return [4 /*yield*/, (_c.sent()).jsonValue()];
                                    case 2:
                                        windowWebAssemblyHandle = _c.sent();
                                        return [4 /*yield*/, page.evaluateHandle(function () { return self.WebSocketCallLocations; })];
                                    case 3: return [4 /*yield*/, (_c.sent()).jsonValue()];
                                    case 4:
                                        windowWebSocketHandle = _c.sent();
                                        return [3 /*break*/, 6];
                                    case 5:
                                        e_2 = _c.sent();
                                        console.error(e_2);
                                        return [3 /*break*/, 6];
                                    case 6:
                                        if (!(this.webAssemblyWorkers.length > 0)) return [3 /*break*/, 13];
                                        _c.label = 7;
                                    case 7:
                                        _c.trys.push([7, 12, , 13]);
                                        workerWebAssemblyJson = [];
                                        _i = 0, _a = this.webAssemblyWorkers;
                                        _c.label = 8;
                                    case 8:
                                        if (!(_i < _a.length)) return [3 /*break*/, 11];
                                        x = _a[_i];
                                        return [4 /*yield*/, x.jsonValue()];
                                    case 9:
                                        workerObject = _c.sent();
                                        workerWebAssemblyJson.push(workerObject);
                                        _c.label = 10;
                                    case 10:
                                        _i++;
                                        return [3 /*break*/, 8];
                                    case 11:
                                        (_b = this.allJSONOfRecordedWorkers).push.apply(_b, workerWebAssemblyJson);
                                        return [3 /*break*/, 13];
                                    case 12:
                                        error_2 = _c.sent();
                                        console.error(error_2);
                                        return [3 /*break*/, 13];
                                    case 13: return [2 /*return*/];
                                }
                            });
                        }); };
                        pageTimer = setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                            var e_3;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 4, 5, 6]);
                                        return [4 /*yield*/, finish()];
                                    case 1:
                                        _a.sent();
                                        return [4 /*yield*/, page.close()];
                                    case 2:
                                        _a.sent();
                                        return [4 /*yield*/, this.closeBrowser()];
                                    case 3:
                                        _a.sent();
                                        return [3 /*break*/, 6];
                                    case 4:
                                        e_3 = _a.sent();
                                        console.error(e_3);
                                        return [3 /*break*/, 6];
                                    case 5: return [7 /*endfinally*/];
                                    case 6: return [2 /*return*/];
                                }
                            });
                        }); }, 30 * 1000);
                        return [4 /*yield*/, page.goto(this.currentURL, {
                                waitUntil: 'load'
                            })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, page.waitFor(10 * 1000)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, finish()];
                    case 4:
                        _a.sent();
                        clearTimeout(pageTimer);
                        return [4 /*yield*/, page.close()];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, this.closeBrowser()];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, {
                                requests: this.capturedRequests[this.currentURL],
                                instrumentation: {
                                    window: windowWebAssemblyHandle,
                                    websocket: windowWebSocketHandle,
                                    workers: this.allJSONOfRecordedWorkers
                                }
                            }];
                }
            });
        });
    };
    return Crawler;
}());
exports.default = Crawler;
//# sourceMappingURL=Crawler.js.map