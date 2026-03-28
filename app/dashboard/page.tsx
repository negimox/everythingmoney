import DashboardPageLayout from "@/components/dashboard/layout";
import AdvisorDashboard from "@/components/advisor/advisor-dashboard";
import BracketsIcon from "@/components/icons/brackets";

export default function DashboardPage() {
  return (
    <DashboardPageLayout
      header={{
        title: "Financial Advisor",
        icon: BracketsIcon,
      }}
    >
      <AdvisorDashboard />
    </DashboardPageLayout>
  );
}
