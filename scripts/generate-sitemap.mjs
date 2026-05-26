import fs from 'fs';
import path from 'path';

function getEnvVariable(name) {
  if (process.env[name]) return process.env[name];
  try {
    const envPath = path.resolve('.env');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      const lines = content.split('\n');
      for (const line of lines) {
        const parts = line.split('=');
        if (parts.length >= 2 && parts[0].trim() === name) {
          return parts.slice(1).join('=').trim().replace(/(^['"]|['"]$)/g, '');
        }
      }
    }
  } catch (e) {
    console.error('Error reading .env file:', e);
  }
  return null;
}

const supabaseUrl = getEnvVariable('VITE_SUPABASE_URL');
const supabaseKey = getEnvVariable('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in environment or .env file!');
  process.exit(1);
}

async function fetchRestaurants() {
  let cleanUrl = supabaseUrl.replace(/\/$/, '');
  if (cleanUrl.endsWith('/rest/v1')) {
    cleanUrl = cleanUrl.slice(0, -8);
  }
  
  const url = `${cleanUrl}/rest/v1/restaurants?select=id,slug,name`;
  console.log(`Fetching from: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    }
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Supabase request failed: ${response.status} ${response.statusText} - ${errorText}`);
  }
  return await response.json();
}

async function run() {
  try {
    console.log('Fetching restaurants from Supabase...');
    const restaurants = await fetchRestaurants();
    console.log(`Found ${restaurants.length} restaurants.`);

    const urls = [
      'https://www.itfood.in/',
      'https://www.itfood.in/restaurants',
    ];

    for (const r of restaurants) {
      let slug = r.slug;
      if (!slug) {
        // Fallback to name slugification or ID
        slug = r.name
          ? r.name.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
          : r.id;
      }
      urls.push(`https://www.itfood.in/restaurant/${slug}`);
    }

    // Generate sitemap.xml
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url}</loc>
    <changefreq>daily</changefreq>
    <priority>${url === 'https://www.itfood.in/' ? '1.0' : url.includes('/restaurant/') ? '0.8' : '0.6'}</priority>
  </url>`).join('\n')}
</urlset>`;

    const publicDir = path.resolve('public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir, { recursive: true });
    }

    fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapContent, 'utf-8');
    console.log('✓ Created public/sitemap.xml');

    // Generate robots.txt
    const robotsContent = `# https://www.robotstxt.org/robotstxt.html
User-agent: *
Allow: /

# Disallowed paths
Disallow: /admin
Disallow: /api

# Sitemap URL
Sitemap: https://www.itfood.in/sitemap.xml
`;

    fs.writeFileSync(path.join(publicDir, 'robots.txt'), robotsContent, 'utf-8');
    console.log('✓ Created public/robots.txt');

  } catch (error) {
    console.error('Error generating sitemap:', error);
    process.exit(1);
  }
}

run();
