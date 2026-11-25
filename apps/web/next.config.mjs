const destinoDaApi = process.env.API_INTERNAL_URL ?? 'http://localhost:3001';

export default {
  output: 'standalone',
  outputFileTracingRoot: new URL('.', import.meta.url).pathname,
  async rewrites() {
    return [{ source: '/api/:caminho*', destination: `${destinoDaApi}/api/:caminho*` }];
  },
};
