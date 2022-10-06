# [Prisma版]アプリ概要


**オリジナルアプリ「Tatoeba」。**

**わかりにくい話をわかりやすく例える、「例え話を支援する」アプリです。**


※こちらは[Prisma版]バックエンドのみのリポジトリです。

最近のフロントエンドの流れを考え、ORMを使ったアプリをポートフォリオの一つとして作成しております。
Express版リポジトリを引き継いでいるため、途中から作成しております。

-----

[Prisma版]フロントエンドリポジトリ

https://github.com/london-newyork/tatoeba-frontend-prisma

<sub>[Express+MySQL版]フロントエンドリポジトリ</sub>

https://github.com/london-newyork/tatoeba-frontend

<sub>[Express+MySQL版]バックエンドを含むリポジトリ</sub>

https://github.com/london-newyork/tatoeba-api

-----


### このアプリでの機能および主なやったこと

CRUD処理/検索/eメールによるメール認証・ログイン認証/パスワード再設定/API設計/APIによるフォームと画像のCRUD処理/(他のユーザーからの評価機能/タグによるソート機能/フォローアンフォロー)

Prismaを使ったマイグレーション、型安全を実現する

# 使用技術

### 言語とツール等

```
- REST API(Open API) / Stoplight Studio 
- 言語: Node.js / Express / TypeScript
- ORM: Prisma 
- DB: PostgreSQL(途中まで) / MySQL2(PlanetScaleへ移行したため) / PlanetScale
- ストレージ: Google Cloud Storage(GCS)
- デプロイ: GCP / Cloud Run / Python3(G Cloud CLI用)
```

# 開発背景

WEB 担当として仕事をしていた時に、非エンジニア・非デザイナーの方とお話しする機会が多かったのですが、その際、WEB 独特の用語を理解していただくのに、苦労したことがありました。逆に、非エンジニア・非デザイナーの方も話を理解するのに、とても苦労されたと思っています。

ある時、わかりにくい話をわかりやすく例える「例え話」を使うと、コミュニケーションが円滑に進むことがありました。
そこから、このアプリを開発することで、同じようなことに悩んでいる方の支援ができないかと思うようになりました。

この「例え話」を支援するアプリを通して、みなさんに、円滑なコミュニケーションをしていただけたらと思っています。
