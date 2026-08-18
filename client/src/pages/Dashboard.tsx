import { ActivityIcon, CheckCircleIcon, ClockIcon, SendIcon, Share2Icon, TrendingUpIcon, SparklesIcon, LinkIcon } from "lucide-react"
import { useEffect, useState } from "react"
import api from "../api/axios"
import { useAuth } from "../context/auth.context"

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ scheduled: 0, published: 0, connectedAccounts: 0, todayScheduled: 0 })
  const [activities, setActivities] = useState<any[]>([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [postsRes, accountsRes, activityRes] = await Promise.all([
          api.get("/api/posts"),
          api.get("/api/accounts"),
          api.get("/api/activity")
        ]);

        const posts = Array.isArray(postsRes.data) ? postsRes.data : postsRes.data?.posts || [];
        const accounts = Array.isArray(accountsRes.data) ? accountsRes.data : accountsRes.data?.accounts || [];
        const acts = Array.isArray(activityRes.data) ? activityRes.data : activityRes.data?.activities || [];

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const scheduledPosts = posts.filter((p: any) => p.status === 'scheduled');
        const publishedPosts = posts.filter((p: any) => p.status === 'published');
        const todayCount = scheduledPosts.filter((p: any) => new Date(p.scheduledFor) >= startOfToday).length;

        setStats({
          scheduled: scheduledPosts.length,
          published: publishedPosts.length,
          connectedAccounts: accounts.filter((aa: any) => aa.status === 'connected').length,
          todayScheduled: todayCount
        });
        setActivities(acts);
      } catch (error: any) {
        console.error("Error fetching dashboard data", error);
      }
    };
    fetchDashboardData();
  }, [])

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const statCards = [
    {
      label: "Scheduled Posts",
      value: stats.scheduled,
      icon: ClockIcon,
      trend: stats.todayScheduled > 0 ? `+${stats.todayScheduled} today` : "Upcoming",
    },
    {
      label: "Published Posts",
      value: stats.published,
      icon: CheckCircleIcon,
      trend: "All time",
    },
    {
      label: "Connected Accounts",
      value: stats.connectedAccounts,
      icon: Share2Icon,
      trend: "Active",
    }
  ]

  const getActivityBadge = (actionType: string) => {
    switch (actionType) {
      case "post_published":
        return { label: "Published", bg: "bg-emerald-50 text-emerald-600 border-emerald-100", icon: SendIcon };
      case "post_scheduled":
        return { label: "Scheduled", bg: "bg-blue-50 text-blue-600 border-blue-100", icon: ClockIcon };
      case "account_connected":
        return { label: "Connected", bg: "bg-purple-50 text-purple-600 border-purple-100", icon: LinkIcon };
      case "content_generated":
        return { label: "Generated", bg: "bg-amber-50 text-amber-600 border-amber-100", icon: SparklesIcon };
      default:
        return { label: "Activity", bg: "bg-zinc-100 text-zinc-600 border-zinc-200", icon: ActivityIcon };
    }
  };

  return (
    <div className="space-y-8">
      {/* Welcome bar */}
      <div>
        <h2 className="text-2xl text-slate-900">
          {getGreeting()}{user?.name ? `, ${user.name}` : ""}! 👏
        </h2>
        <p className="text-slate-500 text-sm mt-0.5">Here's what's happening with your social accounts today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white hover:bg-red-50 relative border border-slate-200 rounded-2xl p-5 hover:border-red-200 transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className="text-3xl font-medium text-slate-800 tabular-nums">{card.value}</div>

              <div className="text-xs absolute right-4 top-4 text-red-500 flex items-center gap-1">
                <TrendingUpIcon className="size-3" />
                {card.trend}
              </div>
            </div>
            <p className="text-sm text-slate-500 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h2 className="text-slate-900 font-medium">Recent Activity</h2>
          <span className="text-sm text-slate-400">{activities.length} events</span>
        </div>

        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-6">
            <div className="size-12 bg-slate-100 rounded-xl flex items-center justify-center mb-3">
              <ActivityIcon className="size-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No activity yet</p>
            <p className="text-slate-400 text-sm mt-1">Connect accounts and schedule posts to see events here.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {activities.map((activity) => {
              const badge = getActivityBadge(activity.actionType);
              const BadgeIcon = badge.icon;
              return (
                <div key={activity._id} className="flex items-start gap-4 px-6 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="size-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 bg-zinc-100 text-zinc-600">
                    <BadgeIcon className="size-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${badge.bg} capitalize font-medium`}>
                        {badge.label}
                      </span>
                      <span className="text-xs text-slate-400 shrink-0">{new Date(activity.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600">{activity.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard