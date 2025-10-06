# duckduckgo-images-api

A lightweight node package to programmatically obtain image search results from DuckDuckGo search engine.

## usage

To install, run:
```
npm i duckduckgo-images-api
```
When using TypeScript, run:
```
npm i @types/duckduckgo-images-api
```

The package provides simple async api. And uses following config object as input:
```javascript
{ 
    query: "search term", 
    moderate : false,   
    iterations : 2 ,
    retries  : 2
}
```
- query param is mandatory
- moderate (optional) to moderate search results if none provided defaults to moderation off (false)
- iterations (optional) limit the number of result sets fetched,  default 2
- retries (optional) limit retries per iteration, default 2

image_search function return a promise that resolves to array of complete results.
```javascript
image_search({ query: "birds", moderate: true }).then(results=>console.log(results))
```
image_search_generator function is a async generator that yield promise of result set on each iteration. Useful for large iterations. Please check the node version compatability for this syntax.

```javascript
async function main(){
    for await (let resultSet of image_search_generator({ query: "birds", moderate: true ,iterations :4})){
      console.log(resultSet)
    }
  }
  
main().catch(console.log);
```

Please feel free to report any issues or feature requests.

## REST API Server

This package now includes a lightweight REST API server built with Fastify for making image search requests via HTTP.

### Local Development

1. **Setup environment variables:**
```bash
cp .env.example .env
# Edit .env and set a secure API_TOKEN
```

2. **Start the server:**
```bash
npm start
```

3. **Make API requests:**

**GET request:**
```bash
curl -H "x-api-token: your-secret-token" \
  "http://localhost:3000/search?query=birds&moderate=true&iterations=2"
```

**POST request:**
```bash
curl -X POST \
  -H "x-api-token: your-secret-token" \
  -H "Content-Type: application/json" \
  -d '{"query":"birds","moderate":true,"iterations":2}' \
  http://localhost:3000/search
```

### API Endpoints

- **GET/POST /search** - Search for images
  - Authentication: Required (via `x-api-token` header or `Authorization: Bearer <token>`)
  - Query parameters (GET): `query`, `moderate`, `retries`, `iterations`
  - Body (POST): `{ "query": "...", "moderate": true, "retries": 2, "iterations": 2 }`
  - Response: `{ "success": true, "query": "...", "count": 100, "results": [...] }`

- **GET /health** - Health check endpoint (no authentication required)
  - Response: `{ "status": "ok", "timestamp": "..." }`

### Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone)

1. **Install Vercel CLI:**
```bash
npm i -g vercel
```

2. **Set environment variable:**
```bash
vercel env add API_TOKEN
# Enter your secret API token when prompted
```

3. **Deploy:**
```bash
vercel --prod
```

Alternatively, connect your GitHub repository to Vercel and set the `API_TOKEN` environment variable in the Vercel dashboard.

### note

DuckDuckGo provides an instant answer API. This package does not use this route. This package mocks the browser behaviour using the same request format. Use it wisely.
