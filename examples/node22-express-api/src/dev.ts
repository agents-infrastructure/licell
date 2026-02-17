import { app } from './app';

const port = Number(process.env.PORT || 9000);
app.listen(port, '0.0.0.0', () => {
  console.log(`[node22-express-api] listening on http://127.0.0.1:${port}`);
});
