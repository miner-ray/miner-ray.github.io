import {createWriteStream, mkdir}  from 'fs';
import {promisify} from 'util';
import {join, resolve} from 'path';
import https from 'https';
import http from 'http';
const mkdirAsync = promisify(mkdir)
import {cleanURL} from './Utils';
class Downloader{
    static async downloadFile(url: string, dest: string): Promise<String> {
        //Fetched from https://stackoverflow.com/questions/11944932/how-to-download-a-file-with-node-js-without-using-third-party-libraries
        const fetchingLibrary = url.includes('https:') ? https : http; 
        return new Promise((resolve, reject) => {
            var file = createWriteStream(dest);
            var request = fetchingLibrary.get(url, function (response) {
                    response.pipe(file);
                    file.on('finish', function () {
                        // @ts-ignore
                        file.close(() => {
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
        })
    
    }
    static cleanURL(url: string){
        return cleanURL(url);
    }
    
    static getFileInURL(url: string) {
        const lastSlashIndex = url.lastIndexOf('/') + 1;
        const queryStringIndex = url.lastIndexOf('?');
        if (queryStringIndex == -1) {
            return url.substring(lastSlashIndex);
        } else {
            return url.substring(lastSlashIndex, queryStringIndex);
        }
    
    }
    static async downloadAll(url: string, scriptRequests: string[]){
        const cleanedURL = this.cleanURL(url);

        try{
            await mkdirAsync(join('./JSDownloads', cleanedURL));
        } catch(mkdirError){
            if(mkdirError.code !== 'EEXIST'){
                console.error(mkdirError);
            }
        }
        for(const request of scriptRequests){
            try{
                const destination = join('./JSDownloads', cleanedURL, this.cleanURL(request));
                await this.downloadFile(request, destination)
            } catch(downloadError){
                console.error(downloadError);
            }
            
        }
    }
}

export default Downloader