import puppeteer, { JSHandle } from 'puppeteer';
import {readFileSync, rmdir,createWriteStream, mkdir ,readdir ,stat}  from 'fs';
import {promisify} from 'util';
import {join, resolve} from 'path';
import uuidv1 from 'uuid/v1';
const rmdirAsync = promisify(rmdir);

type Nullable<T> = T | null;

interface WebAssemblyInstrumentation {
    instantiate: any[],
    instantiateStreaming: any[],
    exportCalls: any,
    importCalls: any,
    altered: boolean,
    addExport: Function,
    addImport: Function,
    addInstantiate: Function,
    addInstantiateStreaming: Function
}

interface WebSocketInstrumentation {
    onmessage: string[],
    onclose: string[],
    variables: [],
    altered: boolean,
    addOnMessage: Function,
    addOnClose: Function
}
declare global {
    interface Window { 
        WebAssemblyCallLocations: WebAssemblyInstrumentation;
        WebSocketCallLocations? :WebSocketInstrumentation
    }
}

const preloadFile = readFileSync(join(__dirname, './instrumentationCode.js'), 'utf8');


class Crawler{
    browser?: puppeteer.Browser = undefined;
    webAssemblyWorkers: JSHandle[] = []; //Holds the JSHandles of the instrumentation objects used to store tarces in WebWorkers
    allJSONOfRecordedWorkers: WebAssemblyInstrumentation[] = []; //Holds the JSONed versions of the instrumentation objects
    capturedRequests: any = {};
    currentURL: string = '';
    userDataDirPath:string  = '';
    
    constructor(url: string){
        this.currentURL = url;
    }

    

    async getBrowser(): Promise<puppeteer.Browser>{
        if(this.browser != null){
            return this.browser;
        }

        const userDataDir = uuidv1().split('-')[0];
        this.userDataDirPath = userDataDir;
        const chromeArgs = [
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-renderer-backgrounding',
            '--disable-gpu',
            '--no-sandox',
            '--autoplay-policy="No user gesture is required"'
          ];
        const browser = await puppeteer.launch({
            userDataDir,
            // args: chromeArgs,
            dumpio: true,
            headless: false,
            devtools: true,

        });
        this.browser = browser;
        return this.browser;
    }

    async getPage(): Promise<puppeteer.Page>{
        const browser: puppeteer.Browser = await this.getBrowser();

        const page: puppeteer.Page = await browser.newPage();
        await page.setRequestInterception(true);
        page.on('request', (interceptedRequest) => {
            let requestURL = interceptedRequest.url()
            const resourceType = interceptedRequest.resourceType();
            if (
                resourceType == 'script' ||
                resourceType == 'document'
            ) {
                this.capturedRequests[this.currentURL].push(requestURL);
            }
            interceptedRequest.continue();
        });
        page.evaluateOnNewDocument(preloadFile)
        page.on('workercreated', async worker => {
            console.log('Worker created: ' + worker.url())
            await worker.evaluate(preloadFile)
            try{
                await worker.evaluate(() => {
                    setTimeout(()=>{
                        console.log(self);
                    },1000)
                })

                setTimeout(async () => {
                    try{
                       
                        var workerObject = await (await worker.evaluateHandle(() => {
                        
                            return self.WebAssemblyCallLocations;
                        })).jsonValue();
                        
                        this.allJSONOfRecordedWorkers.push(workerObject)
                    } catch(error){
                        console.log(error);
                    }
                }, 2010)

                var currentWorkerWebAssembly = await worker.evaluateHandle(() => {
                    
                    return self.WebAssemblyCallLocations;
                })

                this.webAssemblyWorkers.push(currentWorkerWebAssembly);
            } catch(err){
                console.error('Worker Eval', err)
            }

            

        });


        return page;
    }

    async closeBrowser() : Promise<void>{
        if(this.browser != null ){
            await this.browser.close();
        }

        try{
            // @ts-ignore
            await rmdirAsync(this.userDataDirPath, {
                recursive : true
            })
        } catch(e){
            console.error(e);
        }
    }

