-- =====================================================================
--  Лендинг маркетинг-агентства для автошкол — схема базы Supabase
--  Выполните ВЕСЬ этот файл один раз: Supabase → SQL Editor → New query →
--  вставить → Run. Повторный запуск безопасен: данные не задвоятся.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. АДМИНЫ. Только пользователи из этой таблицы могут редактировать сайт.
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 2. ТАБЛИЦЫ КОНТЕНТА
-- ---------------------------------------------------------------------

-- Общие настройки сайта (одна строка, все поля в JSON)
create table if not exists public.settings (
  id         int primary key default 1 check (id = 1),
  data       jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Секции лендинга: вкл/выкл, порядок, заголовки
create table if not exists public.sections (
  key         text primary key,
  admin_name  text not null default '',
  enabled     boolean not null default true,
  sort        int not null default 0,
  title_ru    text not null default '',
  title_uz    text not null default '',
  subtitle_ru text not null default '',
  subtitle_uz text not null default '',
  menu_ru     text not null default '',
  menu_uz     text not null default ''
);

-- Боли владельца
create table if not exists public.pains (
  id       uuid primary key default gen_random_uuid(),
  title_ru text not null default '',
  title_uz text not null default '',
  text_ru  text not null default '',
  text_uz  text not null default '',
  sort     int not null default 0,
  visible  boolean not null default true
);

-- Что входит в работу
create table if not exists public.services (
  id       uuid primary key default gen_random_uuid(),
  icon     text not null default 'target',
  title_ru text not null default '',
  title_uz text not null default '',
  text_ru  text not null default '',
  text_uz  text not null default '',
  sort     int not null default 0,
  visible  boolean not null default true
);

-- Как работаем (шаги)
create table if not exists public.steps (
  id       uuid primary key default gen_random_uuid(),
  title_ru text not null default '',
  title_uz text not null default '',
  text_ru  text not null default '',
  text_uz  text not null default '',
  sort     int not null default 0,
  visible  boolean not null default true
);

-- FAQ
create table if not exists public.faq (
  id          uuid primary key default gen_random_uuid(),
  question_ru text not null default '',
  question_uz text not null default '',
  answer_ru   text not null default '',
  answer_uz   text not null default '',
  sort        int not null default 0,
  visible     boolean not null default true
);

-- Команда
create table if not exists public.team (
  id        uuid primary key default gen_random_uuid(),
  name_ru   text not null default '',
  name_uz   text not null default '',
  role_ru   text not null default '',
  role_uz   text not null default '',
  bio_ru    text not null default '',
  bio_uz    text not null default '',
  photo_url text not null default '',
  sort      int not null default 0,
  visible   boolean not null default true
);

-- Кейсы
create table if not exists public.cases (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  status        text not null default 'draft' check (status in ('draft', 'published')),
  sort          int not null default 0,
  title_ru      text not null default '',
  title_uz      text not null default '',
  school        text not null default '',
  city_ru       text not null default '',
  city_uz       text not null default '',
  duration_ru   text not null default '',
  duration_uz   text not null default '',
  main_value    text not null default '',
  main_label_ru text not null default '',
  main_label_uz text not null default '',
  cover_url     text not null default '',
  gallery       jsonb not null default '[]'::jsonb,
  video_url     text not null default '',
  metrics       jsonb not null default '[]'::jsonb,
  task_ru       text not null default '',
  task_uz       text not null default '',
  done_ru       text not null default '',
  done_uz       text not null default '',
  result_ru     text not null default '',
  result_uz     text not null default '',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Заявки с сайта
create table if not exists public.leads (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name       text not null,
  contact    text not null,
  school     text not null default '',
  city       text not null default '',
  branches   text not null default '',
  students   text not null default '',
  budget     text not null default '',
  problem    text not null default '',
  lang       text not null default 'ru',
  channel    text not null default '',
  page       text not null default '',
  status     text not null default 'new' check (status in ('new', 'in_progress', 'client', 'rejected')),
  note       text not null default ''
);

create index if not exists leads_created_at_idx on public.leads (created_at desc);

-- ---------------------------------------------------------------------
-- 3. ПРАВА ДОСТУПА (RLS)
--    Публично: чтение опубликованных кейсов и видимого контента + создание заявок.
--    Всё остальное — только админ.
-- ---------------------------------------------------------------------
alter table public.admins   enable row level security;
alter table public.settings enable row level security;
alter table public.sections enable row level security;
alter table public.pains    enable row level security;
alter table public.services enable row level security;
alter table public.steps    enable row level security;
alter table public.faq      enable row level security;
alter table public.team     enable row level security;
alter table public.cases    enable row level security;
alter table public.leads    enable row level security;

grant usage on schema public to anon, authenticated;
grant select on public.settings, public.sections, public.pains, public.services,
                public.steps, public.faq, public.team, public.cases to anon, authenticated;
grant insert on public.leads to anon, authenticated;
grant select, insert, update, delete on public.settings, public.sections, public.pains,
                public.services, public.steps, public.faq, public.team, public.cases,
                public.leads to authenticated;
grant select on public.admins to authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- admins: админ видит список админов, менять его можно только через SQL Editor
drop policy if exists "admins_read" on public.admins;
create policy "admins_read" on public.admins for select to authenticated using (public.is_admin());

-- settings / sections: читают все, меняет админ
drop policy if exists "public_read" on public.settings;
create policy "public_read" on public.settings for select to anon, authenticated using (true);
drop policy if exists "admin_all" on public.settings;
create policy "admin_all" on public.settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "public_read" on public.sections;
create policy "public_read" on public.sections for select to anon, authenticated using (true);
drop policy if exists "admin_all" on public.sections;
create policy "admin_all" on public.sections for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- списки: публично видны только строки с visible = true
do $$
declare t text;
begin
  foreach t in array array['pains', 'services', 'steps', 'faq', 'team'] loop
    execute format('drop policy if exists "public_read" on public.%I', t);
    execute format('create policy "public_read" on public.%I for select to anon, authenticated using (visible)', t);
    execute format('drop policy if exists "admin_all" on public.%I', t);
    execute format('create policy "admin_all" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())', t);
  end loop;
end $$;

-- кейсы: публично только опубликованные
drop policy if exists "public_read" on public.cases;
create policy "public_read" on public.cases for select to anon, authenticated using (status = 'published');
drop policy if exists "admin_all" on public.cases;
create policy "admin_all" on public.cases for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- заявки: любой посетитель может только СОЗДАТЬ новую заявку; читать — только админ
drop policy if exists "public_insert" on public.leads;
create policy "public_insert" on public.leads for insert to anon, authenticated
  with check (
    status = 'new' and note = ''
    and char_length(name) between 1 and 120
    and char_length(contact) between 3 and 120
    and char_length(school) <= 200
    and char_length(problem) <= 2000
    and char_length(city) <= 60 and char_length(branches) <= 60
    and char_length(students) <= 60 and char_length(budget) <= 60
    and char_length(lang) <= 5 and char_length(channel) <= 20 and char_length(page) <= 300
  );
drop policy if exists "admin_read" on public.leads;
create policy "admin_read" on public.leads for select to authenticated using (public.is_admin());
drop policy if exists "admin_update" on public.leads;
create policy "admin_update" on public.leads for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "admin_delete" on public.leads;
create policy "admin_delete" on public.leads for delete to authenticated using (public.is_admin());

-- ---------------------------------------------------------------------
-- 4. ХРАНИЛИЩЕ КАРТИНОК (bucket "media")
--    Картинки открываются по прямой ссылке всем, загружать/удалять — только админ.
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

drop policy if exists "media_public_read" on storage.objects;
create policy "media_public_read" on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');
drop policy if exists "media_admin_insert" on storage.objects;
create policy "media_admin_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media_admin_update" on storage.objects;
create policy "media_admin_update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_admin()) with check (bucket_id = 'media' and public.is_admin());
drop policy if exists "media_admin_delete" on storage.objects;
create policy "media_admin_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and public.is_admin());

-- ---------------------------------------------------------------------
-- 5. СТАРТОВЫЕ ДАННЫЕ (всё можно поменять в админке)
--    Вставляются только если таблица пустая.
-- ---------------------------------------------------------------------

insert into public.settings (id, data) values (1, $json${
  "agency_name": "THE METHOD",
  "hero_badge_ru": "Маркетинг-агентство только для автошкол",
  "hero_badge_uz": "Faqat avtomaktablar uchun marketing agentligi",
  "hero_button_ru": "Получить бесплатный разбор",
  "hero_button_uz": "Bepul tahlil olish",
  "hero_button2_ru": "Смотреть кейсы",
  "hero_button2_uz": "Keyslarni koʻrish",
  "counters": [
    {"value": "40", "label_ru": "записей на пробное в первый месяц — по гарантии", "label_uz": "birinchi oyda sinov darsiga yozilish — kafolat boʻyicha"},
    {"value": "$500", "label_ru": "первый месяц вместо $1000", "label_uz": "birinchi oy $1000 oʻrniga"},
    {"value": "100%", "label_ru": "возврат оплаты, если гарантия не выполнена", "label_uz": "kafolat bajarilmasa, toʻlov qaytariladi"}
  ],
  "offer_badge_ru": "Предложение для новых автошкол",
  "offer_badge_uz": "Yangi avtomaktablar uchun taklif",
  "offer_currency": "$",
  "offer_price_old": "1000",
  "offer_price_new": "500",
  "offer_period_ru": "за первый месяц работы",
  "offer_period_uz": "ishning birinchi oyi uchun",
  "offer_points_ru": "Запуск таргета в Instagram и Facebook\nReels и креативы под вашу автошколу\nКвалификация заявок — только Ташкент и только реальные ученики\nЕженедельный отчёт в записях, а не в охватах",
  "offer_points_uz": "Instagram va Facebookda target reklamani ishga tushirish\nAvtomaktabingiz uchun Reels va kreativlar\nArizalarni saralash — faqat Toshkent va faqat real oʻquvchilar\nQamrov emas, yozilishlar boʻyicha haftalik hisobot",
  "offer_guarantee_title_ru": "Гарантия",
  "offer_guarantee_title_uz": "Kafolat",
  "offer_guarantee_ru": "40 записей на пробное занятие в первый месяц — или вернём деньги",
  "offer_guarantee_uz": "Birinchi oyda sinov darsiga 40 ta yozilish — yoki pulingizni qaytaramiz",
  "offer_note_ru": "Условия гарантии фиксируем в договоре",
  "offer_note_uz": "Kafolat shartlari shartnomada belgilanadi",
  "offer_button_ru": "Забрать предложение",
  "offer_button_uz": "Taklifni olish",
  "telegram": "",
  "whatsapp": "",
  "phone": "",
  "instagram": "",
  "form_success_ru": "Заявка принята! Сейчас откроется мессенджер — нажмите «Отправить», чтобы мы получили сообщение.",
  "form_success_uz": "Ariza qabul qilindi! Hozir messenjer ochiladi — xabar bizga yetib borishi uchun «Yuborish» tugmasini bosing.",
  "footer_text_ru": "Маркетинг для автошкол Ташкента. Считаем записи на пробное, а не просмотры.",
  "footer_text_uz": "Toshkent avtomaktablari uchun marketing. Koʻrishlarni emas, sinov darsiga yozilishlarni hisoblaymiz."
}$json$::jsonb)
on conflict (id) do nothing;

insert into public.sections (key, admin_name, enabled, sort, title_ru, title_uz, subtitle_ru, subtitle_uz, menu_ru, menu_uz) values
  ('hero',     'Первый экран',      true, 1, 'МАРКЕТИНГ ДЛЯ *АВТОШКОЛ* ТАШКЕНТА', 'TOSHKENT *AVTOMAKTABLARI* UCHUN MARKETING',
     'Приводим учеников на пробные занятия, а не просмотры', 'Koʻrishlar emas — sinov darsiga yoziladigan oʻquvchilarni olib kelamiz', '', ''),
  ('pains',    'Боли владельца',    true, 2, '*ЗНАКОМО?*', '*TANISHMI?*',
     'С этим к нам приходят владельцы автошкол', 'Avtomaktab egalari bizga aynan shu muammolar bilan keladi', 'Проблемы', 'Muammolar'),
  ('offer',    'Оффер',             true, 3, 'ПЕРВЫЙ МЕСЯЦ *ЗА ПОЛЦЕНЫ*', 'BIRINCHI OY *YARIM NARXDA*',
     'Мы рискуем вместе с вами: результат или возврат денег', 'Biz siz bilan birga tavakkal qilamiz: natija yoki pul qaytariladi', 'Оффер', 'Taklif'),
  ('services', 'Что входит',        false, 7, '*ЗАЯВКИ*, А НЕ ОХВАТЫ', '*ARIZALAR*, QAMROV EMAS',
     'Что входит в работу', 'Ishga nimalar kiradi', 'Услуги', 'Xizmatlar'),
  ('cases',    'Кейсы',             true, 5, '*КЕЙСЫ* АВТОШКОЛ', 'AVTOMAKTABLAR *KEYSLARI*',
     'Цифры до и после нашей работы', 'Ishimizdan oldin va keyingi raqamlar', 'Кейсы', 'Keyslar'),
  ('process',  'Как работаем',      true, 4, 'КАК МЫ *РАБОТАЕМ*', 'QANDAY *ISHLAYMIZ*',
     '4 шага от заявки до учеников', 'Arizadan oʻquvchilargacha 4 qadam', 'Как работаем', 'Jarayon'),
  ('team',     'Команда',           false, 8, '*КОМАНДА*', '*JAMOA*',
     'Люди, которые ведут ваш проект', 'Loyihangizni yurituvchi odamlar', 'Команда', 'Jamoa'),
  ('faq',      'FAQ',               false, 9, 'ЧАСТЫЕ *ВОПРОСЫ*', 'KOʻP BERILADIGAN *SAVOLLAR*',
     '', '', 'FAQ', 'FAQ'),
  ('form',     'Форма заявки',      true, 6, 'ПОЛУЧИТЕ *БЕСПЛАТНЫЙ РАЗБОР*', '*BEPUL TAHLIL* OLING',
     'Разберём вашу рекламу и аккаунт, покажем, где теряются ученики. 2 минуты на заполнение.', 'Reklamangiz va akkauntingizni tahlil qilamiz, oʻquvchilar qayerda yoʻqolayotganini koʻrsatamiz. Toʻldirish 2 daqiqa.', 'Заявка', 'Ariza')
on conflict (key) do nothing;

insert into public.pains (sort, title_ru, title_uz, text_ru, text_uz)
select * from (values
  (1, 'Реклама идёт, а заявки пустые', 'Reklama ketyapti, arizalar esa yoʻq',
      'Деньги списываются, в директ пишут «сколько стоит?» и пропадают. До пробного занятия не доходит никто.',
      'Pul yechilyapti, direktga «narxi qancha?» deb yozib, yoʻqolib qolishadi. Sinov darsigacha hech kim yetib kelmaydi.'),
  (2, 'Звонят из регионов', 'Viloyatlardan qoʻngʻiroq qilishadi',
      'Реклама крутится на весь Узбекистан, а ваши филиалы — в Ташкенте. Менеджер тратит день на тех, кто никогда не приедет.',
      'Reklama butun Oʻzbekiston boʻylab koʻrsatiladi, filiallaringiz esa Toshkentda. Menejer hech qachon kelmaydiganlarga kun sarflaydi.'),
  (3, 'Таргетолог отчитывается охватами', 'Targetolog qamrov bilan hisobot beradi',
      'Показы, клики, подписчики — красиво в отчёте, но в кассе пусто. Никто не считает, сколько людей записалось.',
      'Koʻrishlar, kliklar, obunachilar — hisobotda chiroyli, kassada esa boʻsh. Nechta odam yozilganini hech kim hisoblamaydi.'),
  (4, 'Нет системы — всё на сарафане', 'Tizim yoʻq — hammasi tanishlar orqali',
      'Ученики приходят по рекомендациям, и вы не знаете, сколько их будет в следующем месяце. Рост невозможно планировать.',
      'Oʻquvchilar tavsiya orqali keladi va keyingi oy nechta boʻlishini bilmaysiz. Oʻsishni rejalashtirib boʻlmaydi.')
) v(sort, title_ru, title_uz, text_ru, text_uz)
where not exists (select 1 from public.pains);

insert into public.services (sort, icon, title_ru, title_uz, text_ru, text_uz)
select * from (values
  (1, 'target',  'Таргетированная реклама', 'Target reklama',
      'Instagram и Facebook с гео только по нужным районам Ташкента. Оптимизация на заявки, а не на клики.',
      'Faqat Toshkentning kerakli tumanlariga geo bilan Instagram va Facebook. Kliklar emas, arizalar uchun optimallashtirish.'),
  (2, 'video',   'Reels и контент', 'Reels va kontent',
      'Сценарии и съёмка Reels: инструкторы, автодром, экзамен. Контент, после которого пишут в директ.',
      'Reels ssenariylari va suratga olish: instruktorlar, avtodrom, imtihon. Direktga yozdiradigan kontent.'),
  (3, 'account', 'Ведение аккаунта', 'Akkauntni yuritish',
      'Оформление профиля, актуальные, сторис и посты. Аккаунт, который вызывает доверие у родителей и студентов.',
      'Profilni bezash, aktual, stories va postlar. Ota-onalar va talabalarda ishonch uygʻotadigan akkaunt.'),
  (4, 'creative','Креативы', 'Kreativlar',
      'Рекламные макеты и видео, которые регулярно тестируем и обновляем, чтобы цена заявки не росла.',
      'Ariza narxi oshmasligi uchun muntazam sinab, yangilab turiladigan reklama maketlari va videolar.'),
  (5, 'filter',  'Квалификация заявок', 'Arizalarni saralash',
      'Отсекаем нецелевых: регион, возраст, категория прав. Ваш менеджер получает только тех, кто готов прийти.',
      'Maqsadsizlarni ajratamiz: hudud, yosh, guvohnoma toifasi. Menejeringiz faqat kelishga tayyorlarni oladi.'),
  (6, 'chart',   'Еженедельные отчёты', 'Haftalik hisobotlar',
      'Каждую неделю: заявки, цена заявки, записи на пробное и ученики. Простыми цифрами, без «охватов».',
      'Har hafta: arizalar, ariza narxi, sinov darsiga yozilishlar va oʻquvchilar. «Qamrov»siz, oddiy raqamlarda.')
) v(sort, icon, title_ru, title_uz, text_ru, text_uz)
where not exists (select 1 from public.services);

insert into public.steps (sort, title_ru, title_uz, text_ru, text_uz)
select * from (values
  (1, 'Бесплатный разбор', 'Bepul tahlil',
      'Созваниваемся, смотрим вашу рекламу, аккаунт и обработку заявок. Показываем, где теряются ученики.',
      'Qoʻngʻiroqlashamiz, reklamangiz, akkauntingiz va arizalarga ishlov berishni koʻramiz. Oʻquvchilar qayerda yoʻqolayotganini koʻrsatamiz.'),
  (2, 'Стратегия и договор', 'Strategiya va shartnoma',
      'Фиксируем цель по записям на пробное, бюджет и гарантию в договоре.',
      'Sinov darsiga yozilish boʻyicha maqsad, byudjet va kafolatni shartnomada belgilaymiz.'),
  (3, 'Запуск', 'Ishga tushirish',
      'Готовим креативы и Reels, настраиваем рекламу и квалификацию заявок.',
      'Kreativlar va Reels tayyorlaymiz, reklama va arizalarni saralashni sozlaymiz.'),
  (4, 'Отчёты и рост', 'Hisobotlar va oʻsish',
      'Каждую неделю — отчёт в записях. Масштабируем то, что приводит учеников.',
      'Har hafta — yozilishlar boʻyicha hisobot. Oʻquvchi olib kelayotgan narsani kengaytiramiz.')
) v(sort, title_ru, title_uz, text_ru, text_uz)
where not exists (select 1 from public.steps);

insert into public.faq (sort, question_ru, question_uz, answer_ru, answer_uz)
select * from (values
  (1, 'Входит ли рекламный бюджет в стоимость?', 'Reklama byudjeti narxga kiradimi?',
      'Нет. Стоимость — это наша работа. Рекламный бюджет вы оплачиваете отдельно напрямую в рекламный кабинет, сумму согласуем на разборе.',
      'Yoʻq. Narx — bizning ishimiz. Reklama byudjetini alohida, toʻgʻridan-toʻgʻri reklama kabinetiga toʻlaysiz, summani tahlilda kelishamiz.'),
  (2, 'Как работает гарантия?', 'Kafolat qanday ishlaydi?',
      'Если за первый месяц мы не приводим 40 записей на пробное занятие, возвращаем оплату за работу. Условия фиксируем в договоре.',
      'Agar birinchi oyda sinov darsiga 40 ta yozilish olib kelmasak, ish haqini qaytaramiz. Shartlar shartnomada belgilanadi.'),
  (3, 'Что считается «записью на пробное»?', '«Sinov darsiga yozilish» deb nima hisoblanadi?',
      'Человек из Ташкента, который оставил контакты и согласовал дату пробного занятия с вашим менеджером.',
      'Ism-familiyasi va kontaktini qoldirgan hamda menejeringiz bilan sinov darsi sanasini kelishgan Toshkentlik odam.'),
  (4, 'Нужно ли что-то от нас?', 'Bizdan nima kerak?',
      'Доступ к аккаунту, 2–3 часа на съёмку контента в месяц и менеджер, который быстро отвечает на заявки.',
      'Akkauntga kirish, oyiga kontent suratga olish uchun 2–3 soat va arizalarga tez javob beradigan menejer.'),
  (5, 'Работаете ли вы с автошколами не из Ташкента?', 'Toshkentdan tashqaridagi avtomaktablar bilan ishlaysizmi?',
      'Основной фокус — Ташкент. Если вы в другом городе, оставьте заявку: обсудим, подойдёт ли наш подход.',
      'Asosiy yoʻnalish — Toshkent. Boshqa shaharda boʻlsangiz, ariza qoldiring: yondashuvimiz mos kelishini muhokama qilamiz.')
) v(sort, question_ru, question_uz, answer_ru, answer_uz)
where not exists (select 1 from public.faq);

insert into public.team (sort, name_ru, name_uz, role_ru, role_uz, bio_ru, bio_uz)
select * from (values
  (1, '[ЗАПОЛНИТЬ] Имя Фамилия', '[TOʻLDIRISH] Ism Familiya', 'Руководитель проекта', 'Loyiha rahbari', '[ЗАПОЛНИТЬ] Пара слов об опыте', '[TOʻLDIRISH] Tajriba haqida bir-ikki soʻz'),
  (2, '[ЗАПОЛНИТЬ] Имя Фамилия', '[TOʻLDIRISH] Ism Familiya', 'Таргетолог', 'Targetolog', '[ЗАПОЛНИТЬ] Пара слов об опыте', '[TOʻLDIRISH] Tajriba haqida bir-ikki soʻz'),
  (3, '[ЗАПОЛНИТЬ] Имя Фамилия', '[TOʻLDIRISH] Ism Familiya', 'Мобилограф / Reels', 'Mobilograf / Reels', '[ЗАПОЛНИТЬ] Пара слов об опыте', '[TOʻLDIRISH] Tajriba haqida bir-ikki soʻz')
) v(sort, name_ru, name_uz, role_ru, role_uz, bio_ru, bio_uz)
where not exists (select 1 from public.team);

insert into public.cases (slug, status, sort, title_ru, title_uz, school, city_ru, city_uz, duration_ru, duration_uz,
                          main_value, main_label_ru, main_label_uz, metrics, task_ru, task_uz, done_ru, done_uz, result_ru, result_uz)
select * from (values
  ('demo-case-1', 'published', 1),
  ('demo-case-2', 'published', 2),
  ('demo-case-3', 'published', 3)
) v(slug, status, sort)
cross join lateral (select
  '[ЗАПОЛНИТЬ] Название кейса'::text, '[TOʻLDIRISH] Keys nomi'::text,
  '[ЗАПОЛНИТЬ] Автошкола'::text, 'Ташкент'::text, 'Toshkent'::text,
  '[ЗАПОЛНИТЬ] срок'::text, '[TOʻLDIRISH] muddat'::text,
  '[ЗАПОЛНИТЬ]'::text, '[ЗАПОЛНИТЬ] главный результат'::text, '[TOʻLDIRISH] asosiy natija'::text,
  $m$[
    {"label_ru": "Заявки в месяц", "label_uz": "Oylik arizalar", "before": "[ЗАПОЛНИТЬ]", "after": "[ЗАПОЛНИТЬ]"},
    {"label_ru": "Цена заявки", "label_uz": "Ariza narxi", "before": "[ЗАПОЛНИТЬ]", "after": "[ЗАПОЛНИТЬ]"},
    {"label_ru": "Записи на пробное", "label_uz": "Sinov darsiga yozilish", "before": "[ЗАПОЛНИТЬ]", "after": "[ЗАПОЛНИТЬ]"},
    {"label_ru": "Новые ученики", "label_uz": "Yangi oʻquvchilar", "before": "[ЗАПОЛНИТЬ]", "after": "[ЗАПОЛНИТЬ]"}
  ]$m$::jsonb,
  '[ЗАПОЛНИТЬ] С какой проблемой пришла автошкола'::text, '[TOʻLDIRISH] Avtomaktab qanday muammo bilan keldi'::text,
  E'- [ЗАПОЛНИТЬ] Что сделали — пункт 1\n- [ЗАПОЛНИТЬ] Пункт 2\n- [ЗАПОЛНИТЬ] Пункт 3'::text,
  E'- [TOʻLDIRISH] Nima qildik — 1-band\n- [TOʻLDIRISH] 2-band\n- [TOʻLDIRISH] 3-band'::text,
  '[ЗАПОЛНИТЬ] Какой результат получили'::text, '[TOʻLDIRISH] Qanday natijaga erishildi'::text
) d
where not exists (select 1 from public.cases);
