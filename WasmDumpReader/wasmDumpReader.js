const fs = require('fs');
const {
  promisify
} = require('util');
const execPlain = require('child_process').exec;
const readDirAsync = promisify(fs.readdir);
const exec = promisify(require('child_process').exec);
const {
  argv
} = require('yargs');
const WASM_DUMP_DIR = argv.workingDir || './AllWasmDumps';
const WASM_PARSER_PATH = argv.parserPath;

if (WASM_PARSER_PATH == null) {
  console.log('Please pass the path to the MinerRay Parser folder using the --parserPath flag!');
  process.exit(1)
}
async function listDirectories() {
  let list = await readDirAsync(WASM_DUMP_DIR);

  return list;
}

async function main() {
  let detectedWebsiteFolders = await listDirectories();
  let websites = {};
  let totalWebsites = 0;
  let hashingWebsites = [];
  let probableHashingWebsites = [];
  let unlikelyHashingWebsites = [];
  let wasmConversionFailedWebsites = new Set();
  let nonHashingWebsites = new Set();
  let websitesParseResults = {};
  const filePromises = [];
  const newWatFiles = {};
  new Promise(async function (resolve, reject) {
    for (let folderName of detectedWebsiteFolders) {
      totalWebsites += 1;
      let files = await readDirAsync(`${WASM_DUMP_DIR}/${folderName}`);
      let alreadyConvertedFiles = files.filter((file) => file.includes('.wat'));
      files = files.filter((file) => file.includes('.wasm'));
      websites[folderName] = files;
      websitesParseResults[folderName] = {};
      newWatFiles[folderName] = []

      for (const file of files) {
        let fileHash = file.substring(0, file.indexOf('.'));
        let convertedOutputFileName = `converted-${fileHash}.wat`;
        let fullPath = `${WASM_DUMP_DIR}/${folderName}`;
        if(alreadyConvertedFiles.includes(convertedOutputFileName)){
            continue;
        }
        try {
          const { stdout, stderr } = await exec(`wasm2wat   ${fullPath}/${file} -o ${fullPath}/${convertedOutputFileName}`);
          newWatFiles[folderName].push(`${fullPath}/${convertedOutputFileName}`);

        } catch (err) {
          console.error(err);
          wasmConversionFailedWebsites.add(folderName);
        }
      }

      files = await readDirAsync(`${WASM_DUMP_DIR}/${folderName}`);
      files = files.filter((file) => file.includes('.wat'));

      for (const file of files) {
        filePromises.push(() => {
          return new Promise(async function (res, rej) {
            let timeout = setTimeout(() => {
              rej('{error: true, errorDetails: "timeout"}')
            }, 120000)

            let convertedOutputFileName = file;
            let fullPath = `${WASM_DUMP_DIR}/${folderName}`;
            console.log(folderName);

            websitesParseResults[folderName][`${convertedOutputFileName}`] = [];

            execPlain(`node --expose-gc --max-old-space-size=8192 "${WASM_PARSER_PATH}/parser.js" --file "${fullPath}/${convertedOutputFileName}"`, (error, stdout, stderr) => {
              if (error) {
                rej(error)
              }
              let jsonObject;
              try{
                jsonObject = JSON.parse(stdout);
              } catch(e){
                jsonObject = {error: 'Crashed'}
              }
              console.error(stderr)
              websitesParseResults[folderName][`${cleanSite(convertedOutputFileName)}`] = jsonObject;
              clearTimeout(timeout)
              res(websitesParseResults[folderName][`${convertedOutputFileName}`])
            });
          })
        })
      }




    }


    promiseSerial(filePromises)
      .then((results) => {
        resolve(results);
      })
  }).then(function (results) {
    let numberOfHashingSites = 0;
    for (var website in websitesParseResults) {
      const websiteFileResults = websitesParseResults[website];

      for (let i = 0; i < Object.keys(websiteFileResults).length; i++) {
        var parserResult = websiteFileResults[Object.keys(websiteFileResults)[i]];

        if (parserResult.certain == undefined || parserResult.error != undefined) {
          if(i == (Object.keys(websiteFileResults).length - 1)){
          	nonHashingWebsites.add({site: website, result: parserResult})
          	}
          continue;
        }

        if (parserResult.certain.length > 0) {
          numberOfHashingSites += 1;
          hashingWebsites.push({site: website, result: parserResult})
          break;
        } else if (parserResult.probable.length > 0) {
          numberOfHashingSites += 1;
          hashingWebsites.push({site: website, result: parserResult})
          break;
        } else if (parserResult.unlikely.length > 0) {
          numberOfHashingSites += 1;
          hashingWebsites.push({site: website, result: parserResult})
          break;
        }else {
          	if(i == (Object.keys(websiteFileResults).length - 1)){
          	nonHashingWebsites.add({site: website, result: parserResult})
          	}
          }
        // if(parserResult.length > 45){
        // 	numberOfHashingSites += 1;
        // 	hashingWebsites.push(website)
        // 	break;
        // } else {
        // 	if(i == (Object.keys(websiteFileResults).length - 1)){
        // 	nonHashingWebsites.add(website)
        // 	}
        // }

      }

    }
    console.log('Total:', totalWebsites);
    console.log('Total Hashing:', numberOfHashingSites);
    console.log('Websites hashing:')
    fs.writeFileSync(`HashingWebsiteResults.json`, JSON.stringify(hashingWebsites));
    fs.writeFileSync(`NonHashingWebsiteResults.json`, JSON.stringify(nonHashingWebsites));

    for (let site of hashingWebsites) {
      console.log(cleanSite(site));
    }


    console.log('\n\nNon-hashing websites', nonHashingWebsites.size);
    for (let site of nonHashingWebsites) {
      console.log(cleanSite(site));
    }

    console.log('\n\nFailed Wabt Conversion websites', wasmConversionFailedWebsites.size);
    for (let site of wasmConversionFailedWebsites) {
      console.log(cleanSite(site));
    }
    process.exit();

  })


}
const promiseSerial = (funcs) =>
  funcs.reduce(
    (promise, func) => promise.then((result) => func().then(Array.prototype.concat.bind(result)).catch(Array.prototype.concat.bind(result))),
    Promise.resolve([])
  );

const cleanSite = (siteName) => {
  siteName = siteName.replace('--', '://')
  var indexOfLastHyphen = siteName.lastIndexOf('-');
  siteName = siteName.slice(0, indexOfLastHyphen) + '.' + siteName.slice(indexOfLastHyphen + 1)
  return siteName
}
main();