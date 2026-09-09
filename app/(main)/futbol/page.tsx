import { redirect } from "next/navigation";

export default function FootballPage() {
  redirect("/live-tv?section=football");
}
