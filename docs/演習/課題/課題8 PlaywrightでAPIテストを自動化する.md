# 課題8：PlaywrightでAPIテストを自動化する

**所要時間：** 20〜30 分  
**対象：** 課題7を終えた受講者  
**前提：** ATRSがローカルで起動していること（`http://localhost:8082/atrs/`）

---

## この課題の目的

課題3では、会員番号確認APIをPostmanで**手動**で確認しました。  
この課題では、同じAPIに対してPlaywrightでテストコードを生成させ、**自動**で確認します。

コードは一切書きません。課題7と同じく、Claude Code にコードを生成させて実行します。  
**ゴールは「APIテストが自動で動く様子を確認し、課題3との違いを体感すること」です。**

---

## Step 1：Claude Code にテストコードを生成させる（5〜7分）

Claude Code を起動し、以下のプロンプトをそのままコピーして送ってください。

```
以下の条件で tests/memberApi.spec.ts を作成してください。

【テスト対象API】
会員番号確認API: GET http://localhost:8082/atrs/api/member/available

【テストケース】
- TC-A-001: 会員番号 0000000001（登録済み）→ ステータスコード 200
- TC-A-002: 会員番号 9999999999（未登録）→ ステータスコード 404

【補足】
- playwright.config.ts の baseURL（http://localhost:8082/atrs/）を使うこと
- Playwright の request フィクスチャを使うこと
- レスポンスボディの確認は不要（ステータスコードのみ確認）
```

Claude Code がファイルを作成したら完了です。中身は読まなくて構いません。

---

## Step 2：テストを実行する（3〜5分）

VS Code のターミナルで以下のコマンドを実行してください。

```
npx playwright test tests/memberApi.spec.ts
```

課題7で使った `npm run test:headed` の `--headed` は「ブラウザを画面に表示して実行する」オプションです。  
APIテストはブラウザ自体を使わないため、このオプションは不要です。

課題7と違い、**ブラウザは起動しません。**  
HTTPリクエストをプログラムが直接送信するため、画面操作が不要だからです。

---

## Step 3：結果を確認する（2〜3分）

ターミナルに以下のような結果が表示されます。

```
Running 2 tests using 1 worker

  ✓  1 [chromium] › tests\memberApi.spec.ts:10:7 › 会員番号確認 API › TC-A-001: 登録済み会員番号 → 200 (49ms)
  ✓  2 [chromium] › tests\memberApi.spec.ts:17:7 › 会員番号確認 API › TC-A-002: 未登録の会員番号 → 404 (63ms)

  2 passed (1.8s)
```

> **時間（ms）は実行環境によって変わります。** 数値は目安です。

> **`[chromium]` と表示されますが、ブラウザは起動していません。**  
> これは playwright.config.ts で設定したプロジェクト名が出力されているだけです。  
> `request` フィクスチャを使ったテストはブラウザを必要とせず、Chrome の画面は表示されません。

> **実行時間に注目してください。**  
> 課題7の5件が約7秒かかったのに対し、APIテストは2件で約2秒で終わります。  
> ブラウザの起動・描画が不要なため、テスト1件あたりの処理は数十msと大幅に高速です。

> テスト名（`TC-A-001: …`）の文字列やファイルの行番号は、Claude Code が生成したコードによって異なる場合があります。

`2 passed` が表示されれば成功です。

---

## Step 4：テスト結果をドキュメントにまとめる（3〜5分）

以下のプロンプトを Claude Code に送ってください。

```
テスト実行結果を docs/演習/結果/課題8 テスト実行結果.md として作成してください。
以下の内容を含めてください。
- 実行日
- テスト対象API（URL）
- テストケース一覧と結果（パス／フェイル）
- 合計実行時間
```

Claude Code がファイルを作成したら内容を確認してください。

---

## Step 5：Claude Code に Git 操作を依頼する（3〜5分）

以下のプロンプトを Claude Code に送ってください。

```
現在いるブランチを起点に feature/exercise-8 を作成し、以下の2ファイルをコミットしてください。
- tests/memberApi.spec.ts
- docs/演習/結果/課題8 テスト実行結果.md

コミットメッセージは適切なものを考えてください。
origin へのプッシュと、GitHub で feature/exercise-8 から main へのプルリクエスト作成まで行ってください。
```

> **`gh` コマンドが使えない場合**  
> ブラウザで以下の URL を開いて PR を作成してください。  
> `https://github.com/（自分のアカウント名）/claude-testing-training/pull/new/feature/exercise-8`  
> base を `main`、compare を `feature/exercise-8` に設定して「Create pull request」をクリックすれば完了です。

---

## 振り返り

課題3（Postman）と今回（Playwright）を比べてみましょう。

> - 課題3でPostmanを使い、2件リクエストを送るまでに何回操作しましたか？  
> - 今回は何回操作しましたか？  
> - 同じ確認を100件に増やすとしたら、どちらが現実的ですか？

---

## 参考：tests/memberApi.spec.ts の全文

Claude Code が生成したコードがうまく動かない場合は、以下をそのまま使ってください。

<details>
<summary>▶ 全文を表示（クリックで展開）</summary>

```typescript
// Playwright が提供する2つの関数を読み込む。
// test  → テストケース（「こう動かして、こう確認する」）を定義するための関数
// expect → 「〇〇であるはず」という検証（アサーション）を書くための関数
import { test, expect } from '@playwright/test';

// test.describe でテストケースをグループにまとめる。
// 第1引数の文字列はグループ名で、実行結果の画面に表示される。
test.describe('会員番号確認 API', () => {

  // ── テストケース 1 件目 ──────────────────────────────────────────────────────
  // test(...) で1件のテストケースを定義する。
  // 第1引数の文字列がテスト名（実行結果に表示される）。
  //
  // async ({ request }) の { request } は Playwright が自動的に用意してくれる
  // 組み込みの HTTP クライアント。
  // ブラウザを起動せずに API へ直接リクエストを送ることができる。
  test('TC-A-001: 登録済み会員番号 → 200', async ({ request }) => {

    // request.get(...) で HTTP GET リクエストを送る。
    // URL に / が先頭にないため、playwright.config.ts の baseURL と結合される。
    //   baseURL : http://localhost:8082/atrs/
    //   この行 : api/member/available?membershipNumber=0000000001
    //   ↓ 実際に送られる URL
    //   http://localhost:8082/atrs/api/member/available?membershipNumber=0000000001
    //
    // await はサーバーからの返答（response）が届くまで待つ指示。
    const response = await request.get('api/member/available?membershipNumber=0000000001');

    // response.status() で HTTP ステータスコードを取り出す。
    // expect(...).toBe(200) で「ステータスコードが 200 であること」を確認する。
    // → 200 以外（例：404 や 500）が返ってきたらテストは失敗（✗）になる。
    expect(response.status()).toBe(200);
  });

  // ── テストケース 2 件目 ──────────────────────────────────────────────────────
  // 構造は1件目とまったく同じ。
  // 確認するのは「存在しない会員番号を渡したとき、404 が返ること」。
  test('TC-A-002: 未登録の会員番号 → 404', async ({ request }) => {

    // 会員番号 9999999999 はATRSに登録されていない。
    const response = await request.get('api/member/available?membershipNumber=9999999999');

    // ステータスコード 404（Not Found）が返ることを確認する。
    // → 誤って 200 が返ってきた場合はテストが失敗し、仕様の誤りを検出できる。
    expect(response.status()).toBe(404);
  });
});
```

</details>
