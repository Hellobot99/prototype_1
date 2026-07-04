import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import ProfileContent from "./ProfileContent";

export default async function ProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-lg mx-auto p-6 space-y-4 min-h-screen bg-gray-50 dark:bg-gray-900">
      <h1 className="text-xl font-bold">Profile</h1>
      <ProfileContent email={user.email ?? ""} createdAt={user.created_at} />
    </div>
  );
}
