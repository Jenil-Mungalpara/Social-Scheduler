import { PlusIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PLATFORMS } from '../assets/assets'
import AccountList from '../components/AccountList'
import PlatformPickerModel from '../components/PlatformPickerModel'
import toast from 'react-hot-toast'
import api from '../api/axios'

const Accounts = () => {

  const [accounts, setAccounts] = useState<any[]>([])
  const [connecting, setConnecting] = useState<string | null>(null)
  const [showPlatformPicker, setShowPlatformPicker] = useState(false)

  const fetchAccounts = async (isSync = false, platform?: string | null, successMsg?: string) => {
    try {
      if (isSync) {
        const label = platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : "Social Media";
        toast.loading(`Syncing ${label} account...`, { id: "sync" });
        await api.get("/api/oauth/sync");
        toast.success(successMsg || "Accounts synced!", { id: "sync" })
      }

      const { data } = await api.get("/api/accounts")
      const list = Array.isArray(data) ? data : data?.accounts || [];
      setAccounts(list)
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to load accounts");
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connectedPlatform = params.get("connected");
    const connectedUsername = params.get("username");
    const syncNeeded = params.get("sync") === "true";
    const errorMsg = params.get("error");

    window.history.replaceState({}, document.title, window.location.pathname);

    if (connectedPlatform) {
      const label = connectedPlatform.charAt(0).toUpperCase() + connectedPlatform.slice(1);
      const handle = connectedUsername ? ` (@${connectedUsername})` : ""
      fetchAccounts(true, connectedPlatform, `${label}${handle} connected!`)
    } else if (errorMsg) {
      toast.error(`Connection failed: ${decodeURIComponent(errorMsg)}`)
      fetchAccounts();
    } else if (syncNeeded) {
      fetchAccounts(true, null, "Accounts synced!")
    } else {
      fetchAccounts()
    }
  }, [])

  const handleDisconnect = async (accountId: string) => {
    try {
      toast.loading("Disconnecting account...", { id: "disconnect" });
      await api.delete(`/api/accounts/${accountId}`);
      setAccounts((prev) => prev.filter((a) => a._id !== accountId));
      toast.success("Account disconnected successfully!", { id: "disconnect" });
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || "Failed to disconnect account", { id: "disconnect" });
    }
  }

  const handleConnect = async (platformId: string) => {
    try {
      setConnecting(platformId);
      const { data } = await api.get(`/api/oauth/${platformId}/url`);
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No authorization URL returned");
      }
    } catch (error: any) {
      toast.error(error?.response?.data?.message || error?.message || `Failed to connect ${platformId}`);
      setConnecting(null);
    }
  }

  const connectedIds = accounts.map((a) => a.platform);


  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-sm">
        <div>
          <h2 className="text-xl text-slate-900">Connected Accounts</h2>
          <p className="text-slate-500 text-sm mt-0.5">{accounts.length} of {PLATFORMS.length} platforms connected</p>
        </div>
        <button onClick={() => setShowPlatformPicker(true)} className="flex items-center gap-2 px-5 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-full font-medium transition-all w-full sm:w-auto justify-center">
          <PlusIcon className="size-4" /> Connect Account
        </button>
      </div>


      {/* Platform picker modal */}
      {showPlatformPicker && <PlatformPickerModel connectedIds={connectedIds} connecting={connecting} onClose={() => setShowPlatformPicker(false)} onConnect={handleConnect} />}



      <AccountList accounts={accounts} onDisconnect={handleDisconnect} />




    </div>


  )
}

export default Accounts