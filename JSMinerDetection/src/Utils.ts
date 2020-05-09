export function cleanURL(url: string): string{
    url = url.replace('://', '____').replace(/\//g, '__').replace(/\./g, '_____');
    if(url.includes('?')){
        url = url.substring(0, url.indexOf('?'));
    }
    return url;
}