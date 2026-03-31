// api/news.js
export default async function handler(req, res) {
  // 1. Get parameters from the request
  const { category = 'general', page = 1 } = req.query;

  // 2. Define your API Key (It is safer here than in frontend code)
  const apiKey = "a40d38e3781c473a9ee4317091460810"; 

  // 3. Construct the URL for NewsAPI
  const url = `https://newsapi.org/v2/top-headlines?country=us&category=${category}&pageSize=12&page=${page}&apiKey=${apiKey}`;

  try {
    // 4. Fetch data from NewsAPI
    const response = await fetch(url);
    
    if (!response.ok) {
        return res.status(response.status).json({ error: 'Failed to fetch data from NewsAPI' });
    }

    const data = await response.json();

    // 5. Set CORS headers (This allows your frontend to read the response)
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    
    // 6. Return the data to your frontend
    res.status(200).json(data);
    
  } catch (error) {
    console.error("Proxy Error:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