    formatStackTrace(stackTrace: string) {
        let stackTraceFrames = stackTrace.replace('Error\n ', '')
                                .replace(/Object\./g, '')
                                .split(/at(.*)(\(.*\))?/g)
                                .filter(str => {
                                    return str !== undefined && str.match(/\S/g) != null
                                });
        const fromattedstackTraceFrames = stackTraceFrames.map((frame, index) => {
                if(frame.includes('__puppeteer_evaluation_script__')){
                    return null;
                }

                if(frame.match(/<anonymous>:.*/)){
                    return null;
                }

                if(frame.includes('closureReturn')){
                    return null;
                }
                
                frame = frame.replace(/(\(.*\))/g, "");
                if(index === 0){
                    frame = frame.trim();
                    frame = frame.replace(/^Object\./, '');

                }
                frame = frame.trim();

                return frame;
            })
            .filter(str => str != null);

        return fromattedstackTraceFrames;
    }

    formatInstrumentObject(webassemblyObject: any){
        if (webassemblyObject.instantiate != null) {
            webassemblyObject.instantiate = webassemblyObject.instantiate.map(this.formatStackTrace);
        }

        if (webassemblyObject.instantiateStreaming != null) {
            webassemblyObject.instantiateStreaming = webassemblyObject.instantiateStreaming.map(this.formatStackTrace);
        }

        if (webassemblyObject.exportCalls != null) {
            let newObj: any = {};
            for (let funcName in webassemblyObject.exportCalls) {
                let stacks = webassemblyObject.exportCalls[funcName];

                newObj[funcName] = stacks.map((stack:string) => {
                    const formattedTraces = this.formatStackTrace(stack);
                    formattedTraces.unshift(funcName);
                    return formattedTraces;
                });
            }

            webassemblyObject.exportCalls = newObj;
        }

        if (webassemblyObject.importCalls != null) {
            let newObj:any = {};
            for (let funcName in webassemblyObject.importCalls) {
                let stacks = webassemblyObject.importCalls[funcName];

                newObj[funcName] = stacks.map((stack: string) => {
                    const formattedTraces = this.formatStackTrace(stack);
                    formattedTraces.unshift(funcName);
                    return formattedTraces;
                });
            }

            webassemblyObject.importCalls = newObj;
        }
    }

    

    async main(){

        const page = await this.getPage();
        this.capturedRequests[this.currentURL] = [];
        let windowWebAssemblyHandle: Nullable<WebAssemblyInstrumentation> = null ;
        let windowWebSocketHandle: Nullable<WebSocketInstrumentation> = null;
    
        const finish = async () => {
            try{
                windowWebAssemblyHandle = await (await page.evaluateHandle(() => window.WebAssemblyCallLocations)).jsonValue();
                windowWebSocketHandle = await (await page.evaluateHandle(() => self.WebSocketCallLocations)).jsonValue();
            } catch(e){
                console.error(e)
            }
    
            if (this.webAssemblyWorkers.length > 0) {
                try{
                    const workerWebAssemblyJson: WebAssemblyInstrumentation[] = [];
                    for(const x of this.webAssemblyWorkers){
                        let workerObject = await x.jsonValue();
                        workerWebAssemblyJson.push(workerObject);
                    }
                    this.allJSONOfRecordedWorkers.push(...workerWebAssemblyJson);
                } catch(error){
                    console.error(error);
                }
                
            }
        }

        const pageTimer = setTimeout(async ()=> {
            try{
                await finish();
                await page.close();
                await this.closeBrowser();
            }
            catch(e){
                console.error(e)
            }
            finally{

            }

        }, 30*1000 );

        await page.goto(this.currentURL,{
            waitUntil: 'load'
        });
        await page.waitFor(10 * 1000);

        await finish();

        clearTimeout(pageTimer);

        await page.close();
        await this.closeBrowser();
        return {
            requests: this.capturedRequests[this.currentURL],
            instrumentation: {
                window: windowWebAssemblyHandle,
                websocket: windowWebSocketHandle,
                workers: this.allJSONOfRecordedWorkers
            }
        };
    }
}
export default Crawler;