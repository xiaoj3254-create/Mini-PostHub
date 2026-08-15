/* 修复验证：收藏幂等 + 评论级联计数（含用户端与管理端） */
const BASE = 'http://localhost:3000/api';
let pass = 0, fail = 0;
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`  ✓ ${name}`); }
  else { fail++; console.log(`  ✗ ${name} ${detail}`); }
}

async function login(username, password) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  const j = await r.json();
  if (j.code !== 0) throw new Error(`login ${username} failed: ${j.message}`);
  return j.data.token;
}
async function req(method, path, token, body) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const r = await fetch(`${BASE}${path}`, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  return { status: r.status, json: await r.json() };
}

async function postById(id, token) {
  const { json } = await req('GET', `/posts/${id}`, token);
  return json.data.post;
}

try {
  const alice = await login('alice', 'alice123');
  const bob = await login('bob', 'bob123');
  const admin = await login('admin', 'admin123');

  // 找一篇已过审作品
  const list = await req('GET', '/posts?page=1&pageSize=1', null);
  const pid = list.json.data.list[0].id;

  console.log('\n[1] 收藏幂等（add 两次只 +1，remove 两次只 -1）');
  const p0 = await postById(pid, alice);
  const fav0 = p0.favoriteCount;
  await req('POST', `/posts/${pid}/collect`, alice);
  await req('POST', `/posts/${pid}/collect`, alice); // 重复收藏
  const p1 = await postById(pid, alice);
  ok('重复 add 后 favoriteCount 只 +1', p1.favoriteCount === fav0 + 1, `fav0=${fav0} -> ${p1.favoriteCount}`);
  await req('DELETE', `/posts/${pid}/collect`, alice);
  await req('DELETE', `/posts/${pid}/collect`, alice); // 重复取消
  const p2 = await postById(pid, alice);
  ok('重复 remove 后 favoriteCount 回落到原始值', p2.favoriteCount === fav0, `now=${p2.favoriteCount}`);

  // 并发/重复场景：再走一遍单次收藏+单次取消，确认净变化 0
  await req('POST', `/posts/${pid}/collect`, alice);
  await req('DELETE', `/posts/${pid}/collect`, alice);
  const p3 = await postById(pid, alice);
  ok('单次 add + 单次 remove 净变化 0', p3.favoriteCount === fav0, `now=${p3.favoriteCount}`);

  console.log('\n[2] 评论级联计数（用户端删除，子树 3 条）');
  const pc = await postById(pid, alice);
  const cc0 = pc.commentCount;
  const c1 = await req('POST', `/posts/${pid}/comments`, alice, { content: '级联测试-顶层' });
  const c1Id = c1.json.data.id;
  const r1 = await req('POST', `/comments/${c1Id}/reply`, bob, { content: '级联测试-回复1' });
  const r1Id = r1.json.data.id;
  await req('POST', `/comments/${r1Id}/reply`, alice, { content: '级联测试-回复2' });
  const afterBuild = await postById(pid, alice);
  ok('建树后 commentCount +3', afterBuild.commentCount === cc0 + 3, `cc0=${cc0} -> ${afterBuild.commentCount}`);
  await req('DELETE', `/comments/${c1Id}`, alice); // 删除顶层，级联删 2 条回复
  const afterDel = await postById(pid, alice);
  ok('删除顶层后 commentCount 回落 -3', afterDel.commentCount === cc0, `now=${afterDel.commentCount}`);

  console.log('\n[3] 评论级联计数（管理端删除，子树 2 条）');
  const pc2 = await postById(pid, alice);
  const cc2 = pc2.commentCount;
  const c2 = await req('POST', `/posts/${pid}/comments`, bob, { content: '管理端级联-顶层' });
  const c2Id = c2.json.data.id;
  await req('POST', `/comments/${c2Id}/reply`, alice, { content: '管理端级联-回复' });
  const afterBuild2 = await postById(pid, alice);
  ok('建树后 commentCount +2', afterBuild2.commentCount === cc2 + 2, `cc2=${cc2} -> ${afterBuild2.commentCount}`);
  await req('DELETE', `/admin/comments/${c2Id}`, admin); // 管理端删除
  const afterDel2 = await postById(pid, alice);
  ok('管理端删除后 commentCount 回落 -2', afterDel2.commentCount === cc2, `now=${afterDel2.commentCount}`);

  console.log('\n[4] 回归：添加/删除评论基础计数');
  const pc3 = await postById(pid, alice);
  const cc3 = pc3.commentCount;
  const c3 = await req('POST', `/posts/${pid}/comments`, alice, { content: '基础计数测试' });
  const c3Id = c3.json.data.id;
  const afterAdd = await postById(pid, alice);
  ok('添加单条评论 +1', afterAdd.commentCount === cc3 + 1, `now=${afterAdd.commentCount}`);
  await req('DELETE', `/comments/${c3Id}`, alice);
  const afterDel3 = await postById(pid, alice);
  ok('删除单条评论 -1', afterDel3.commentCount === cc3, `now=${afterDel3.commentCount}`);

  console.log(`\n结果: ${pass} 通过, ${fail} 失败`);
  process.exit(fail ? 1 : 0);
} catch (e) {
  console.error('脚本异常:', e);
  process.exit(2);
}
