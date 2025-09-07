import type { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Astral Field API Documentation</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            line-height: 1.6;
            background: #f8fafc;
        }
        .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem;
            border-radius: 12px;
            margin-bottom: 2rem;
        }
        .endpoint-category {
            background: white;
            margin: 1.5rem 0;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            overflow: hidden;
        }
        .category-header {
            background: #4f46e5;
            color: white;
            padding: 1rem 1.5rem;
            font-size: 1.25rem;
            font-weight: 600;
        }
        .endpoint {
            border-bottom: 1px solid #e5e7eb;
            padding: 1.5rem;
        }
        .endpoint:last-child {
            border-bottom: none;
        }
        .method {
            display: inline-block;
            padding: 0.25rem 0.75rem;
            border-radius: 4px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-right: 0.5rem;
        }
        .method.get { background: #dcfce7; color: #166534; }
        .method.post { background: #fef3c7; color: #92400e; }
        .path {
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 1.1rem;
            font-weight: 600;
            color: #1f2937;
        }
        .description {
            color: #6b7280;
            margin: 0.5rem 0;
        }
        .features {
            display: flex;
            gap: 0.5rem;
            margin-top: 0.5rem;
        }
        .feature {
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.75rem;
            background: #e0e7ff;
            color: #3730a3;
        }
        .nav {
            background: white;
            padding: 1rem;
            border-radius: 8px;
            margin-bottom: 2rem;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .nav a {
            margin-right: 1rem;
            color: #4f46e5;
            text-decoration: none;
            font-weight: 500;
        }
        .nav a:hover {
            text-decoration: underline;
        }
        code {
            background: #f3f4f6;
            padding: 0.25rem 0.5rem;
            border-radius: 4px;
            font-size: 0.875rem;
        }
        pre {
            background: #1f2937;
            color: #f9fafb;
            padding: 1rem;
            border-radius: 6px;
            overflow-x: auto;
            font-size: 0.875rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Astral Field API Documentation</h1>
        <p>Comprehensive fantasy football analytics and AI-powered insights API</p>
    </div>

    <div class="nav">
        <a href="/api/docs">JSON Documentation</a>
        <a href="/api/docs?format=openapi">OpenAPI Spec</a>
        <a href="/api/health">System Health</a>
        <a href="/api/admin/monitoring">Monitoring Dashboard</a>
    </div>

    <div id="documentation">
        <p>Loading API documentation...</p>
    </div>

    <script>
        async function loadDocumentation() {
            try {
                const response = await fetch('/api/docs');
                const docs = await response.json();
                renderDocumentation(docs);
            } catch (error) {
                document.getElementById('documentation').innerHTML = 
                    '<p style="color: red;">Failed to load documentation: ' + error.message + '</p>';
            }
        }

        function renderDocumentation(docs) {
            const container = document.getElementById('documentation');
            let html = '';

            for (const [categoryName, endpoints] of Object.entries(docs.endpoints)) {
                html += \`
                    <div class="endpoint-category">
                        <div class="category-header">
                            \${categoryName.charAt(0).toUpperCase() + categoryName.slice(1)} Endpoints
                        </div>
                \`;

                for (const [path, endpoint] of Object.entries(endpoints)) {
                    const methods = endpoint.methods.map(m => 
                        \`<span class="method \${m.toLowerCase()}">\${m}</span>\`
                    ).join('');
                    
                    const features = [];
                    if (endpoint.caching) features.push(\`Cached: \${endpoint.caching}\`);
                    if (endpoint.monitoring) features.push('Monitored');
                    if (endpoint.authentication) features.push('Auth Required');

                    const featuresHtml = features.map(f => 
                        \`<span class="feature">\${f}</span>\`
                    ).join('');

                    html += \`
                        <div class="endpoint">
                            <div>
                                \${methods}
                                <span class="path">\${path}</span>
                            </div>
                            <div class="description">\${endpoint.description}</div>
                            \${featuresHtml ? \`<div class="features">\${featuresHtml}</div>\` : ''}
                            \${endpoint.responses && endpoint.responses[200] && endpoint.responses[200].example ? 
                                \`<details style="margin-top: 1rem;">
                                    <summary style="cursor: pointer; font-weight: 500;">Example Response</summary>
                                    <pre>\${JSON.stringify(endpoint.responses[200].example, null, 2)}</pre>
                                </details>\` : ''
                            }
                        </div>
                    \`;
                }

                html += '</div>';
            }

            // Add additional info
            html += \`
                <div class="endpoint-category">
                    <div class="category-header">System Information</div>
                    <div class="endpoint">
                        <h3>Rate Limiting</h3>
                        <p>\${docs.rateLimit.default}</p>
                        <p>Authenticated: \${docs.rateLimit.authenticated}</p>
                    </div>
                    <div class="endpoint">
                        <h3>Caching</h3>
                        <p>\${docs.caching.analytics}</p>
                        <p>\${docs.caching.health}</p>
                    </div>
                    <div class="endpoint">
                        <h3>Authentication</h3>
                        <p>\${docs.authentication.adminEndpoints.description}</p>
                        <p>Header: <code>\${docs.authentication.adminEndpoints.header}</code></p>
                    </div>
                </div>
            \`;

            container.innerHTML = html;
        }

        loadDocumentation();
    </script>
</body>
</html>
  `

  res.setHeader('Content-Type', 'text/html')
  res.status(200).send(html)
}