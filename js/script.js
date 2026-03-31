// for the index.html page
        /**
         * News Ad System - Main Application
         * This module handles fetching, displaying, and tracking news articles
         * with enhanced monetization and SEO features
         */

        // Configuration
        const CONFIG = {
            NEWS_API_KEY: "a40d38e3781c473a9ee4317091460810", // Using demo key - replace with your own API key
            NEWS_API_BASE_URL: "https://newsapi.org/v2",
            COUNTRY: "us",
            PAGE_SIZE: 12,
            AUTO_UPDATE_INTERVAL: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
            PLACEHOLDER_IMAGE: "https://via.placeholder.com/400x200?text=No+Image+Available",
            TRENDING_COUNT: 5,
            LOAD_MORE_INCREMENT: 6
        };

        // State Management
        const state = {
            currentCategory: "general",
            articles: [],
            trendingArticles: [],
            clickLog: [],
            lastUpdated: null,
            currentPage: 1,
            totalResults: 0,
            isLoading: false
        };

        // DOM Elements
        const elements = {
            newsGrid: document.getElementById("newsGrid"),
            categoryFilters: document.getElementById("categoryFilters"),
            clickLogBody: document.getElementById("clickLogBody"),
            clearLogBtn: document.getElementById("clearLogBtn"),
            lastUpdated: document.getElementById("lastUpdated"),
            trendingNews: document.getElementById("trendingNews"),
            loadMoreBtn: document.getElementById("loadMoreBtn")
        };

        /**
         * Detects user device type
         * @returns {string} - Device type: 'mobile' or 'desktop'
         */
        function detectDevice() {
            return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
                ? 'mobile' 
                : 'desktop';
        }

        /**
         * Generates a custom summary for an article to avoid duplicate content
         * @param {Object} article - Article data object
         * @returns {string} - Custom summary
         */
        function generateCustomSummary(article) {
            const title = article.title || "";
            const description = article.description || "";
            const source = article.source?.name || "Unknown source";

            // Create a unique summary combining title, description, and source
            const summary = `Breaking news from ${source}: ${title}. ${description}`;

            // Ensure summary is 2-4 lines (approximately 150-300 characters)
            return summary.length > 300 
                ? summary.substring(0, 300) + "..." 
                : summary;
        }

        /**
         * Generates SEO-friendly meta tags dynamically
         * @param {Object} article - Article data object
         */
        function generateSEOMetaTags(article) {
            const title = article.title || "UGTECH NEWS";
            const description = article.description || "Stay updated with the latest news from around the world";
            const imageUrl = article.urlToImage || CONFIG.PLACEHOLDER_IMAGE;

            // Update page title
            document.title = `${title} - UGTECH NEWS`;

            // Update meta description
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
                metaDescription.setAttribute('content', description);
            }

            // Update Open Graph tags
            const ogTitle = document.querySelector('meta[property="og:title"]');
            const ogDescription = document.querySelector('meta[property="og:description"]');
            const ogImage = document.querySelector('meta[property="og:image"]');

            if (ogTitle) ogTitle.setAttribute('content', title);
            if (ogDescription) ogDescription.setAttribute('content', description);
            if (ogImage) ogImage.setAttribute('content', imageUrl);

            // Update Twitter Card tags
            const twitterTitle = document.querySelector('meta[name="twitter:title"]');
            const twitterDescription = document.querySelector('meta[name="twitter:description"]');
            const twitterImage = document.querySelector('meta[name="twitter:image"]');

            if (twitterTitle) twitterTitle.setAttribute('content', title);
            if (twitterDescription) twitterDescription.setAttribute('content', description);
            if (twitterImage) twitterImage.setAttribute('content', imageUrl);
        }

        /**
         * Generates structured data (schema markup) for an article
         * @param {Object} article - Article data object
         * @returns {Object} - Schema markup object
         */
        function generateArticleSchema(article) {
            return {
                "@context": "https://schema.org",
                "@type": "NewsArticle",
                "headline": article.title,
                "description": article.description,
                "image": [article.urlToImage || CONFIG.PLACEHOLDER_IMAGE],
                "author": {
                    "@type": "Organization",
                    "name": article.source?.name || "Unknown source"
                },
                "publisher": {
                    "@type": "Organization",
                    "name": "UGTECH NEWS",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://yourwebsite.com/logo.png"
                    }
                },
                "datePublished": article.publishedAt,
                "dateModified": article.publishedAt,
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": article.url
                }
            };
        }

        /**
         * Fetches news articles from the API for a specific category
         * @param {string} category - The news category to fetch
         * @param {number} page - Page number for pagination
         * @returns {Promise<Object>} - Object containing articles and total results
         */
     async function fetchNews(category, page = 1) {
    try {
        // CHANGE: Point to your local Vercel API function instead of external URL
        const url = `/api/news?category=${category}&page=${page}`;
        
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return {
            articles: data.articles || [],
            totalResults: data.totalResults || 0
        };
    } catch (error) {
        console.error("Error fetching news:", error);
        throw error;
    }
}


        /**
         * Renders news articles to the grid
         * @param {Array} articles - Array of news articles to display
         * @param {boolean} append - Whether to append to existing content
         */
        function renderNews(articles, append = false) {
            if (!append) {
                elements.newsGrid.innerHTML = "";
            }

            if (articles.length === 0) {
                if (!append) {
                    elements.newsGrid.innerHTML = '<div class="error">No articles found for this category. Please try another category.</div>';
                }
                return;
            }

            articles.forEach((article, index) => {
                const articleElement = createNewsCard(article, index);
                elements.newsGrid.appendChild(articleElement);
            });
        }

        /**
         * Creates a news card element for an article
         * @param {Object} article - Article data object
         * @param {number} index - Index of the article in the array
         * @returns {HTMLElement} - News card element
         */
        function createNewsCard(article, index) {
            const card = document.createElement("div");
            card.className = "news-card";
            card.dataset.articleIndex = index;

            const imageUrl = article.urlToImage || CONFIG.PLACEHOLDER_IMAGE;
            const publishedDate = article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString()
                : "No date available";
            const sourceName = article.source?.name || "Unknown source";
            const customSummary = generateCustomSummary(article);

            card.innerHTML = `
                <img src="${imageUrl}" alt="${article.title}" class="news-image">
                <div class="news-content">
                    <div class="news-meta">
                        <span>${sourceName}</span>
                        <span>${publishedDate}</span>
                    </div>
                    <h3 class="news-title">${article.title || "No title available"}</h3>
                    <p class="news-description">${customSummary}</p>
                    <a href="${article.url}" target="_blank" class="read-more-btn" rel="nofollow noopener">Read more</a>
                </div>
            `;

            // Add click event listener to track clicks
            card.addEventListener("click", () => trackClick(article));

            return card;
        }

        /**
         * Tracks a click on a news article with enhanced tracking
         * @param {Object} article - The article that was clicked
         */
        function trackClick(article) {
            // Check for spam clicks (multiple clicks within short time)
            const now = Date.now();
            const recentClicks = state.clickLog.filter(click => 
                click.title === article.title && 
                (now - new Date(click.timestamp).getTime()) < 5000 // 5 seconds
            );

            if (recentClicks.length > 2) {
                console.warn("Potential spam click detected");
                return; // Ignore potential spam clicks
            }

            const clickData = {
                title: article.title || "No title",
                timestamp: new Date().toISOString(),
                url: article.url,
                device: detectDevice(),
                category: state.currentCategory,
                source: article.source?.name || "Unknown source"
            };

            state.clickLog.push(clickData);
            renderClickLog();
            updateTrendingNews();
        }

        /**
         * Renders the click log table
         */
        function renderClickLog() {
            if (state.clickLog.length === 0) {
                elements.clickLogBody.innerHTML = '<tr><td colspan="3" class="empty-log-message">No clicks logged yet</td></tr>';
                return;
            }

            elements.clickLogBody.innerHTML = state.clickLog
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .map(click => `
                    <tr>
                        <td>${click.title}</td>
                        <td>${new Date(click.timestamp).toLocaleString()}</td>
                        <td><span class="badge bg-${click.device === 'mobile' ? 'primary' : 'secondary'}">${click.device}</span></td>
                    </tr>
                `)
                .join("");
        }

        /**
         * Updates trending news based on click data
         */
        function updateTrendingNews() {
            // Count clicks per article
            const clickCounts = {};
            state.clickLog.forEach(click => {
                if (clickCounts[click.title]) {
                    clickCounts[click.title]++;
                } else {
                    clickCounts[click.title] = 1;
                }
            });

            // Sort articles by click count
            const trendingArticles = Object.entries(clickCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, CONFIG.TRENDING_COUNT);

            // Render trending news
            if (trendingArticles.length === 0) {
                elements.trendingNews.innerHTML = '<p class="text-muted">No trending news yet</p>';
                return;
            }

            elements.trendingNews.innerHTML = trendingArticles.map(([title, count], index) => {
                const article = state.articles.find(a => a.title === title);
                if (!article) return '';

                const publishedDate = article.publishedAt
                    ? new Date(article.publishedAt).toLocaleDateString()
                    : "No date available";

                return `
                    <div class="trending-item">
                        <div class="trending-title">
                            <span class="badge bg-danger me-2">${index + 1}</span>
                            ${title}
                        </div>
                        <div class="trending-meta">
                            <span>${publishedDate}</span>
                            <span class="ms-2"><i class="bi bi-hand-index-thumb"></i> ${count} clicks</span>
                        </div>
                    </div>
                `;
            }).join('');
        }

        /**
         * Loads and displays news for a specific category
         * @param {string} category - The category to load news for
         * @param {boolean} append - Whether to append to existing content
         */
        async function loadNews(category, append = false) {
            if (state.isLoading) return;
            state.isLoading = true;

            if (!append) {
                elements.newsGrid.innerHTML = '<div class="loading">Loading news...</div>';
                elements.loadMoreBtn.disabled = true;
            }

            try {
                const page = append ? state.currentPage + 1 : 1;
                const { articles, totalResults } = await fetchNews(category, page);

                if (append) {
                    state.articles = [...state.articles, ...articles];
                    state.currentPage = page;
                } else {
                    state.articles = articles;
                    state.currentPage = 1;
                }

                state.totalResults = totalResults;
                state.currentCategory = category;
                state.lastUpdated = new Date();

                renderNews(articles, append);
                updateLastUpdatedDisplay();
                updateLoadMoreButton();
                updateTrendingNews();

                // Update SEO for first article
                if (articles.length > 0 && !append) {
                    generateSEOMetaTags(articles[0]);
                    const schema = generateArticleSchema(articles[0]);
                    const schemaScript = document.createElement('script');
                    schemaScript.type = 'application/ld+json';
                    schemaScript.textContent = JSON.stringify(schema);
                    document.head.appendChild(schemaScript);
                }
            } catch (error) {
                if (!append) {
                    elements.newsGrid.innerHTML = '<div class="error">Failed to load news. Please try again later.</div>';
                }
                console.error("Error loading news:", error);
            } finally {
                state.isLoading = false;
                elements.loadMoreBtn.disabled = false;
            }
        }

        /**
         * Updates the last updated display
         */
        function updateLastUpdatedDisplay() {
            if (state.lastUpdated) {
                elements.lastUpdated.textContent = `Last updated: ${state.lastUpdated.toLocaleString()}`;
            }
        }

        /**
         * Updates the load more button state
         */
        function updateLoadMoreButton() {
            const loadedArticles = state.currentPage * CONFIG.PAGE_SIZE;
            elements.loadMoreBtn.disabled = loadedArticles >= state.totalResults;

            if (loadedArticles >= state.totalResults) {
                elements.loadMoreBtn.textContent = 'No more articles';
            } else {
                elements.loadMoreBtn.textContent = 'Load More News';
            }
        }

        /**
         * Sets up event listeners for the application
         */
        function setupEventListeners() {
            // Category filter buttons
            elements.categoryFilters.addEventListener("click", (event) => {
                if (event.target.classList.contains("filter-btn")) {
                    // Update active state
                    document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("active"));
                    event.target.classList.add("active");

                    // Load news for selected category
                    const category = event.target.dataset.category;
                    loadNews(category);
                }
            });

            // Load more button
            elements.loadMoreBtn.addEventListener("click", () => {
                loadNews(state.currentCategory, true);
            });

            // Clear log button
            elements.clearLogBtn.addEventListener("click", () => {
                state.clickLog = [];
                renderClickLog();
                updateTrendingNews();
            });
        }

        /**
         * Checks if news needs to be updated based on time elapsed
         * @returns {boolean} - Whether news should be updated
         */
        function shouldUpdateNews() {
            if (!state.lastUpdated) return true;
            const timeSinceLastUpdate = new Date() - state.lastUpdated;
            return timeSinceLastUpdate >= CONFIG.AUTO_UPDATE_INTERVAL;
        }

        /**
         * Sets up automatic news updates
         */
        function setupAutoUpdate() {
            setInterval(() => {
                if (shouldUpdateNews()) {
                    loadNews(state.currentCategory);
                }
            }, CONFIG.AUTO_UPDATE_INTERVAL);
        }

        /**
         * Initializes the application
         */
        function init() {
            setupEventListeners();
            loadNews(state.currentCategory);
            setupAutoUpdate();
        }

        // Start the application when DOM is ready
        document.addEventListener("DOMContentLoaded", init);





        // for the contact.html page
        const form = document.getElementById('contactForm');
const submitBtn = form.querySelector('button[type="submit"]');

form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    formData.append("access_key", "7988c527-c110-4998-a763-7cb5b8c505b4");

    const originalText = submitBtn.textContent;

    submitBtn.textContent = "Sending...";
    submitBtn.disabled = true;

    try {
        const response = await fetch("https://api.web3forms.com/submit", {
            method: "POST",
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            alert("Success! Your message has been sent.");
            form.reset();
        } else {
            alert("Error: " + data.message);
        }

    } catch (error) {
        alert("Something went wrong. Please try again.");
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
});