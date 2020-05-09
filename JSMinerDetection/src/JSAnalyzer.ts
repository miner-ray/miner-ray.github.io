import {
    readFile,
    rmdir,
    mkdir,
    readdir,
    stat
} from 'fs';
import {
    promisify
} from 'util';
import {
    join,
    resolve
} from 'path';
const esprima = require('esprima');
const {
    walkAddParent
} = require('esprima-walk')
import {
    cleanURL
} from './Utils';


const readdirAsync = promisify(readdir);
const statAsync = promisify(stat);
const readFileAsync = promisify(readFile);

const NUMBER_OF_WALKS = 2;
class Queue<T> {
    items: T[] = [];
    // Retrieved from : https://www.geeksforgeeks.org/implementation-queue-javascript/
    // Array is used to implement a Queue

    enqueue(element: T) {
        // adding element to the queue
        if(Array.isArray(element)){
            this.items.push(...element);

        } else {
            this.items.push(element);
        }
    }
  
    dequeue() {
        // removing element from the queue
        // returns underflow when called
        // on empty queue
        if (this.isEmpty()) return null;
        return this.items.shift();
    }
  
    isEmpty() {
        // return true if the queue is empty.
        return this.items.length == 0;
    }
  
    numberOfItems() {
        return this.items.length;
    }
}

export default class JSAnalyzer {
    URL: string;

    constructor(url: string) {
        this.URL = url;
    }
    async getFiles(dir: string): Promise < string[] > {
        const subdirs = await readdirAsync(dir);
        const files = await Promise.all(
            subdirs.map(async (subdir) => {
                const res = resolve(dir, subdir);
                return (await statAsync(res)).isDirectory() ? this.getFiles(res) : res;
            })
        );
        // @ts-ignore
        return files.reduce((a, f) => a.concat(f), []);
    }

    getPath(node: any): any[] {
        let pathNodes: any[] = [];
        pathNodes.push(node);
        while (node.parent) {
            pathNodes.push(node.parent);
            node = node.parent;
        }

        return pathNodes;
    }

