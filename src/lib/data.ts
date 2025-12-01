export type Instructor = {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  phone: string;
  specialties: string[];
  bio: string;
  hourlyRate: number;
};

export type Application = {
  id: string;
  instructorId: string;
  date: string;
  status: 'Pending' | 'Reviewed' | 'Accepted' | 'Rejected';
};

export type Course = {
  id: string;
  title: string;
  instructorId: string;
  locationId: string;
  startTime: Date;
  endTime: Date;
};

export type Location = {
  id: string;
  name: string;
  address: string;
};

export type CourseFeedback = {
  id: string;
  courseId: string;
  rating: number;
  comment: string;
  attendeeName: string;
};

export const instructors: Instructor[] = [
  { id: '1', name: '王老師 (Wang Laoshi)', avatarUrl: 'https://picsum.photos/seed/wang/100/100', email: 'wang.l@example.com', phone: '0912-345-678', specialties: ['音樂療法', '藝術創作'], bio: '擁有超過10年的音樂治療經驗，擅長利用音樂改善長者的情緒與認知功能。', hourlyRate: 800 },
  { id: '2', name: '陳老師 (Chen Laoshi)', avatarUrl: 'https://picsum.photos/seed/chen/100/100', email: 'chen.l@example.com', phone: '0923-456-789', specialties: ['體適能', '健康操'], bio: '專業體適能教練，為長者設計安全有效的運動課程，充滿活力與熱情。', hourlyRate: 750 },
  { id: '3', name: '林老師 (Lin Laoshi)', avatarUrl: 'https://picsum.photos/seed/lin/100/100', email: 'lin.l@example.com', phone: '0934-567-890', specialties: ['園藝治療', '手工藝'], bio: '透過植物與手作，引導長者感受生命力，促進手眼協調與身心放鬆。', hourlyRate: 700 },
  { id: '4', name: '李老師 (Li Laoshi)', avatarUrl: 'https://picsum.photos/seed/li/100/100', email: 'li.l@example.com', phone: '0945-678-901', specialties: ['桌遊', '認知訓練'], bio: '利用有趣的桌遊活動，活化長者腦力，預防失智，營造歡樂的學習氛圍。', hourlyRate: 720 },
  { id: '5', name: '張老師 (Zhang Laoshi)', avatarUrl: 'https://picsum.photos/seed/zhang/100/100', email: 'zhang.l@example.com', phone: '0956-789-012', specialties: ['烹飪', '營養學'], bio: '帶領長者製作簡單又營養的點心，分享健康飲食知識，享受動手做的樂趣。', hourlyRate: 780 },
];

export const applications: (Application & { instructor: Instructor })[] = [
  { id: 'app1', instructorId: '1', date: '2024-05-20', status: 'Accepted', instructor: instructors[0] },
  { id: 'app2', instructorId: '2', date: '2024-05-22', status: 'Reviewed', instructor: instructors[1] },
  { id: 'app3', instructorId: '3', date: '2024-05-25', status: 'Pending', instructor: instructors[2] },
  { id: 'app4', instructorId: '4', date: '2024-05-28', status: 'Accepted', instructor: instructors[3] },
  { id: 'app5', instructorId: '5', date: '2024-06-01', status: 'Rejected', instructor: instructors[4] },
];

export const locations: Location[] = [
  { id: 'loc1', name: '桃米里', address: '台北市信義區市府路1號' },
  { id: 'loc2', name: '向善里', address: '台北市大安區新生南路二段1號' },
  { id: 'loc3', name: '福興里', address: '台北市中山區中山北路二段48巷7號' },
];

const getCourseDate = (day: number, hour: number) => {
  const date = new Date(2024, 6, 1); // Use a fixed month to avoid inconsistencies, July is 6
  date.setDate(day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

export const courses: Course[] = [
  { id: 'c1', title: '懷舊金曲歡唱', instructorId: '1', locationId: 'loc1', startTime: getCourseDate(8, 10), endTime: getCourseDate(8, 11) },
  { id: 'c2', title: '活力健康操', instructorId: '2', locationId: 'loc2', startTime: getCourseDate(8, 14), endTime: getCourseDate(8, 15) },
  { id: 'c3', title: '迷你盆栽DIY', instructorId: '3', locationId: 'loc3', startTime: getCourseDate(12, 10), endTime: getCourseDate(12, 11) },
  { id: 'c4', title: '益智桌遊派對', instructorId: '4', locationId: 'loc1', startTime: getCourseDate(12, 15), endTime: getCourseDate(12, 16) },
  { id: 'c5', title: '創意輕食烘焙', instructorId: '5', locationId: 'loc2', startTime: getCourseDate(18, 9), endTime: getCourseDate(18, 10) },
  { id: 'c6', title: '節奏打擊樂', instructorId: '1', locationId: 'loc3', startTime: getCourseDate(18, 14), endTime: getCourseDate(18, 15) },
  { id: 'c7', 'title': '下肢肌力訓練', 'instructorId': '2', 'locationId': 'loc1', 'startTime': getCourseDate(22, 10), 'endTime': getCourseDate(22, 11) },
  { id: 'c8', 'title': '手作編織小物', 'instructorId': '3', 'locationId': 'loc2', 'startTime': getCourseDate(25, 14), 'endTime': getCourseDate(25, 15) },
];

export const courseFeedback: (CourseFeedback & { courseTitle: string, instructorName: string })[] = [
    { id: 'f1', courseId: 'c1', rating: 5, comment: '王老師很會帶氣氛，長輩們都唱得很開心！', attendeeName: '家屬A', courseTitle: '懷舊金曲歡唱', instructorName: instructors[0].name },
    { id: 'f2', courseId: 'c1', rating: 4, comment: '選的歌都很好聽，希望下次時間可以再長一點。', attendeeName: '家屬B', courseTitle: '懷舊金曲歡唱', instructorName: instructors[0].name },
    { id: 'f3', courseId: 'c2', rating: 5, comment: '陳老師超有活力，跟著老師動一動，身體都舒暢了！', attendeeName: '家屬C', courseTitle: '活力健康操', instructorName: instructors[1].name },
    { id: 'f4', courseId: 'c3', rating: 4, comment: '第一次做盆栽，很有趣，老師也很有耐心。', attendeeName: '家屬D', courseTitle: '迷你盆栽DIY', instructorName: instructors[2].name },
    { id: 'f5', courseId: 'c3', rating: 5, comment: '看到自己完成的作品很有成就感，謝謝林老師。', attendeeName: '家屬E', courseTitle: '迷你盆栽DIY', instructorName: instructors[2].name },
    { id: 'f6', courseId: 'c4', rating: 3, comment: '有些遊戲規則對長輩來說有點複雜。', attendeeName: '家屬F', courseTitle: '益智桌遊派對', instructorName: instructors[3].name },
    { id: 'f7', courseId: 'c5', rating: 5, comment: '點心很好吃，大家都學得很開心。', attendeeName: '家屬G', courseTitle: '創意輕食烘焙', instructorName: instructors[4].name },
];
