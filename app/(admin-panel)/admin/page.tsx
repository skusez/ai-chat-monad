import { getBriefs } from "@/lib/db/queries";
import { redirect } from "next/navigation";
import { BriefBoard } from "@/components/brief-board";
import { auth } from "@/app/(auth)/auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FileText, Users, CheckCircle, XCircle, BarChart3 } from "lucide-react";

export default async function AdminPage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  // In a real app, you would check if the user is an admin
  // For now, we'll just allow any logged-in user to access this page

  const briefs = await getBriefs();

  // Calculate statistics
  const totalBriefs = briefs.length;
  const pendingBriefs = briefs.filter(
    (brief) => brief.status === "pending"
  ).length;
  const approvedBriefs = briefs.filter(
    (brief) => brief.status === "approved"
  ).length;
  const rejectedBriefs = briefs.filter(
    (brief) => brief.status === "rejected"
  ).length;

  return (
    <div className="space-y-8 p-8 container">
      <div>
        <h1 className="text-3xl font-bold text-primary">Overview</h1>
        <p className="text-muted-foreground mt-1">
          Users have submitted their projects and you can review them here.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Total Submissions
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalBriefs}</div>
            <p className="text-xs text-muted-foreground">
              All time submissions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">
              Pending Review
            </CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBriefs}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting your review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedBriefs}</div>
            <p className="text-xs text-muted-foreground">
              {((approvedBriefs / totalBriefs) * 100 || 0).toFixed(1)}% approval
              rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedBriefs}</div>
            <p className="text-xs text-muted-foreground">
              {((rejectedBriefs / totalBriefs) * 100 || 0).toFixed(1)}%
              rejection rate
            </p>
          </CardContent>
        </Card>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-6">Submission Board</h2>
        <BriefBoard briefs={briefs} />
      </div>
    </div>
  );
}
