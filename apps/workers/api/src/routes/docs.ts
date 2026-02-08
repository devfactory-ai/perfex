/**
 * API Documentation Routes
 * Serves OpenAPI spec and Swagger UI
 */

import { Hono } from 'hono';
import { openApiSpec } from '../docs/openapi';
import type { Env } from '../types';

const docs = new Hono<{ Bindings: Env }>();

/**
 * GET /docs/openapi.json
 * Returns the OpenAPI 3.0 specification as JSON
 */
docs.get('/openapi.json', (c) => {
  return c.json(openApiSpec);
});

/**
 * GET /docs/openapi.yaml
 * Returns the OpenAPI 3.0 specification as YAML (for compatibility)
 */
docs.get('/openapi.yaml', (c) => {
  // Simple JSON to YAML-ish conversion for basic compatibility
  const yamlContent = JSON.stringify(openApiSpec, null, 2);
  return c.text(yamlContent, 200, {
    'Content-Type': 'application/x-yaml',
  });
});

/**
 * GET /docs
 * Serves Swagger UI for interactive API documentation
 */
docs.get('/', (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Perfex API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
    .swagger-ui .topbar {
      background-color: #1e293b;
    }
    .swagger-ui .topbar .download-url-wrapper .select-label {
      color: #fff;
    }
    .swagger-ui .info .title {
      color: #1e293b;
    }
    .swagger-ui .opblock.opblock-post {
      background: rgba(73, 204, 144, .1);
      border-color: #49cc90;
    }
    .swagger-ui .opblock.opblock-get {
      background: rgba(97, 175, 254, .1);
      border-color: #61affe;
    }
    .swagger-ui .opblock.opblock-put {
      background: rgba(252, 161, 48, .1);
      border-color: #fca130;
    }
    .swagger-ui .opblock.opblock-delete {
      background: rgba(249, 62, 62, .1);
      border-color: #f93e3e;
    }
    .swagger-ui .btn.authorize {
      background-color: #1e293b;
      border-color: #1e293b;
      color: #fff;
    }
    .swagger-ui .btn.authorize:hover {
      background-color: #334155;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: "/api/v1/docs/openapi.json",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        persistAuthorization: true,
        displayRequestDuration: true,
        tryItOutEnabled: true,
        syntaxHighlight: {
          theme: "monokai"
        }
      });
      window.ui = ui;
    };
  </script>
</body>
</html>
  `;
  return c.html(html);
});

/**
 * GET /docs/redoc
 * Serves ReDoc for alternative documentation view
 */
docs.get('/redoc', (c) => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Perfex API Documentation - ReDoc</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Inter', sans-serif;
    }
  </style>
</head>
<body>
  <redoc spec-url="/api/v1/docs/openapi.json"></redoc>
  <script src="https://cdn.redoc.ly/redoc/latest/bundles/redoc.standalone.js"></script>
</body>
</html>
  `;
  return c.html(html);
});

export { docs };
