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
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var util_1 = require("util");
var path_1 = require("path");
var esprima = require('esprima');
var walkAddParent = require('esprima-walk').walkAddParent;
var Utils_1 = require("./Utils");
var readdirAsync = util_1.promisify(fs_1.readdir);
var statAsync = util_1.promisify(fs_1.stat);
var readFileAsync = util_1.promisify(fs_1.readFile);
var NUMBER_OF_WALKS = 2;
var Queue = /** @class */ (function () {
    function Queue() {
        this.items = [];
    }
    // Retrieved from : https://www.geeksforgeeks.org/implementation-queue-javascript/
    // Array is used to implement a Queue
    Queue.prototype.enqueue = function (element) {
        var _a;
        // adding element to the queue
        if (Array.isArray(element)) {
            (_a = this.items).push.apply(_a, element);
        }
        else {
            this.items.push(element);
        }
    };
    Queue.prototype.dequeue = function () {
        // removing element from the queue
        // returns underflow when called
        // on empty queue
        if (this.isEmpty())
            return null;
        return this.items.shift();
    };
    Queue.prototype.isEmpty = function () {
        // return true if the queue is empty.
        return this.items.length == 0;
    };
    Queue.prototype.numberOfItems = function () {
        return this.items.length;
    };
    return Queue;
}());
var JSAnalyzer = /** @class */ (function () {
    function JSAnalyzer(url) {
        this.URL = url;
    }
    JSAnalyzer.prototype.getFiles = function (dir) {
        return __awaiter(this, void 0, void 0, function () {
            var subdirs, files;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, readdirAsync(dir)];
                    case 1:
                        subdirs = _a.sent();
                        return [4 /*yield*/, Promise.all(subdirs.map(function (subdir) { return __awaiter(_this, void 0, void 0, function () {
                                var res;
                                return __generator(this, function (_a) {
                                    switch (_a.label) {
                                        case 0:
                                            res = path_1.resolve(dir, subdir);
                                            return [4 /*yield*/, statAsync(res)];
                                        case 1: return [2 /*return*/, (_a.sent()).isDirectory() ? this.getFiles(res) : res];
                                    }
                                });
                            }); }))];
                    case 2:
                        files = _a.sent();
                        // @ts-ignore
                        return [2 /*return*/, files.reduce(function (a, f) { return a.concat(f); }, [])];
                }
            });
        });
    };
    JSAnalyzer.prototype.getPath = function (node) {
        var pathNodes = [];
        pathNodes.push(node);
        while (node.parent) {
            pathNodes.push(node.parent);
            node = node.parent;
        }
        return pathNodes;
    };
    JSAnalyzer.prototype.main = function () {
        return __awaiter(this, void 0, void 0, function () {
            var cleanedURL, scriptFolder, downloadedFiles, mainLoop, hasEqualComparison, hasHashResultVarName, traverseExpression, _loop_1, _i, downloadedFiles_1, file;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        cleanedURL = Utils_1.cleanURL(this.URL);
                        scriptFolder = path_1.join('./JSDownloads', cleanedURL);
                        return [4 /*yield*/, this.getFiles(scriptFolder)];
                    case 1:
                        downloadedFiles = _a.sent();
                        mainLoop = [];
                        hasEqualComparison = function (node) {
                            var found = false;
                            var expressionsToCheck = new Queue();
                            expressionsToCheck.enqueue(node);
                            while (!expressionsToCheck.isEmpty() && !found) {
                                var exp = expressionsToCheck.dequeue();
                                if (exp.body) {
                                    expressionsToCheck.enqueue(exp.body);
                                }
                                if (exp.expression) {
                                    expressionsToCheck.enqueue(exp.expression);
                                }
                                if (exp.left) {
                                    expressionsToCheck.enqueue(exp.left);
                                }
                                if (exp.right) {
                                    expressionsToCheck.enqueue(exp.right);
                                }
                                if (exp.operator) {
                                    if (exp.operator === '==' || exp.operator === '===') {
                                        found = true;
                                        break;
                                    }
                                }
                            }
                            return found;
                        };
                        hasHashResultVarName = function (node, variableName) {
                            var found = false;
                            var expressionsToCheck = new Queue();
                            expressionsToCheck.enqueue(node);
                            while (!expressionsToCheck.isEmpty() && !found) {
                                var exp = expressionsToCheck.dequeue();
                                if (exp.body) {
                                    expressionsToCheck.enqueue(exp.body);
                                }
                                if (exp.expression) {
                                    expressionsToCheck.enqueue(exp.expression);
                                }
                                if (exp.left) {
                                    expressionsToCheck.enqueue(exp.left);
                                }
                                if (exp.right) {
                                    expressionsToCheck.enqueue(exp.right);
                                }
                                if (exp.callee) {
                                    expressionsToCheck.enqueue(exp.callee);
                                }
                                if (exp.object) {
                                    expressionsToCheck.enqueue(exp.object);
                                }
                                if (exp.name && exp.name === variableName) {
                                    found = true;
                                    break;
                                }
                            }
                            return found;
                        };
                        traverseExpression = function (ast, fn) {
                            var stack = [ast], i, j, key, len, node, child;
                            for (i = 0; i < stack.length; i += 1) {
                                node = stack[i];
                                fn(node);
                                for (key in node) {
                                    if (key === 'parent')
                                        continue;
                                    child = node[key];
                                    if (child instanceof Array) {
                                        for (j = 0, len = child.length; j < len; j += 1) {
                                            stack.push(child[j]);
                                        }
                                    }
                                    else if (child != void 0 && typeof child.type === 'string') {
                                        stack.push(child);
                                    }
                                }
                            }
                        };
                        _loop_1 = function (file) {
                            var fileContents, parsedResults, functionsUsingCryptoSubtle_1, aliasTrail_1, numberOfWalks, analyzeError_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 3, , 4]);
                                        if (!(file.endsWith('.js') || file.endsWith('_____js'))) return [3 /*break*/, 2];
                                        console.log("Processing " + file);
                                        return [4 /*yield*/, readFileAsync(file, 'utf8')];
                                    case 1:
                                        fileContents = _a.sent();
                                        parsedResults = esprima.parseScript(fileContents);
                                        functionsUsingCryptoSubtle_1 = [];
                                        aliasTrail_1 = [];
                                        numberOfWalks = 0;
                                        while (numberOfWalks < NUMBER_OF_WALKS) {
                                            numberOfWalks += 1;
                                            walkAddParent(parsedResults, function (node) {
                                                if (node.type === 'CallExpression') {
                                                    var callee = node.callee;
                                                    //JSECoin detection
                                                    if (callee.type === 'MemberExpression') {
                                                        if (callee.object && callee.object.type == 'MemberExpression') {
                                                            if (callee.object.object && callee.object.object.name == 'crypto') {
                                                                if (callee.property && callee.property.name == 'digest') {
                                                                    var path = _this.getPath(node);
                                                                    for (var _i = 0, path_2 = path; _i < path_2.length; _i++) {
                                                                        var n = path_2[_i];
                                                                        if (n.type == 'FunctionDeclaration' && n.id && n.id.name) {
                                                                            functionsUsingCryptoSubtle_1.push(n.id.name);
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                    if (callee.object && callee.object.name == 'Module') {
                                                        if (callee.property && callee.property.name == '_argon2_hash') {
                                                            var path = _this.getPath(node);
                                                            for (var _a = 0, path_3 = path; _a < path_3.length; _a++) {
                                                                var n = path_3[_a];
                                                                if (n.type == 'FunctionDeclaration' && n.id) {
                                                                    aliasTrail_1.push(callee.property.name, n.id.name);
                                                                }
                                                            }
                                                        }
                                                    }
                                                    var functionAliases_2 = aliasTrail_1; //Object.keys(hashingFunctionAliases);
                                                    for (var _b = 0, functionAliases_1 = functionAliases_2; _b < functionAliases_1.length; _b++) {
                                                        var alias = functionAliases_1[_b];
                                                        if (callee.name == alias) {
                                                            var path = _this.getPath(node);
                                                            var _loop_2 = function (n) {
                                                                if (n.type == 'FunctionDeclaration' && n.id) {
                                                                    if (!aliasTrail_1.includes(n.id.name)) {
                                                                        aliasTrail_1.push(n.id.name);
                                                                    }
                                                                }
                                                                if (n.type === 'WhileStatement') {
                                                                    traverseExpression(n, function (innerNode) {
                                                                        if (innerNode.type === 'IfStatement') {
                                                                            var conditionStatement = innerNode.test;
                                                                            if (conditionStatement.type == 'BinaryExpression') {
                                                                                if (conditionStatement.operator === '>' || conditionStatement.operator === '<' ||
                                                                                    conditionStatement.operator === '>=' || conditionStatement.operator === '<=') {
                                                                                    for (var _i = 0, functionAliases_3 = functionAliases_2; _i < functionAliases_3.length; _i++) {
                                                                                        var alias_1 = functionAliases_3[_i];
                                                                                        if (hasHashResultVarName(conditionStatement, alias_1)) {
                                                                                            if (!mainLoop.includes(n)) {
                                                                                                mainLoop.push(n);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    });
                                                                }
                                                                if (n.type == 'VariableDeclarator') {
                                                                    if (n.id) {
                                                                        if (!aliasTrail_1.includes(n.id.name)) {
                                                                            aliasTrail_1.push(n.id.name);
                                                                        }
                                                                    }
                                                                }
                                                            };
                                                            for (var _c = 0, path_4 = path; _c < path_4.length; _c++) {
                                                                var n = path_4[_c];
                                                                _loop_2(n);
                                                            }
                                                        }
                                                    }
                                                    //JSECoin detection
                                                    if (functionsUsingCryptoSubtle_1.length > 0) {
                                                        for (var _d = 0, functionsUsingCryptoSubtle_2 = functionsUsingCryptoSubtle_1; _d < functionsUsingCryptoSubtle_2.length; _d++) {
                                                            var functionName = functionsUsingCryptoSubtle_2[_d];
                                                            if (callee.name && callee.name === functionName) {
                                                                var path = _this.getPath(node);
                                                                for (var _e = 0, path_5 = path; _e < path_5.length; _e++) {
                                                                    var n = path_5[_e];
                                                                    if (n.type == 'ForStatement') {
                                                                        if (n.body.body) {
                                                                            for (var _f = 0, _g = n.body.body; _f < _g.length; _f++) {
                                                                                var innerExpression = _g[_f];
                                                                                if (innerExpression.type === 'IfStatement') {
                                                                                    var hashResultVarName = void 0;
                                                                                    var hasEqualsComparison = false;
                                                                                    var hasHashVar = void 0;
                                                                                    if (innerExpression.consequent && innerExpression.consequent.expression && innerExpression.consequent.expression.callee && innerExpression.consequent.expression.callee.property && innerExpression.consequent.expression.callee.property.name === 'then') {
                                                                                        hashResultVarName = innerExpression.consequent.expression.arguments[0].params[0].name;
                                                                                        hasEqualsComparison = hasEqualComparison(innerExpression.consequent.expression.arguments[0]);
                                                                                        hasHashVar = hasHashResultVarName(innerExpression.consequent.expression.arguments[0], hashResultVarName);
                                                                                        if (hasEqualsComparison && hasHashVar) {
                                                                                            mainLoop.push(n);
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                                if (node.type === 'AssignmentExpression' && node.operator === '=') {
                                                    for (var _h = 0, aliasTrail_2 = aliasTrail_1; _h < aliasTrail_2.length; _h++) {
                                                        var alias = aliasTrail_2[_h];
                                                        if (node.right && node.right.name == alias) {
                                                            if (!aliasTrail_1.includes(node.left.name)) {
                                                                aliasTrail_1.push(node.left.name);
                                                            }
                                                        }
                                                    }
                                                }
                                            }); //end walk
                                        } //end while
                                        _a.label = 2;
                                    case 2: return [3 /*break*/, 4];
                                    case 3:
                                        analyzeError_1 = _a.sent();
                                        console.error(analyzeError_1);
                                        return [3 /*break*/, 4];
                                    case 4: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, downloadedFiles_1 = downloadedFiles;
                        _a.label = 2;
                    case 2:
                        if (!(_i < downloadedFiles_1.length)) return [3 /*break*/, 5];
                        file = downloadedFiles_1[_i];
                        return [5 /*yield**/, _loop_1(file)];
                    case 3:
                        _a.sent();
                        _a.label = 4;
                    case 4:
                        _i++;
                        return [3 /*break*/, 2];
                    case 5: return [2 /*return*/, mainLoop];
                }
            });
        });
    };
    return JSAnalyzer;
}());
exports.default = JSAnalyzer;
//# sourceMappingURL=JSAnalyzer.js.map