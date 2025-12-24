import ogs from 'open-graph-scraper';

export const getLinkPreview = async (url: string) => {
    if (!url) return null;
    try {
        const { result } = await ogs({ url, timeout: 3000 });
        if (result.success) {
            return {
                url,
                title: result.ogTitle || result.twitterTitle || "",
                description: result.ogDescription || result.twitterDescription || "",
                image: result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || "",
                siteName: result.ogSiteName || new URL(url).hostname,
                // favicon: `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`
            };
        }
    } catch (e) {
        console.error('OGS Fetch Error:', url, e);
    }
    return null;
};