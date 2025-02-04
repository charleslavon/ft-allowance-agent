/** @type {import('next').NextConfig} */
const nextConfig = {
    async rewrites(){
        return [
            {
                source: "/.well-known/ai-plugin.json",
                destination: "/api/ai-plugin"
            }
        ]
    }
};

export default nextConfig;