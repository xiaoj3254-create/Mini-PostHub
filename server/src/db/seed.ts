import 'dotenv/config';
import bcrypt from 'bcryptjs';
import fs from 'node:fs';
import path from 'node:path';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { uploadDir } from '../middlewares/upload.js';
import {
  categoryTable,
  collectTable,
  commentTable,
  postTable,
  userTable,
  type NewCategory,
  type NewPost,
  type NewUser,
} from './schema.js';

const SALT_ROUNDS = 10;

function placeholderSvg(color: string, label: string, index: number): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="420" viewBox="0 0 640 420">
  <rect width="640" height="420" fill="${color}"/>
  <circle cx="320" cy="170" r="90" fill="#ffffff22"/>
  <text x="50%" y="46%" font-family="Arial, sans-serif" font-size="42" fill="#fff" text-anchor="middle">${label}</text>
  <text x="50%" y="62%" font-family="Arial, sans-serif" font-size="18" fill="#ffffffcc" text-anchor="middle">Mini PostHub demo #${index}</text>
</svg>`;
}

function writePlaceholders(count: number): string[] {
  const colors = ['#4f46e5', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  const labels = ['Travel', 'Food', 'Photo', 'Tech', 'Life', 'Design', 'Campus', 'Art'];
  const urls: string[] = [];
  for (let i = 0; i < count; i++) {
    const file = `seed_${i + 1}.svg`;
    fs.writeFileSync(path.join(uploadDir, file), placeholderSvg(colors[i % colors.length], labels[i % labels.length], i + 1));
    urls.push(`/uploads/${file}`);
  }
  return urls;
}

async function main() {
  const existingAdmin = await db.query.userTable.findFirst({
    where: eq(userTable.username, 'admin'),
  });
  if (existingAdmin) {
    console.log('Seed data already exists, skipping.');
    process.exit(0);
  }

  // Categories
  const categories: NewCategory[] = [
    { name: '旅行', description: '旅行见闻、攻略与风景', sort: 1, isEnabled: true },
    { name: '美食', description: '探店、烹饪与美食分享', sort: 2, isEnabled: true },
    { name: '摄影', description: '摄影作品与拍摄技巧', sort: 3, isEnabled: true },
    { name: '科技', description: '数码、科技资讯与产品体验', sort: 4, isEnabled: true },
    { name: '生活', description: '生活方式与日常记录', sort: 5, isEnabled: true },
    { name: '设计', description: '视觉设计、UI/UX 与灵感', sort: 6, isEnabled: true },
    { name: '下架分类', description: '该分类已禁用（演示）', sort: 99, isEnabled: false },
  ];
  await db.insert(categoryTable).values(categories);
  const catRows = await db.query.categoryTable.findMany();
  const catId = new Map(catRows.map((c) => [c.name, c.id]));

  // Users
  const users: NewUser[] = [
    { username: 'admin', password: await bcrypt.hash('admin123', SALT_ROUNDS), nickname: '管理员', role: 'admin', bio: 'Mini PostHub 平台管理员' },
    { username: 'alice', password: await bcrypt.hash('alice123', SALT_ROUNDS), nickname: '爱丽丝', bio: '热爱旅行与摄影的自由作者' },
    { username: 'bob', password: await bcrypt.hash('bob123', SALT_ROUNDS), nickname: '波波', bio: '美食探店博主' },
    { username: 'carol', password: await bcrypt.hash('carol123', SALT_ROUNDS), nickname: '卡萝', bio: 'UI 设计师，喜欢记录生活' },
    { username: 'dave', password: await bcrypt.hash('dave123', SALT_ROUNDS), nickname: '戴夫', status: 'banned', bio: '已被封禁的示例用户' },
  ];
  await db.insert(userTable).values(users);
  const userRows = await db.query.userTable.findMany();
  const uid = new Map(userRows.map((u) => [u.username, u.id]));
  const nick = new Map(userRows.map((u) => [u.username, u.nickname]));

  // Placeholder images
  const images = writePlaceholders(8);

  // Posts (cover various statuses for demo)
  const posts: NewPost[] = [
    // approved - alice
    { userId: uid.get('alice')!, categoryId: catId.get('旅行')!, title: '川西小环线自驾攻略', content: '记录三天两夜的自驾路线：成都-四姑娘山-丹巴-新都桥-康定，沿途雪山与藏寨风光，附实用路况提示与住宿建议。', images: [images[0], images[1]], status: 'approved', viewCount: 328, favoriteCount: 56, commentCount: 5 },
    { userId: uid.get('alice')!, categoryId: catId.get('摄影')!, title: '城市夜景慢门练习', content: '分享一组城市夜景慢门作品，参数：ISO100，f/11，曝光 10-25s，使用三脚架与 ND 滤镜。附机位选择心得。', images: [images[2]], status: 'approved', viewCount: 214, favoriteCount: 32, commentCount: 3 },
    // approved - bob
    { userId: uid.get('bob')!, categoryId: catId.get('美食')!, title: '深夜食堂：街头烤肉串测评', content: '探访了五家排队烤肉店，从炭火、腌制到蘸料逐项对比，附人均价格与排队时间，帮你避雷。', images: [images[3], images[4]], status: 'approved', viewCount: 156, favoriteCount: 48, commentCount: 7 },
    { userId: uid.get('bob')!, categoryId: catId.get('生活')!, title: '一人食也要好好吃饭', content: '工作再忙也别亏待自己。分享 7 天快手一人食菜单，简单健康又治愈。', images: [images[5]], status: 'approved', viewCount: 89, favoriteCount: 21, commentCount: 2 },
    // approved - carol
    { userId: uid.get('carol')!, categoryId: catId.get('设计')!, title: '我的 UI 灵感收藏夹', content: '整理近期收集的界面设计灵感：配色、排版与动效，并附上自己的临摹练习对比图。', images: [images[6], images[7]], status: 'approved', viewCount: 201, favoriteCount: 40, commentCount: 4 },
    // pending
    { userId: uid.get('alice')!, categoryId: catId.get('旅行')!, title: '云南腾冲深度游（待审核）', content: '腾冲的温泉与银杏村，一篇还在打磨中的游记，先提交审核看看。', images: [images[1]], status: 'pending', viewCount: 0, favoriteCount: 0, commentCount: 0 },
    { userId: uid.get('carol')!, categoryId: catId.get('科技')!, title: '新手程序员的第一台电脑（待审核）', content: '从预算、用途到外设，聊聊如何为开发工作选电脑，欢迎补充建议。', images: [], status: 'pending', viewCount: 0, favoriteCount: 0, commentCount: 0 },
    // rejected
    { userId: uid.get('bob')!, categoryId: catId.get('美食')!, title: '某连锁火锅探店（已驳回）', content: '这篇文章包含商家联系方式与优惠链接，被管理员驳回。', images: [images[4]], status: 'rejected', rejectReason: '内容包含营销推广信息，请移除联系方式后重新提交。', viewCount: 0, favoriteCount: 0, commentCount: 0 },
    // drafts
    { userId: uid.get('alice')!, categoryId: catId.get('摄影')!, title: '未完成的胶片扫街（草稿）', content: '还没写完的胶片摄影草稿……', images: [], status: 'draft', viewCount: 0, favoriteCount: 0, commentCount: 0 },
    { userId: uid.get('bob')!, categoryId: catId.get('生活')!, title: '居家改造计划（草稿）', content: '记录客厅改造的想法，慢慢完善。', images: [], status: 'draft', viewCount: 0, favoriteCount: 0, commentCount: 0 },
  ];
  await db.insert(postTable).values(posts);
  const postRows = await db.query.postTable.findMany();
  const pid = new Map(postRows.map((p) => [p.title, p.id]));
  const approvedTitles = posts.filter((p) => p.status === 'approved').map((p) => p.title);

  // Comments (top-level + replies on approved posts)
  const post1 = pid.get('川西小环线自驾攻略')!;
  const post3 = pid.get('深夜食堂：街头烤肉串测评')!;
  const comments = [
    { postId: post1, userId: uid.get('carol')!, content: '太实用了！下个月就按这个路线走～', parentId: null as number | null },
    { postId: post1, userId: uid.get('bob')!, content: '请问丹巴住宿有推荐吗？', parentId: null as number | null },
    { postId: post1, userId: uid.get('alice')!, content: '回 @bob：丹巴甲居藏寨里的民宿都不错，记得提前订。', parentId: null as number | null },
    { postId: post1, userId: uid.get('bob')!, content: '收到，谢谢！', parentId: null as number | null },
    { postId: post3, userId: uid.get('alice')!, content: '第二家真的好吃！我排了四十分钟。', parentId: null as number | null },
    { postId: post3, userId: uid.get('carol')!, content: '收藏了，周末去打卡。', parentId: null as number | null },
  ];
  const insertedComments = await db.insert(commentTable).values(comments);
  void insertedComments;
  const commentRows = await db.query.commentTable.findMany();
  const firstPost1Comment = commentRows.find((c) => c.postId === post1 && c.userId === uid.get('carol')!);
  if (firstPost1Comment) {
    await db.insert(commentTable).values({
      postId: post1,
      userId: uid.get('dave')!,
      parentId: firstPost1Comment.id,
      content: '（被封禁用户的历史回复）写得太详细了！',
    });
  }

  // Collects
  const collects = [
    { userId: uid.get('alice')!, postId: pid.get('深夜食堂：街头烤肉串测评')! },
    { userId: uid.get('carol')!, postId: pid.get('川西小环线自驾攻略')! },
    { userId: uid.get('bob')!, postId: pid.get('我的 UI 灵感收藏夹')! },
  ];
  await db.insert(collectTable).values(collects);

  console.log(`Seed done. ${catRows.length} categories, ${userRows.length} users, ${postRows.length} posts.`);
  console.log('Accounts:');
  console.log('  admin / admin123 (管理员)');
  console.log('  alice / alice123');
  console.log('  bob   / bob123');
  console.log('  carol / carol123');
  console.log(`  dave  / dave123 (已封禁)`);
  console.log(`Approved demo posts: ${approvedTitles.join('、')}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