    async main() {
        const cleanedURL = cleanURL(this.URL);
        const scriptFolder = join('./JSDownloads', cleanedURL)
        const downloadedFiles = await this.getFiles(scriptFolder);
        const mainLoop : any[] = [];

        const hasEqualComparison = (node: any):boolean => {
            let found = false;
            const expressionsToCheck = new Queue<any>();
            expressionsToCheck.enqueue(node);
            while(!expressionsToCheck.isEmpty() && !found){
                const exp = expressionsToCheck.dequeue();

                if(exp.body){
                    expressionsToCheck.enqueue(exp.body);
                } 
                if(exp.expression){
                    expressionsToCheck.enqueue(exp.expression);
                }
                if(exp.left){
                    expressionsToCheck.enqueue(exp.left);
                }
                if(exp.right){
                    expressionsToCheck.enqueue(exp.right);
                }

                if(exp.operator){
                    if(exp.operator === '==' || exp.operator === '===' ){
                        found = true;
                        break;
                    }
                }
            }
            return found;
        }

        const hasHashResultVarName = (node: any, variableName: string):boolean => {
            let found = false;
            const expressionsToCheck = new Queue<any>();
            expressionsToCheck.enqueue(node);
            while(!expressionsToCheck.isEmpty() && !found){
                const exp = expressionsToCheck.dequeue();

                if(exp.body){
                    expressionsToCheck.enqueue(exp.body);
                } 
                if(exp.expression){
                    expressionsToCheck.enqueue(exp.expression);
                }
                if(exp.left){
                    expressionsToCheck.enqueue(exp.left);
                }
                if(exp.right){
                    expressionsToCheck.enqueue(exp.right);
                }
                if(exp.callee){
                    expressionsToCheck.enqueue(exp.callee);
                }
                if(exp.object){
                    expressionsToCheck.enqueue(exp.object);
                }

                if(exp.name && exp.name === variableName){
                    found = true;
                    break;
                }

                
            }
            return found;
        }

        const traverseExpression = ( ast: any, fn: Function ) =>  {

            var stack = [ ast ], i, j, key, len, node, child
        
            for ( i = 0; i < stack.length; i += 1 ) {
        
                node = stack[ i ]
        
                fn( node )
        
                for ( key in node ) {
                    if(key === 'parent') continue;
                    child = node[ key ]
        
                    if ( child instanceof Array ) {
        
                        for ( j = 0, len = child.length; j < len; j += 1 ) {
                            stack.push( child[ j ] )
                        }
        
                    } else if ( child != void 0 && typeof child.type === 'string' ) {
        
                        stack.push( child )
        
                    }
        
                }
        
            }
        
        }

        
        for (const file of downloadedFiles) {
            try{
                
                if (file.endsWith('.js')|| file.endsWith('_____js') ) {
                    console.log(`Processing ${file}`)
                    const fileContents = await readFileAsync(file, 'utf8');
    
                    const parsedResults = esprima.parseScript(fileContents);
                    const functionsUsingCryptoSubtle: any[] = [];
 
                    const aliasTrail: any[] = [];
    
                    let numberOfWalks = 0;
                    while(numberOfWalks < NUMBER_OF_WALKS){
                        numberOfWalks += 1;
                        walkAddParent(parsedResults, (node: any) => {
                            if (node.type === 'CallExpression') {
                                const callee = node.callee;
                                //JSECoin detection

                                if (callee.type === 'MemberExpression') {
                                    if (callee.object && callee.object.type == 'MemberExpression') {
                                        if (callee.object.object && callee.object.object.name == 'crypto') {
                                            if (callee.property && callee.property.name == 'digest') {
                                                const path = this.getPath(node);
                                                for (const n of path) {
                                                    if(n.type == 'FunctionDeclaration' && n.id&& n.id.name){
                                                        functionsUsingCryptoSubtle.push(n.id.name);
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                if (callee.object && callee.object.name == 'Module') {
                                    if (callee.property && callee.property.name == '_argon2_hash') {
                                        const path = this.getPath(node);
                                        for (const n of path) {
                                            if(n.type =='FunctionDeclaration' && n.id){
                                                aliasTrail.push(callee.property.name,n.id.name)
                                            }
                                        }
                                    }
                                }
                                const functionAliases:string[] = aliasTrail;//Object.keys(hashingFunctionAliases);
                                for(const alias of functionAliases){
                                    if(callee.name == alias){
                                        const path = this.getPath(node);
                                        for (const n of path) {
                                            if(n.type =='FunctionDeclaration' && n.id){
                                                if(!aliasTrail.includes(n.id.name)){
                                                    aliasTrail.push(n.id.name)
                                                }
                                            }
                                            if(n.type === 'WhileStatement'){
                                                traverseExpression(n, (innerNode: any) => {
                                                    if( innerNode.type === 'IfStatement'){
                                                        const conditionStatement:any = innerNode.test;
                                                        
                                                        if(conditionStatement.type == 'BinaryExpression'){
                                                            if(conditionStatement.operator === '>' || conditionStatement.operator === '<' ||
                                                            conditionStatement.operator === '>=' || conditionStatement.operator === '<=' 
                                                            ){
                                                                for(const alias of functionAliases){
                                                                    if(hasHashResultVarName(conditionStatement, alias)){
                                                                        if(!mainLoop.includes(n)){
                                                                            mainLoop.push(n);
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }   
                                                    }
                                                })
                                            }
                                            if(n.type == 'VariableDeclarator'){
                                                if(n.id){
                                                    
                                                    if(!aliasTrail.includes(n.id.name)){
                                                        aliasTrail.push(n.id.name)
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                //JSECoin detection
                                if(functionsUsingCryptoSubtle.length > 0){
                                    for(const functionName of functionsUsingCryptoSubtle){
                                        if(callee.name && callee.name === functionName){
                                            const path = this.getPath(node);
                                            for (const n of path) {
                                                if(n.type =='ForStatement'){
                                                    if(n.body.body){
                                                        for(const innerExpression of n.body.body){
                                                            if(innerExpression.type === 'IfStatement'){
                                                                
                                                                let hashResultVarName: string;
                                                                let hasEqualsComparison = false;
                                                                let hasHashVar;
                                                                if(innerExpression.consequent && innerExpression.consequent.expression && innerExpression.consequent.expression.callee && innerExpression.consequent.expression.callee.property && innerExpression.consequent.expression.callee.property.name === 'then'){
                                                                    hashResultVarName = innerExpression.consequent.expression.arguments[0].params[0].name;
                                                                    hasEqualsComparison = hasEqualComparison(innerExpression.consequent.expression.arguments[0])
                                                                    hasHashVar = hasHashResultVarName(innerExpression.consequent.expression.arguments[0], hashResultVarName);
                                                                    
                                                                    if(hasEqualsComparison && hasHashVar){
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
                            if(node.type === 'AssignmentExpression' && node.operator === '='){
                                for(const alias of aliasTrail){
                                    if(node.right && node.right.name == alias){
    
                                        if(!aliasTrail.includes(node.left.name)){
                                            aliasTrail.push(node.left.name)
                                        }
                                    }
                                }
                            }
                        }) //end walk
                    } //end while
                    
    
    
                    // console.log(mainLoop);
    
                }
            } catch(analyzeError){
                console.error(analyzeError)
            }

        }
        
        return mainLoop;
    }


}