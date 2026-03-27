import DashboardPageLayout from "@/components/dashboard/layout";
import NewsFeed from "@/components/investment/news-feed";
import BracketsIcon from "@/components/icons/brackets";
import type { MarketNews } from "@/types/dashboard";

async function getNews(): Promise<MarketNews[]> {
  try {
    const res = await fetch("http://localhost:8000/news", { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Failed to fetch news:", error);
    return [];
  }
}

export default async function NewsPage() {
  const news = await getNews();

  return (
    <DashboardPageLayout
      header={{
        title: "News & Analysis",
        description: "Market News with Predicted Impact",
        icon: BracketsIcon,
      }}
    >
      <div>
        <NewsFeed news={news} />
      </div>
    </DashboardPageLayout>
  );
}
