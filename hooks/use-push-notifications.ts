import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import {
  registerForPushNotifications,
  setupNotificationChannel,
  addNotificationResponseListener,
  setBadgeCount,
} from "../services/push-notifications";
import { useNotifications } from "./use-notifications";
import { odooRpc } from "../services/odoo-rpc";

export function usePushNotifications() {
  const responseListener = useRef<Notifications.EventSubscription>();
  const notifications = useNotifications();

  useEffect(() => {
    if (Platform.OS === "web") return;

    // Setup
    setupNotificationChannel();
    registerForPushNotifications();

    // Handle notification taps — navigate to the relevant record
    responseListener.current = addNotificationResponseListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.model && data?.resId) {
        const baseUrl = odooRpc.getBaseUrl();
        const url = `${baseUrl}/web#model=${data.model}&id=${data.resId}&view_type=form`;
        router.push({
          pathname: "/(main)/webview",
          params: { url, title: String(data.title || "Record") },
        } as never);
      }
    });

    return () => {
      responseListener.current?.remove();
    };
  }, []);

  // Update badge count when notifications change
  useEffect(() => {
    if (Platform.OS === "web") return;
    const count = notifications.data?.length ?? 0;
    setBadgeCount(count);
  }, [notifications.data?.length]);
}
