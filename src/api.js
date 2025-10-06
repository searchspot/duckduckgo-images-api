const axios = require('axios');
const { url, headers, max_iter, max_retries } = require('./constants')
const { sleep, getToken } = require('./utils')


async function image_search({ query, moderate, retries, iterations }) {

    let reqUrl = url + 'i.js';
    let keywords = query
    let p = moderate ? 1 : -1;      // by default moderate false
    let attempt = 0;
    if (!retries) retries = max_retries; // default to max if none provided
    if (!iterations) iterations = max_iter; // default to max if none provided

    let results = [];

    console.log(`[image_search] query="${keywords}" moderate=${moderate} retries=${retries} iterations=${iterations}`);

    try {

        let token = await getToken(keywords);
        console.log('[image_search] Obtained token');

        let params = {
            "l": "wt-wt",
            "o": "json",
            "q": keywords,
            "vqd": token,
            "f": ",,,",
            "p": "" + (p)
        }

        let data = null;
        let itr = 0;


        while (itr < iterations) {

            while (true) {
                try {

                    console.log(`[image_search] Fetching iteration=${itr} attempt=${attempt + 1} url=${reqUrl}`);

                    let response = await axios.get(reqUrl, {
                        params,
                        headers
                    })

                    data = response.data;
                    if (!data.results) throw "No results";
                    console.log(`[image_search] Received ${data.results.length} results`);
                    break;

                } catch (error) {
                    console.error(error)
                    attempt += 1;
                    if (attempt > retries) {
                        console.log('[image_search] Max retries exceeded, returning accumulated results');
                        return new Promise((resolve, reject) => {
                            resolve(results)
                        });
                    }
                    await sleep(5000);
                    continue;
                }

            }
            
            results = [...results, ...data.results]
            console.log(`[image_search] Accumulated results count=${results.length}`);
            if (!data.next) {
                console.log('[image_search] No further pages available');
                return new Promise((resolve, reject) => {
                    resolve(results)
                });
            }
            reqUrl = url + data["next"];
            itr += 1;
            attempt = 0;
        }

    } catch (error) {
        console.error(error);
    }
    console.log(`[image_search] Finished with total results=${results.length}`);
    return results;

}



async function* image_search_generator({ query, moderate, retries, iterations }) {

    let reqUrl = url + 'i.js';
    let keywords = query
    let p = moderate ? 1 : -1;      // by default moderate false
    let attempt = 0;
    if (!retries) retries = max_retries; // default to max if none provided
    if (!iterations) iterations = max_iter; // default to max if none provided

    console.log(`[image_search_generator] query="${keywords}" moderate=${moderate} retries=${retries} iterations=${iterations}`);


    try {

        let token = await getToken(keywords);
        console.log('[image_search_generator] Obtained token');

        let params = {
            "l": "wt-wt",
            "o": "json",
            "q": keywords,
            "vqd": token,
            "f": ",,,",
            "p": "" + (p)
        }
        
        let itr = 0;


        while (itr < iterations) {

            let data = null;

            while (true) {
                try {

                    console.log(`[image_search_generator] Fetching iteration=${itr} attempt=${attempt + 1} url=${reqUrl}`);

                    let response = await axios.get(reqUrl, {
                        params,
                        headers
                    })

                    data = response.data;
                    if (!data.results) throw "No results";
                    console.log(`[image_search_generator] Received ${data.results.length} results`);
                    break;

                } catch (error) {
                    console.error(error)
                    attempt += 1;
                    if (attempt > retries) {

                        yield await new Promise((resolve, reject) => {                            
                            console.log('[image_search_generator] Max retries exceeded, rejecting iteration');
                            reject('attempt finished')                            
                        })

                    }
                    await sleep(5000);
                    continue;
                }

            }
            

            yield await new Promise((resolve, reject) => {                
                console.log(`[image_search_generator] Yielding ${data.results.length} results`);
                resolve(data.results)
            })


            reqUrl = url + data["next"];
            itr += 1;
            attempt = 0;
        }

    } catch (error) {
        console.error(error);
    }

}



module.exports = { image_search, image_search_generator };
