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
var fs_1 = require("fs");
var util_1 = require("util");
var path_1 = require("path");
var https_1 = __importDefault(require("https"));
var http_1 = __importDefault(require("http"));
var mkdirAsync = util_1.promisify(fs_1.mkdir);
var Utils_1 = require("./Utils");
var Downloader = /** @class */ (function () {
    function Downloader() {
    }
    Downloader.downloadFile = function (url, dest) {
        return __awaiter(this, void 0, void 0, function () {
            var fetchingLibrary;
            return __generator(this, function (_a) {
                fetchingLibrary = url.includes('https:') ? https_1.default : http_1.default;
                return [2 /*return*/, new Promise(function (resolve, reject) {
                        var file = fs_1.createWriteStream(dest);
                        var request = fetchingLibrary.get(url, function (response) {
                            response.pipe(file);
                            file.on('finish', function () {
                                // @ts-ignore
                                file.close(function () {
                                    resolve(dest);
                                });
                            });
                            file.on('error', function (err) {
                                reject(err);
                            });
                        })
                            .on('error', function (err) {
                            reject(err);
                        });
                    })];
            });
        });
    };
    Downloader.cleanURL = function (url) {
        return Utils_1.cleanURL(url);
    };
    Downloader.getFileInURL = function (url) {
        var lastSlashIndex = url.lastIndexOf('/') + 1;
        var queryStringIndex = url.lastIndexOf('?');
        if (queryStringIndex == -1) {
            return url.substring(lastSlashIndex);
        }
        else {
            return url.substring(lastSlashIndex, queryStringIndex);
        }
    };
    Downloader.downloadAll = function (url, scriptRequests) {
        return __awaiter(this, void 0, void 0, function () {
            var cleanedURL, mkdirError_1, _i, scriptRequests_1, request, destination, downloadError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cleanedURL = this.cleanURL(url);
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, mkdirAsync(path_1.join('./JSDownloads', cleanedURL))];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        mkdirError_1 = _a.sent();
                        if (mkdirError_1.code !== 'EEXIST') {
                            console.error(mkdirError_1);
                        }
                        return [3 /*break*/, 4];
                    case 4:
                        _i = 0, scriptRequests_1 = scriptRequests;
                        _a.label = 5;
                    case 5:
                        if (!(_i < scriptRequests_1.length)) return [3 /*break*/, 10];
                        request = scriptRequests_1[_i];
                        _a.label = 6;
                    case 6:
                        _a.trys.push([6, 8, , 9]);
                        destination = path_1.join('./JSDownloads', cleanedURL, this.cleanURL(request));
                        return [4 /*yield*/, this.downloadFile(request, destination)];
                    case 7:
                        _a.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        downloadError_1 = _a.sent();
                        console.error(downloadError_1);
                        return [3 /*break*/, 9];
                    case 9:
                        _i++;
                        return [3 /*break*/, 5];
                    case 10: return [2 /*return*/];
                }
            });
        });
    };
    return Downloader;
}());
exports.default = Downloader;
//# sourceMappingURL=Downloader.js.map