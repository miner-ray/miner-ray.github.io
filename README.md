# [MinerRay Source Code](https://github.com/miner-ray/miner-ray.github.io)

[Paper](https://alan-romano.github.io/MinerRay_Semantics_Aware_Analysis_for_Ever_Evolving_Cryptojacking_Detection.pdf)


MinerRay is a tool to detect hidden in-browser crypto mining scripts by analyzing  WebAssembly files for known hashing behavior.

This repository contains the source code for the MinerRay implementation. The datasets generated are included as well.

The MinerRay Parser reads a file in WebAssembly Text format to create the list of abstractions for each function defined in the file. After the individual lists for each function are created, the lists are scanned for CALL abstractions to link them with the abstractions list of the other functions. Graphs are built using the abstractions list for each individual function and then

The JS Miner Detection tool scans a provided URL for JavaScript miners by parsing the captured JavaScript files with Esprima to build the abstract syntax tree for each file. The trees are traversed to search for the main hashing loop. This tool is used to detect JS-only miners such as JSECoin and hybrid JS-Wasm miners such as WebDollar.


The Wasm Dump Reader allows for batch processing of the retrieved *.wasm* binary files by converting them to *.wat* and running them through the MinerRay parser. 

## MinerRay Parser
In order to run the MinerRay Parser, you need to have [Node.js](https://nodejs.org/en/) installed and
 [Redis](https://redis.io/) installed and running. The default configuration for Redis is assumed.

Run `npm install` in the directory to install the necessary Node.js dependencies.

Run the parser with `node parser.js --file <file>`, where <file> is the path to a WebAssembly Text file to parse.

## JS Miner Detection
In order to run the JS Miner Detection, you need to have [Node.js](https://nodejs.org/en/) installed.

Run `npm install` in the directory to install the necessary Node.js dependencies.

Run the parser with `node lib/index.js -u <url>`, where <url> is the URL of the possible miner page to scan.


## Wasm Dump Reader
In order to run the Wasm Dump Reader, you need to have the [wabt](https://github.com/WebAssembly/wabt) tools built and the binaries added to the PATH. The MinerRay Parser also needs to be downloaded and have the dependencies installed. 

Run `npm install` in the directory to install the necessary Node.js dependencies.


Run `node wasmDumpReader.js --parserPath <parserPath>`, where <parserPath> is the path to the MinerRayParser (without a trailing `/`). 

## [Data](https://github.com/miner-ray/miner-ray.github.io/tree/master/Data)

This folder contains samples of WebAssembly code found through crawling in the  `SampleWasmFiles` folder. The file [HashingSiteResultSamples.csv](https://github.com/miner-ray/miner-ray.github.io/blob/master/Data/HashingSiteResultSamples.csv) contains some samples of the results of a few websites.The list of  hashing sites can be seen in the [`sites.csv`](https://github.com/miner-ray/miner-ray.github.io/blob/master/Data/sites.csv) file.


