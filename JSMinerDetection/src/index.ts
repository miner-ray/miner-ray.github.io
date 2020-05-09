
import Crawler from './Crawler';
import Downloader from './Downloader';
import JSAnalyzer from './JSAnalyzer';
const { argv } = require('yargs')
.options({
    url: {
        alias: 'u',
        type: 'string',
        describe: 'The website URL to run the detection on',
        demandOption: true
    }
})
.help();


async function run() {
    const url = argv.url;
    const crawler = new Crawler(url);
    const crawlResults = await crawler.main();
    console.log(crawlResults);
    Downloader.downloadAll(url, crawlResults.requests);
    const analyzer = new JSAnalyzer(url);
    const mainLoopDetected = await analyzer.main();
    console.log(mainLoopDetected);

}

run();