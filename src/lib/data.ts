
export type Instructor = {
  id: string;
  name: string;
  avatarUrl: string;
  email: string;
  phone: string;
  specialties: string[];
  bio: string;
  hourlyRate: number;
  gender: '男性' | '女性' | '其他';
  age: number;
  bankAccount: string;
  teachingArea: string[];
  teachingHistory: string[];
  level: string;
};

export type Application = {
  id: string;
  instructorId: string;
  date: string;
  status: 'Pending' | 'Reviewed' | 'Accepted' | 'Rejected';
  instructor: Instructor;
  courses?: Course[];
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

const getCourseDate = (day: number, hour: number, monthOffset = 0) => {
  const date = new Date();
  date.setMonth(date.getMonth() + monthOffset);
  date.setDate(day);
  date.setHours(hour, 0, 0, 0);
  return date;
};

export const instructors: Instructor[] = [
  { id: '1', name: '王老師 (Wang Laoshi)', avatarUrl: 'https://picsum.photos/seed/wang/100/100', email: 'wang.l@example.com', phone: '0912-345-678', specialties: ['音樂療法', '藝術創作'], bio: '擁有超過10年的音樂治療經驗，擅長利用音樂改善長者的情緒與認知功能。', hourlyRate: 800, gender: '女性', age: 45, bankAccount: '123-456-789012', teachingArea: ['桃米里', '向善里'], teachingHistory: ['2020-現在: 埔里基督教醫院', '2015-2019: 台中榮總'], level: '資深講師' },
  { id: '2', name: '陳老師 (Chen Laoshi)', avatarUrl: 'https://picsum.photos/seed/chen/100/100', email: 'chen.l@example.com', phone: '0923-456-789', specialties: ['體適能', '健康操'], bio: '專業體適能教練，為長者設計安全有效的運動課程，充滿活力與熱情。', hourlyRate: 750, gender: '男性', age: 38, bankAccount: '234-567-890123', teachingArea: ['向善里', '福興里'], teachingHistory: ['2021-現在: 埔里基督教醫院'], level: '中階講師' },
  { id: '3', name: '林老師 (Lin Laoshi)', avatarUrl: 'https://picsum.photos/seed/lin/100/100', email: 'lin.l@example.com', phone: '0934-567-890', specialties: ['園藝治療', '手工藝'], bio: '透過植物與手作，引導長者感受生命力，促進手眼協調與身心放鬆。', hourlyRate: 700, gender: '女性', age: 52, bankAccount: '345-678-901234', teachingArea: ['桃米里', '福興里'], teachingHistory: ['2019-現在: 埔里基督教醫院', '2017-2018: 社區大學園藝講師'], level: '資深講師' },
  { id: '4', name: '李老師 (Li Laoshi)', avatarUrl: 'https://picsum.photos/seed/li/100/100', email: 'li.l@example.com', phone: '0945-678-901', specialties: ['桌遊', '認知訓練'], bio: '利用有趣的桌遊活動，活化長者腦力，預防失智，營造歡樂的學習氛圍。', hourlyRate: 720, gender: '男性', age: 33, bankAccount: '456-789-012345', teachingArea: ['所有據點'], teachingHistory: ['2022-現在: 埔里基督教醫院'], level: '初階講師' },
  { id: '5', name: '張老師 (Zhang Laoshi)', avatarUrl: 'https://picsum.photos/seed/zhang/100/100', email: 'zhang.l@example.com', phone: '0956-789-012', specialties: ['烹飪', '營養學'], bio: '帶領長者製作簡單又營養的點心，分享健康飲食知識，享受動手做的樂趣。', hourlyRate: 780, gender: '女性', age: 48, bankAccount: '567-890-123456', teachingArea: ['向善里'], teachingHistory: ['2018-現在: 埔里基督教醫院', '2012-2017: 烹飪教室老師'], level: '資深講師' },
  { id: '6', name: '黃老師 (Huang Laoshi)', avatarUrl: 'https://picsum.photos/seed/huang/100/100', email: 'huang.l@example.com', phone: '0967-890-123', specialties: ['心理諮商', '正念引導'], bio: '具備專業心理諮商背景，擅長傾聽並引導長者進行正念練習，協助處理情緒困擾。', hourlyRate: 900, gender: '男性', age: 55, bankAccount: '678-901-234567', teachingArea: ['福興里'], teachingHistory: ['2023-現在: 埔里基督教醫院'], level: '高階講師' },
  { id: '7', name: '許老師 (Xu Laoshi)', avatarUrl: 'https://picsum.photos/seed/xu/100/100', email: 'xu.l@example.com', phone: '0978-901-234', specialties: ['書法', '國畫'], bio: '書法及國畫藝術家，教學經驗豐富，能帶領長者在筆墨之間陶冶性情、靜心養性。', hourlyRate: 850, gender: '女性', age: 60, bankAccount: '789-012-345678', teachingArea: ['桃米里'], teachingHistory: ['2021-現在: 埔里基督教醫院'], level: '高階講師' },
  { id: '8', name: '周老師 (Zhou Laoshi)', avatarUrl: 'https://picsum.photos/seed/zhou/100/100', email: 'zhou.l@example.com', phone: '0989-012-345', specialties: ['手機攝影', '影片剪輯'], bio: '專長為數位影像教學，耐心指導長者學習使用智慧型手機，記錄生活點滴。', hourlyRate: 730, gender: '男性', age: 29, bankAccount: '890-123-456789', teachingArea: ['向善里'], teachingHistory: ['2023-現在: 埔里基督教醫院'], level: '初階講師' },
];

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

export const applications: Application[] = [
  { id: 'app1', instructorId: '1', date: '2024-05-20', status: 'Accepted', instructor: instructors[0], courses: courses.filter(c => c.instructorId === '1') },
  { id: 'app2', instructorId: '2', date: '2024-05-22', status: 'Accepted', instructor: instructors[1], courses: courses.filter(c => c.instructorId === '2') },
  { id: 'app3', instructorId: '3', date: '2024-05-25', status: 'Accepted', instructor: instructors[2], courses: courses.filter(c => c.instructorId === '3') },
  { id: 'app4', instructorId: '4', date: '2024-05-28', status: 'Accepted', instructor: instructors[3], courses: courses.filter(c => c.instructorId === '4') },
  { id: 'app5', instructorId: '5', date: '2024-06-01', status: 'Accepted', instructor: instructors[4], courses: courses.filter(c => c.instructorId === '5') },
  { id: 'app6', instructorId: '6', date: '2024-06-02', status: 'Reviewed', instructor: instructors[5] },
  { id: 'app7', instructorId: '7', date: '2024-06-03', status: 'Pending', instructor: instructors[6] },
  { id: 'app8', instructorId: '8', date: '2024-06-04', status: 'Rejected', instructor: instructors[7] },
];

export const locations: Location[] = [
  { id: 'loc1', name: '桃米里', address: '台北市信義區市府路1號' },
  { id: 'loc2', name: '向善里', address: '台北市大安區新生南路二段1號' },
  { id: 'loc3', name: '福興里', address: '台北市中山區中山北路二段48巷7號' },
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

    