// 報名截止規則:上課日的前一天中午 12:00
// 注意:這裡用瀏覽器的本地時區計算,系統使用者都在台灣,所以等同台灣時間;
// Firestore 安全規則那邊也用同一套規則(以 UTC+8 換算)做最後把關
export function getEnrollmentDeadline(startTime: Date): Date {
  const deadline = new Date(startTime);
  deadline.setDate(deadline.getDate() - 1);
  deadline.setHours(12, 0, 0, 0);
  return deadline;
}

export function isEnrollmentClosed(startTime: Date, now: Date = new Date()): boolean {
  return now >= getEnrollmentDeadline(startTime);
}
