-- 1. 統計情報を保存するテーブルを作成
create table if not exists room_stats (
  id int primary key default 1,
  total_created bigint default 0
);

-- 2. 初期データを挿入（ID: 1 のレコードを作成）
insert into room_stats (id, total_created)
values (1, 0)
on conflict (id) do nothing;

-- 3. RLS（行レベルセキュリティ）を有効化
alter table room_stats enable row level security;

-- 4. 誰でも読み取り可能にするポリシーを作成
create policy "Allow public read access"
  on room_stats
  for select
  using (true);

-- 5. カウントアップ用の関数を作成（セキュリティ定義者として実行）
create or replace function increment_room_count()
returns void as $$
begin
  update room_stats
  set total_created = total_created + 1
  where id = 1;
end;
$$ language plpgsql security definer;
