import { prisma } from "@/lib/prisma";

export type NotificationType = "info" | "success" | "warning" | "error";

export async function ensureWelcomeNotification(userId: string, name: string) {
  const existing = await prisma.notification.findFirst({
    where: { userId, title: "Bienvenido a LumixTV" },
    select: { id: true },
  });

  if (existing) return;

  await prisma.notification.create({
    data: {
      userId,
      title: "Bienvenido a LumixTV",
      message: `Hola ${name.split(" ")[0] ?? "Usuario"}, tu cuenta está activa. Explora películas, series, anime y TV en vivo.`,
      type: "success",
      href: "/",
    },
  });
}

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type?: NotificationType;
  href?: string;
}) {
  return prisma.notification.create({
    data: {
      userId: params.userId,
      title: params.title,
      message: params.message,
      type: params.type ?? "info",
      href: params.href,
    },
  });
}

export async function listNotifications(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
}

export async function countUnreadNotifications(userId: string) {
  return prisma.notification.count({
    where: { userId, read: false },
  });
}

export async function markNotificationRead(userId: string, notificationId: string) {
  return prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}
