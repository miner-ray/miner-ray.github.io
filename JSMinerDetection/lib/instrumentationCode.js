self.WebAssemblyCallLocations ={
    instantiate: [],
    instantiateStreaming: [],
    exportCalls: {},
    importCalls: {},

    altered: false,
    addExport: function(name, stack){
        if (!this.exportCalls[name]) {
            this.exportCalls[name] = [];
        }

        if(this.exportCalls[name].length > 3){
            return;
        }
        this.exportCalls[name].push(stack);
    },
    addImport: function(name, stack){
        if (!this.importCalls[name]) {
            this.importCalls[name] = [];
        }

        if(this.importCalls[name].length > 3){
            return;
        }
        this.importCalls[name].push(stack);
    },
    addInstantiate: function(stack){
        if(this.instantiate.length > 3){
            return;
        }

        this.instantiate.push(stack);
    },
    addInstantiateStreaming: function(stack){
        if(this.instantiateStreaming.length > 3){
            return;
        }

        this.instantiateStreaming.push(stack);
    },
    
}

self.WebSocketCallLocations = {
    onmessage: [],
    onclose: [],
    variables: [],
    altered: false,
    addOnMessage: function(stack){
        if(this.onmessage.length > 3){
            return;
        }
        this.onmessage.push(stack);
    },
    addOnClose: function(stack){
        if(this.onclose.length > 3){
            return;
        }
        this.onclose.push(stack);
    }
};

var ogWaI = WebAssembly.instantiate;
var ogWaIS = WebAssembly.instantiateStreaming;
WebAssembly.instantiate = function (buff, imp) {
    const newImports  = {};

    for(const key in imp){
        newImports[key] = {}
        const keyObject = imp[key];

        if(keyObject != null && keyObject.toString() === "[object Math]" ){
            newImports[key] = keyObject;
        }
        for( const name in keyObject){
            if(typeof(keyObject[name]) === 'function'){
                const originalImportFunction = keyObject[name];

                newImports[key][name] = (function () {
                    const na = name;
                    self.WebAssemblyCallLocations.altered = true;
    
                    return function () {
                        let frames = new Error().stack;
                        self.WebAssemblyCallLocations.addImport(na,frames)
                        
                        return originalImportFunction.apply(null, arguments);
                    };
                })()
            } else {
                newImports[key][name] = keyObject[name];
            }
        }
    }

    const stackLocation = new Error().stack;
    self.WebAssemblyCallLocations.addInstantiate(stackLocation);
    self.WebAssemblyCallLocations.altered = true;
    return ogWaI(buff, newImports)
        .then(function (re) {
            if (re.module === undefined) {
                //re is Instance only
                const newInstance = {
                    exports: {}
                };
                const exportNames = Object.keys(re.exports);
                for (const name of exportNames) {
                    const ogFunction = re.exports[name];

                    if(typeof(re.exports[name]) == 'function'){
                        newInstance.exports[name] = (function () {
                            const na = name;
                            self.WebAssemblyCallLocations.altered = true;
                            const closureReturn = function () {
                                let frames = new Error().stack;
                                self.WebAssemblyCallLocations.addExport(na,frames)   

                                return ogFunction.apply(this, arguments);
                            };
                            Object.defineProperty(closureReturn, "length", { value: ogFunction.length })
                            return closureReturn;

                        })()
                    }
                    else {
                        newInstance.exports[name] = re.exports[name];
                    }

                }
                Object.setPrototypeOf(newInstance, Object.getPrototypeOf(re))
                // return newInstance;
                
                return newInstance;
            } else {
                //re is ResultObject
                const newResultObject = {
                    module: re.module,
                    instance: null
                };
                const newInstance = {
                    exports: {}
                };
                const exportNames = Object.keys(re.instance.exports);

                for (const name of exportNames) {
                    const ogFunction = re.instance.exports[name];

                    newInstance.exports[name] = (function () {
                        const na = name;
                            self.WebAssemblyCallLocations.altered = true;
                            const closureReturn = function () {
                                let frames = new Error().stack;
                                self.WebAssemblyCallLocations.addExport(na,frames)   

                                return ogFunction.apply(this, arguments);
                            };
                            Object.defineProperty(closureReturn, "length", { value: ogFunction.length })

                            return closureReturn;
                    })()
                };

                Object.setPrototypeOf(newInstance, WebAssembly.Instance)
                newResultObject.instance = newInstance;
                return newResultObject;
            }
        });
};
WebAssembly.instantiateStreaming = function (source, imp) {
    const stackLocation = new Error().stack;
    self.WebAssemblyCallLocations.addInstantiateStreaming(stackLocation)
    self.WebAssemblyCallLocations.altered = true;
    const newImports  = {};

    for(const key in imp){
        newImports[key] = {}
        const keyObject = imp[key];
        if(keyObject != null && keyObject.toString() === "[object Math]" ){
            newImports[key] = keyObject;
        }
        for(const name in keyObject){
            if(typeof(keyObject[name]) === 'function'){
                const originalImportFunction = keyObject[name];

                newImports[key][name] = (function () {
                    const na = name;
                    self.WebAssemblyCallLocations.altered = true;
    
                    return function () {
                        let frames = new Error().stack;
                        self.WebAssemblyCallLocations.addImport(na,frames)
                        
                        return originalImportFunction.apply(null, arguments);
                    };
                })()
            } else {
                newImports[key][name] = keyObject[name];
            }
        }
    }

    return ogWaIS(source, newImports)
        .then(function (re) {
            const newResultObject = {
                module: re.module,
                instance: null
            };

            const newInstance = {
                exports: {}
            };
            const exportNames = Object.keys(re.instance.exports);

            for (const name of exportNames) {
                const ogFunction = re.instance.exports[name];

                newInstance.exports[name] = (function () {
                    const na = name;
                    self.WebAssemblyCallLocations.altered = true;
                    const closureReturn = function () {
                        let frames = new Error().stack;
                        self.WebAssemblyCallLocations.addExport(na,frames)   

                        return ogFunction.apply(this, arguments);
                    };
                    Object.defineProperty(closureReturn, "length", { value: ogFunction.length })

                    return closureReturn;
                })()
            };

            newResultObject.instance = newInstance;
            return newResultObject;
        });

};



// var originalWebSocketOnMessage;

// setTimeout(() => {
//     originalWebSocketOnMessage  = WebSocket.onmessage;
//     WebSocket.onmessage = function(){
//         let location = new Error().stack;
//         self.WebSocketCallLocations.addOnMessage(location);
//         return originalWebSocketOnMessage.apply(null, arguments);
//     }
    
// }, 2000)



// var originalWebSocketOnMessage = WebSocket.prototype.onmessage;
// Object.defineProperty(WebSocket.prototype, 'onmessage', {
//     get() {
//         let stack = new Error().stack;
//         WebSocketCallLocations.addOnMessage(stack);
//         return originalWebSocketOnMessage },
//     set(value) {
//         originalWebSocketOnMessage = value
//     }
// })