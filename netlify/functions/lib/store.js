import { connectLambda, getStore } from "@netlify/blobs";
import crypto from "node:crypto";

export function getAnnouncementsStore(event) {
  connectLambda(event);
  return getStore("announcements");
}

export function getScheduleStore(event) {
  connectLambda(event);
  return getStore("schedule");
}

export function getSubscriptionsStore(event) {
  connectLambda(event);
  return getStore("push-subscriptions");
}

export function getPlayerInputsStore(event) {
  connectLambda(event);
  return getStore("player-inputs");
}

export function getSessionPlansStore(event) {
  connectLambda(event);
  return getStore("session-plans");
}

export function subscriptionKey(endpoint = "") {
  return `subscription/${crypto.createHash("sha256").update(endpoint).digest("hex")}.json`;
}

export function announcementKey(id) {
  return `announcement/${id}.json`;
}

export function scheduleKey(id) {
  return `schedule/${id}.json`;
}

export function playerInputKey(id) {
  return `player-input/${id}.json`;
}

export function sessionPlanKey(id) {
  return `session-plan/${id}.json`;
}
