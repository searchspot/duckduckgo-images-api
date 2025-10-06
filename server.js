require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const { image_search } = require('./src/api');

// Authentication middleware
fastify.addHook('onRequest', async (request, reply) => {
    const token = request.headers['x-api-token'] || request.headers['authorization']?.replace('Bearer ', '');

    if (!token || token !== process.env.API_TOKEN) {
        reply.code(401).send({ error: 'Unauthorized - Invalid or missing API token' });
    }
});

// Health check endpoint (no auth required, checked before auth hook)
fastify.get('/health', {
    onRequest: (request, reply, done) => done() // Skip auth for health check
}, async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
});

// Image search endpoint
fastify.get('/search', async (request, reply) => {
    const { query, moderate, retries, iterations } = request.query;

    if (!query) {
        return reply.code(400).send({ error: 'Query parameter is required' });
    }

    try {
        const results = await image_search({
            query,
            moderate: moderate === 'true',
            retries: retries ? parseInt(retries) : undefined,
            iterations: iterations ? parseInt(iterations) : undefined
        });

        return {
            success: true,
            query,
            count: results.length,
            results
        };
    } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// POST endpoint for search (alternative with body)
fastify.post('/search', async (request, reply) => {
    const { query, moderate, retries, iterations } = request.body;

    if (!query) {
        return reply.code(400).send({ error: 'Query parameter is required' });
    }

    try {
        const results = await image_search({
            query,
            moderate,
            retries,
            iterations
        });

        return {
            success: true,
            query,
            count: results.length,
            results
        };
    } catch (error) {
        fastify.log.error(error);
        return reply.code(500).send({
            error: 'Internal server error',
            message: error.message
        });
    }
});

// Start server
const start = async () => {
    try {
        const port = process.env.PORT || 3000;
        const host = process.env.HOST || '0.0.0.0';

        if (!process.env.API_TOKEN) {
            fastify.log.error('API_TOKEN environment variable is not set!');
            process.exit(1);
        }

        await fastify.listen({ port, host });
        fastify.log.info(`Server running on http://${host}:${port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();